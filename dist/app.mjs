import {CLUE_COSTS, scoreFor, findProfession, searchProfessions, consolationFor, validSavedGame} from './game-core.mjs';
import {GUESTS, getGuest, gameKey, getTheme, CLUE_TITLES} from './guests.mjs';

const $ = selector => document.querySelector(selector);
const icon = (name, cls = '') => `<svg ${cls ? `class="${cls}"` : ''} aria-hidden="true"><use href="#i-${name}"/></svg>`;
const format = number => number.toLocaleString('en-US');
const params = new URLSearchParams(location.search);
const guest = getGuest(params.get('guest'));
const GAME_KEY = gameKey(guest.id);
const STATS_KEY = 'offclock:results:v1';
const titles = CLUE_TITLES;
const captions = guest.clips;
const audio = $('#narration');
let theme = getTheme(params.get('theme') || readStorage('offclock:theme:v1', null));
let game = {clues:1, viewed:0, guesses:[], status:'playing', practice:false};
let muted = false;
let suggestions = [];
let highlighted = -1;
let speaking = false;
let speechToken = 0;

let toastTimer;
let activeClip = null;

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The round remains playable without storage. */ }
}
function applyTheme() {
  document.body.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1b1e1c' : '#eeede7';
  $('#theme-button').innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  $('#theme-button').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  $('#theme-button').setAttribute('aria-pressed', String(theme === 'dark'));
}
applyTheme();
$('.guest-portrait').src = guest.portrait;
$('#meet-name').textContent = `Meet ${guest.name}`;
$('#meet-subtitle').textContent = `Mystery guest · No. ${guest.number}`;
$('#guest-name').textContent = guest.name.toUpperCase();
$('#guest-age').textContent = `${guest.age} YEARS OLD`;
$('#guest-location').textContent = guest.location.toUpperCase();
$('#edition-number').textContent = `NO. ${guest.number}`;
$('#profession-label').textContent = `What does ${guest.name} do?`;
document.title = `Meet ${guest.name} — Offclock`;
const saved = readStorage(GAME_KEY, null);
if (validSavedGame(saved, guest.answer)) game = {...saved, viewed:Math.max(0, Math.min(saved.clues-1, Number(saved.viewed)||0)), practice:false};
let results = readStorage(STATS_KEY, []);
if (!Array.isArray(results)) results = [];
results = results.filter(result => result && GUESTS.some(item => item.number === result.id) && Number.isFinite(result.score) && typeof result.won === 'boolean');

function save() { if (!game.practice) writeStorage(GAME_KEY, game); }
function currentScore() {
  if (game.status === 'lost' || game.status === 'gaveup') return consolationFor(game.guesses, guest.answer);
  return scoreFor(game.clues, game.guesses.filter(g => g !== guest.answer).length);
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
function stopAudio() {
  speechToken++;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  activeClip = null;
  speaking = false;
  renderPlayback();
}
function renderPlayback() {
  $('.caption-region').classList.toggle('playing', speaking);
  $('#replay-button').innerHTML = icon(speaking ? 'pause' : 'play') + `<span id="replay-label">${speaking ? 'Pause the story' : 'Listen to the story'}</span>`;
  $('#replay-button').setAttribute('aria-label', speaking ? 'Pause narration' : 'Listen to this clue');
  $('.play-circle').innerHTML = icon(speaking ? 'pause' : 'play');
}
function playClue() {
  if (speaking) { audio.pause(); speaking = false; renderPlayback(); return; }
  if (muted) { muted = false; renderSound(); }
  const token = ++speechToken;
  if (activeClip !== game.viewed) {
    audio.src = captions[game.viewed].audio;
    activeClip = game.viewed;
  }
  if (audio.ended) audio.currentTime = 0;
  speaking = true;
  renderPlayback();
  audio.play().catch(() => {
    if (token !== speechToken) return;
    speaking = false;
    renderPlayback();
    toast('The recording couldn’t play. Tap to retry, or read the complete clue on screen.');
  });
}
audio.addEventListener('ended', () => { speaking = false; renderPlayback(); });
audio.addEventListener('loadedmetadata', () => {
  if (Number.isFinite(audio.duration)) $('#caption-duration').textContent = formatTime(audio.duration);
});
function formatTime(seconds) { return `${Math.floor(seconds/60)}:${String(Math.ceil(seconds%60)).padStart(2,'0')}`; }
let durations = {};
fetch('assets/audio/manifest.json').then(response => response.ok ? response.json() : {}).then(data => { durations = data; renderDuration(); }).catch(() => {});
function renderDuration() {
  const duration = durations[`${guest.id}-${game.viewed+1}`]?.duration;
  $('#caption-duration').textContent = duration ? formatTime(duration) : 'AUDIO';
}
function renderSound() {
  $('#sound-button').innerHTML = icon(muted ? 'muted' : 'sound');
  $('#sound-button').setAttribute('aria-label', muted ? 'Enable narration' : 'Mute narration');
  $('#sound-button').setAttribute('aria-pressed', String(muted));
}
function render() {
  const finished = game.status !== 'playing';
  const score = currentScore();
  $('#score').textContent = format(score);
  $('#score-meter-fill').style.width = `${score / 100}%`;
  $('#guess-dots').innerHTML = Array.from({length:3}, (_, i) => `<i class="${i < game.guesses.length ? 'used' : ''}"></i>`).join('');
  $('#guess-dots').setAttribute('aria-label', `${Math.max(0, 3-game.guesses.length)} guesses remaining`);
  $('#guess-prompt').textContent = finished ? (game.status === 'won' ? 'You saw the person behind the job.' : 'Every person has a story.') : game.guesses.length ? `${3-game.guesses.length} ${game.guesses.length === 2 ? 'guess' : 'guesses'} left. Follow your curiosity.` : 'Trust your first impression.';
  $('#profession').disabled = finished;
  $('#submit-guess').disabled = false;
  $('#submit-guess').type = finished ? 'button' : 'submit';
  $('#submit-guess').innerHTML = `<span>${finished ? 'See the reveal' : 'Lock in my guess'}</span>${icon('arrow')}`;
  $('#caption-label').textContent = captions[game.viewed].label;
  $('#caption-text').textContent = `“${captions[game.viewed].text}”`;
  renderDuration();
  $('#clue-count').textContent = String(game.clues).padStart(2, '0');
  $('#clue-track').innerHTML = titles.map((title, index) => `<button class="clue-step ${index < game.clues ? 'unlocked' : ''} ${index === game.viewed ? 'active' : ''}" data-clue="${index}" ${index >= game.clues && !finished ? 'disabled' : ''} aria-label="${index < game.clues || finished ? 'Replay' : 'Locked'} clue ${index+1}: ${title}" ${index === game.viewed ? 'aria-current="step"' : ''}><span class="step-number">0${index+1}</span>${icon(index < game.clues || finished ? 'play' : 'lock')}<span class="step-title">${title}</span></button>`).join('');
  $('#reveal-button').disabled = game.clues === 8 || finished;
  $('#reveal-label').textContent = finished ? 'The story is yours' : game.clues === 8 ? 'You have every clue' : 'Reveal next clue';
  $('#reveal-price').innerHTML = game.clues < 8 && !finished ? `−${format(CLUE_COSTS[game.clues])} pts ${icon('arrow')}` : icon('check');
  $('#clue-tip').textContent = finished ? 'A little less guessing. A little more understanding.' : game.clues === 8 ? 'All the pieces are here. What’s your guess?' : 'A little more insight. A few fewer points.';
  $('#guess-history').innerHTML = game.guesses.map(name => `<span class="history-chip ${name === guest.answer ? 'correct' : ''}">${icon(name === guest.answer ? 'check' : 'close')}${name}</span>`).join('');
  if (finished) { $('#guess-feedback').textContent = game.practice ? 'Practice round complete. Your original score is saved.' : 'Your result is saved on this device.'; $('#guess-feedback').classList.remove('error'); }
  renderPlayback();
}
function flashScore() {
  $('#score').classList.remove('score-flash');
  requestAnimationFrame(() => $('#score').classList.add('score-flash'));
}
function showClue(index, speak = false) {
  stopAudio();
  game.viewed = index;
  save();
  render();
  $('.caption-region').classList.remove('caption-change');
  requestAnimationFrame(() => $('.caption-region').classList.add('caption-change'));
  if (speak && !muted) playClue();
}
function clearSuggestions() {
  suggestions = [];
  highlighted = -1;
  $('#profession-options').hidden = true;
  $('#profession').setAttribute('aria-expanded', 'false');
  $('#profession').removeAttribute('aria-activedescendant');
}
function renderSuggestions() {
  const input = $('#profession');
  suggestions = searchProfessions(input.value);
  highlighted = -1;
  if (!input.value.trim()) { clearSuggestions(); return; }
  $('#profession-options').innerHTML = suggestions.length ? suggestions.map((p, i) => `<li role="option" id="option-${i}" data-option="${i}" aria-selected="false">${p.name}<span>↵</span></li>`).join('') : '<li class="empty-option" role="presentation">No match yet. Try a broader title or another name for the job.</li>';
  $('#profession-options').hidden = false;
  input.setAttribute('aria-expanded', 'true');
}
function selectSuggestion(index) {
  const profession = suggestions[index];
  if (!profession) return;
  $('#profession').value = profession.name;
  clearSuggestions();
  $('#profession').focus();
}
function openModal(content, {library = false} = {}) {
  stopAudio();
  $('#modal-content').innerHTML = content;
  $('#modal').classList.toggle('guest-library', library);
  const title = $('#modal-content h2');
  if (title) title.id = 'modal-title';
  if (!$('#modal').open) $('#modal').showModal();
}
function closeModal() {$('#modal').close();}
function recordResult() {
  if (game.practice || results.some(result => result.id === guest.number)) return;
  results.push({id:guest.number, score:currentScore(), won:game.status === 'won', date:new Date().toISOString(), clues:game.clues, guesses:game.guesses.length});
  writeStorage(STATS_KEY, results);
}
function finish(status) {
  game.status = status;
  stopAudio();
  save();
  recordResult();
  clearSuggestions();
  render();
  showResult();
}
function showResult() {
  if (game.status === 'playing') return;
  const won = game.status === 'won';
  const wrongCount = game.guesses.filter(g => g !== guest.answer).length;
  openModal(`<span class="modal-eyebrow">${icon(won ? 'check' : 'search')} THE PERSON BEHIND THE PROFESSION</span><h2>${guest.reveal}</h2><p><strong>${guest.name} is ${/^[aeiou]/i.test(guest.answer) ? 'an' : 'a'} ${guest.answer.toLowerCase()}.</strong> ${guest.description}</p><div class="score-ticket"><div><div class="ticket-label">${game.practice ? 'PRACTICE SCORE' : 'YOUR FINAL SCORE'}</div><div class="ticket-score">${format(currentScore())}<small style="font-size:17px;letter-spacing:0"> pts</small></div></div><div class="ticket-meta">${game.clues} of 8 clues<br>${game.guesses.length} of 3 guesses<br>${won ? `${wrongCount} ${wrongCount === 1 ? 'miss' : 'misses'}` : currentScore() > 0 ? 'Related profession credit' : 'A new perspective'}</div></div><p class="reveal-explanation">${guest.connection}</p><div class="share-grid" aria-label="${game.clues} clues revealed">${Array.from({length:8},(_,i) => i < game.clues ? '🟩' : '⬜').join('')}</div><button class="modal-primary" data-action="guests">Meet another person ${icon('arrow')}</button><button class="modal-secondary" data-action="share">Copy my result</button><button class="modal-secondary" data-action="close">Revisit the clues</button>${game.practice ? '' : '<button class="modal-secondary" data-action="practice">Play again for practice</button>'}`);
}
function showHow() {
  openModal(`<span class="modal-eyebrow">A SMALL DAILY DISCOVERY</span><h2>Curiosity pays.</h2><p>Meet a person. Listen to their stories. Guess what they do for a living.</p><ol class="rules-list"><li><div><strong>Start with 10,000 points.</strong>Your first clue is free. Trust your instinct, or keep listening.</div></li><li><div><strong>Eight clues. Each a little more revealing.</strong>The next clues cost 250, 500, 750, 1,000, 1,250, 1,500, and 1,750 points. The price is always shown before you reveal one.</div></li><li><div><strong>Three guesses. Make them count.</strong>Each wrong guess multiplies your available score by 70%. Clue costs are applied before these penalties; the score is rounded to the nearest 10.</div></li><li><div><strong>A good hunch still counts.</strong>If you don’t solve it, your closest guess earns 1,000 points for the same job family, 500 for the same broad field, or 0 for an unrelated job. Any correct solve beats partial credit.</div></li></ol><button class="modal-primary" data-action="close">Back to the story ${icon('arrow')}</button><button class="modal-secondary" data-action="giveup">Give up and see the reveal</button>`);
}
function showStats() {
  const completed = results.length;
  const wins = results.filter(result => result.won).length;
  const best = Math.max(0,...results.map(result => result.score));
  openModal(`<span class="modal-eyebrow">YOUR CURIOSITY, BY THE NUMBERS</span><h2>A good eye for people.</h2><div class="stats-grid"><div class="stats-cell"><strong>${completed}</strong><span>Rounds played</span></div><div class="stats-cell"><strong>${completed ? Math.round(wins/completed*100) : 0}%</strong><span>Solve rate</span></div><div class="stats-cell"><strong>${format(best)}</strong><span>Best score</span></div></div><p>${completed ? 'A little curiosity goes a long way. Each guest has a separate saved result. Practice rounds keep those original scores intact.' : 'Your story starts here. Finish your first round to see your results.'}</p><button class="modal-primary" data-action="close">${game.status === 'playing' ? 'Back to today’s guest' : 'Back to the clues'} ${icon('arrow')}</button><p class="modal-note">Your progress and statistics are stored on this device.</p>`);
}
function showArchive() {
  const completed = results.length;
  openModal(`<span class="modal-eyebrow">SIX PEOPLE. SIX DIFFERENT WORLDS.</span><h2>Who’s off the clock?</h2><p>Same game. A completely different story. Choose someone to meet—your progress with each person is saved.</p><div class="collection-progress"><span>THE FIRST COLLECTION</span><span>${completed} / 6 DISCOVERED</span></div><div class="guest-grid">${GUESTS.map(person => {
    const saved = readStorage(gameKey(person.id),null);
    const result = results.find(item => item.id === person.number);
    const status = result ? `${format(result.score)} pts · ${result.won ? 'Solved' : 'Revealed'}` : person.id === guest.id ? 'Your current guest' : validSavedGame(saved,person.answer) && (saved.clues > 1 || saved.guesses.length) ? 'Continue the story' : 'Meet the mystery';
    return `<button class="guest-card ${person.id === guest.id ? 'current' : ''}" data-guest="${person.id}" aria-label="Meet ${person.name}. ${status}"><span class="guest-card-photo" style="--guest-color:${person.color}"><span class="guest-card-number">NO. ${person.number}</span><img src="${person.portrait}" alt="" loading="lazy"><span class="guest-card-arrow">${icon(result ? 'check' : 'arrow')}</span></span><span class="guest-card-heading"><strong>${person.name}<small>${person.age}</small></strong><span>${person.location}</span></span><span class="guest-card-teaser">${person.teaser}</span><span class="guest-card-status">${status}</span></button>`;
  }).join('')}</div><p class="collection-note">Six faces. Eight clues each. How well do you read people?</p>`, {library:true});
}
function showAbout() {
  openModal(`<span class="modal-eyebrow">OFFCLOCK, ON PURPOSE</span><h2>There’s a person<br>behind every job.</h2><p>Offclock is a profession-guessing game built around the small details of someone’s working life. A habit. An unexpected tool. A story they bring home.</p><p>One person. Eight clues. Three guesses. Follow your curiosity and discover a world you might otherwise walk right past.</p><p class="modal-note">This first collection features six fictional characters, AI-generated portraits, and AI-generated narration made with <a href="https://huggingface.co/hexgrad/Kokoro-82M" target="_blank" rel="noreferrer">Kokoro</a>. The stories describe real professions. This is a playable reference collection; a new daily release schedule will follow.</p><button class="modal-primary" data-action="guests">Meet the collection ${icon('arrow')}</button><button class="modal-secondary" data-action="how">How to play</button>`);
}
function resetForPractice() {
  stopAudio();
  game = {clues:1, viewed:0, guesses:[], status:'playing', practice:true};
  $('#profession').value = '';
  $('#guess-feedback').textContent = 'Practice round. Your original result stays saved.';
  $('#guess-feedback').classList.remove('error');
  clearSuggestions();
  closeModal();
  render();
}
function shareResult() {
  const statusText = game.status === 'won' ? `${format(currentScore())} / 10,000` : `${format(currentScore())} pts · ${game.status === 'gaveup' ? 'Revealed' : 'Unsolved'}`;
  const shareUrl = new URL(location.pathname, location.origin);
  shareUrl.searchParams.set('guest', guest.id);
  const text = `Offclock #${guest.number}${game.practice ? ' · Practice' : ''}\n${statusText}\n${game.clues}/8 clues · ${game.guesses.length}/3 guesses\n${Array.from({length:8},(_,i) => i < game.clues ? '🟩' : '⬜').join('')}\n${shareUrl}`;
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => toast('Result copied. Keep the profession a mystery.')).catch(() => shareFallback(text));
  else shareFallback(text);
}
function shareFallback(text) {
  const area = document.createElement('textarea');
  area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
  ($('#modal').open ? $('#modal-content') : document.body).append(area);
  area.select();
  const success = document.execCommand('copy');
  area.remove();
  if (success) toast('Result copied. Keep the profession a mystery.');
  else {openModal(`<span class="modal-eyebrow">SHARE YOUR CURIOSITY</span><h2>Your result.</h2><p id="share-fallback" style="white-space:pre-line"></p><button class="modal-primary" data-action="close">Done</button>`);$('#share-fallback').textContent = text;}
}

$('#profession').addEventListener('input', renderSuggestions);
$('#profession').addEventListener('focus', () => {if ($('#profession').value.trim()) renderSuggestions();});
$('#profession-options').addEventListener('mousedown', event => {const option=event.target.closest('[data-option]');if(option){event.preventDefault();selectSuggestion(Number(option.dataset.option));}});
$('#profession-options').addEventListener('click', event => {const option=event.target.closest('[data-option]');if(option) selectSuggestion(Number(option.dataset.option));});
document.addEventListener('click', event => {if (!event.target.closest('.search-wrap')) clearSuggestions();});
$('#profession').addEventListener('keydown', event => {
  if (event.key === 'Escape') {clearSuggestions();return;}
  if (['ArrowDown','ArrowUp'].includes(event.key)) {
    event.preventDefault();
    if (!suggestions.length) renderSuggestions();
    if (!suggestions.length) return;
    highlighted = (highlighted + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length;
    $('#profession-options').querySelectorAll('[role=option]').forEach((el,i) => el.setAttribute('aria-selected', String(i === highlighted)));
    $('#profession').setAttribute('aria-activedescendant', `option-${highlighted}`);
    $(`#option-${highlighted}`).scrollIntoView({block:'nearest'});
  }
  if (event.key === 'Enter' && highlighted >= 0 && !$('#profession-options').hidden) {event.preventDefault();selectSuggestion(highlighted);}
});
$('#guess-form').addEventListener('submit', event => {
  event.preventDefault();
  if (game.status !== 'playing') {showResult();return;}
  const profession = findProfession($('#profession').value);
  $('#guess-feedback').classList.add('error');
  if (!profession) {$('#guess-feedback').textContent = 'Choose a profession from the list. No guess spent.';renderSuggestions();return;}
  if (game.guesses.includes(profession.name)) {$('#guess-feedback').textContent = 'You’ve tried that one. No guess spent.';return;}
  game.guesses.push(profession.name);
  $('#profession').value = '';
  clearSuggestions();
  flashScore();
  if (profession.name === guest.answer) {finish('won');return;}
  if (game.guesses.length === 3) {finish('lost');return;}
  const target = findProfession(guest.answer);
  const related = profession.family === target.family ? 'A related craft. Keep listening.' : profession.field === target.field ? 'You’re in the right broad field. Keep listening.' : 'That’s not the profession. Keep listening.';
  $('#guess-feedback').textContent = `${related} −30% points.`;
  save(); render();
});
$('#submit-guess').addEventListener('click', () => {if (game.status !== 'playing') showResult();});
$('#reveal-button').addEventListener('click', () => {
  if (game.status !== 'playing' || game.clues === 8) return;
  stopAudio();
  game.clues++;
  showClue(game.clues-1, true);
  flashScore();
  $('#guess-feedback').classList.remove('error');
  $('#guess-feedback').textContent = `${3-game.guesses.length} guesses left. A little more to go on.`;
});
$('#clue-track').addEventListener('click', event => {const button = event.target.closest('[data-clue]');if(button && !button.disabled) showClue(Number(button.dataset.clue), true);});
$('#replay-button').addEventListener('click', playClue);
$('#meet-button').addEventListener('click', () => {if (game.viewed !== 0) showClue(0, true);else playClue();});
$('#sound-button').addEventListener('click', () => {muted = !muted;if(muted)stopAudio();renderSound();});
$('#how-button').addEventListener('click', showHow);
$('#theme-button').addEventListener('click', () => {theme = theme === 'light' ? 'dark' : 'light'; writeStorage('offclock:theme:v1',theme); applyTheme();});
$('#stats-button').addEventListener('click', showStats);
$('#archive-button').addEventListener('click', showArchive);
$('#about-button').addEventListener('click', showAbout);
$('#modal-close').addEventListener('click', closeModal);
$('#modal').addEventListener('click', event => {
  if (event.target === $('#modal')) {const rect=$('#modal').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}
  const action=event.target.closest('[data-action]')?.dataset.action;
  const personId = event.target.closest('[data-guest]')?.dataset.guest;
  if (personId) {
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('guest',personId);
    stopAudio();
    location.assign(url);
    return;
  }
  if (action === 'guests') showArchive();
  if (action === 'how') showHow();
  if (action === 'close') closeModal();
  if (action === 'share') shareResult();
  if (action === 'practice') resetForPractice();
  if (action === 'archive-current') {if(game.status==='playing')closeModal();else showResult();}
  if (action === 'giveup') {
    if(game.status!=='playing'){showResult();return;}
    openModal(`<span class="modal-eyebrow">END THIS ROUND</span><h2>Ready for the full story?</h2><p>Revealing ${guest.name}’s profession ends this round. You’ll receive ${format(consolationFor(game.guesses, guest.answer))} points from your closest guess.</p><button class="modal-primary" data-action="confirm-giveup">Reveal ${guest.name}’s profession ${icon('arrow')}</button><button class="modal-secondary" data-action="close">I’ll keep guessing</button>`);
  }
  if (action === 'confirm-giveup') {closeModal();finish('gaveup');}
});
document.addEventListener('visibilitychange', () => {if (document.hidden) stopAudio();});
window.addEventListener('pagehide', stopAudio);
render();
if (params.get('view') === 'guests' || params.get('view') === 'designs') showArchive();
