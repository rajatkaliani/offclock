import {CLUE_COSTS, scoreFor, findProfession, searchProfessions, consolationFor, validSavedGame, normalize, formatDuration, plural, shareSummary} from './game-core.mjs';
import {GUESTS, CLUE_TITLES, getGuest, gameKey, getTheme, nextGuest} from './guests.mjs';
import {VOICE_SETTINGS} from './voice-settings.mjs';

const $ = selector => document.querySelector(selector);
const icon = (name, cls = '') => `<svg ${cls ? `class="${cls}"` : ''} aria-hidden="true"><use href="#i-${name}"/></svg>`;
const format = number => number.toLocaleString('en-US');
const STATS_KEY = 'offclock:results:v1';
const THEME_KEY = 'offclock:theme:v1';

const params = new URLSearchParams(location.search);
const guest = getGuest(params.get('guest'));
const GAME_KEY = gameKey(guest.id);
const target = findProfession(guest.answer);
const audio = $('#narration');
const input = $('#profession');
const feedback = $('#guess-feedback');

const requestedTheme = () => [params.get('theme'), readStorage(THEME_KEY, null)].find(value => getTheme(value) === value);
let theme = getTheme(requestedTheme(), matchMedia('(prefers-color-scheme: dark)').matches);
let game = newGame(false);
let results = loadResults();
let muted = false;
let speaking = false;
let speechToken = 0;
let activeClip = null;
let durations = {};
let suggestions = [];
let highlighted = -1;
let toastTimer;

function newGame(practice) { return {clues:1, viewed:0, guesses:[], status:'playing', practice}; }
function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The round remains playable without storage. */ }
}
function loadResults() {
  const stored = readStorage(STATS_KEY, []);
  return (Array.isArray(stored) ? stored : []).filter(result => result && GUESTS.some(item => item.number === result.id) && Number.isFinite(result.score) && typeof result.won === 'boolean');
}
function loadGame() {
  const saved = readStorage(GAME_KEY, null);
  if (!validSavedGame(saved, guest.answer)) return newGame(false);
  return {...saved, viewed:Math.max(0, Math.min(saved.status === 'playing' ? saved.clues - 1 : 7, Number(saved.viewed) || 0)), practice:false};
}
const finishedNumbers = () => results.map(result => result.id);
const misses = () => game.guesses.filter(name => name !== guest.answer).length;
const guessesLeft = () => 3 - game.guesses.length;
const isFinished = () => game.status !== 'playing';

function save() { if (!game.practice) writeStorage(GAME_KEY, game); }
function currentScore() {
  return game.status === 'lost' || game.status === 'gaveup' ? consolationFor(game.guesses, guest.answer) : scoreFor(game.clues, misses());
}
function recordResult() {
  if (game.practice || results.some(result => result.id === guest.number)) return;
  results.push({id:guest.number, score:currentScore(), won:game.status === 'won', date:new Date().toISOString(), clues:game.clues, guesses:game.guesses.length});
  writeStorage(STATS_KEY, results);
}
function setFeedback(message, error = false) {
  feedback.textContent = message;
  feedback.classList.toggle('error', error);
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}

/* Theme */
function applyTheme() {
  const dark = theme === 'dark';
  document.body.dataset.theme = theme;
  $('meta[name="theme-color"]').content = dark ? '#1b1e1c' : '#eeede7';
  $('#theme-button').innerHTML = icon(dark ? 'sun' : 'moon');
  $('#theme-button').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
  $('#theme-button').setAttribute('aria-pressed', String(dark));
}

/* Narration */
function stopAudio() {
  speechToken++;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  activeClip = null;
  speaking = false;
  renderPlayback();
}
function playbackFailed() {
  speaking = false;
  activeClip = null;
  renderPlayback();
  toast('The recording couldn’t play. Tap to retry, or read the clue on screen.');
}
function playClue() {
  if (speaking) { audio.pause(); speaking = false; renderPlayback(); return; }
  if (muted) { muted = false; renderSound(); }
  const token = ++speechToken;
  if (activeClip !== game.viewed) {
    audio.src = guest.clips[game.viewed].audio;
    activeClip = game.viewed;
  }
  if (audio.ended) audio.currentTime = 0;
  speaking = true;
  renderPlayback();
  audio.play().catch(error => { if (token === speechToken && error.name !== 'AbortError') playbackFailed(); });
}
function renderPlayback() {
  $('.caption-region').classList.toggle('playing', speaking);
  $('#replay-button').innerHTML = `${icon(speaking ? 'pause' : 'play')}<span id="replay-label">${speaking ? 'Pause the story' : 'Listen to the story'}</span>`;
  $('#replay-button').setAttribute('aria-label', speaking ? 'Pause narration' : 'Listen to this clue');
  $('.play-circle').innerHTML = icon(speaking ? 'pause' : 'play');
}
function renderSound() {
  $('#sound-button').innerHTML = icon(muted ? 'muted' : 'sound');
  $('#sound-button').setAttribute('aria-label', muted ? 'Enable narration' : 'Mute narration');
  $('#sound-button').setAttribute('aria-pressed', String(muted));
}
function renderDuration() {
  const duration = durations[`${guest.id}-${game.viewed + 1}`]?.duration;
  $('#caption-duration').textContent = duration ? formatDuration(duration) : 'AUDIO';
}

/* Board */
function guessPrompt() {
  if (game.status === 'won') return 'You saw the person behind the job.';
  if (isFinished()) return 'Every person has a story.';
  return game.guesses.length ? `${plural(guessesLeft(), 'guess')} left. Follow your curiosity.` : 'Trust your first impression.';
}
function restingFeedback() {
  if (isFinished()) return game.practice ? 'Practice round complete. Your original score is saved.' : 'Your result is saved on this device.';
  if (game.practice) return 'Practice round. Your original result stays saved.';
  return game.guesses.length ? 'Unknown or repeated guesses are free.' : 'Three guesses. Make them count.';
}
function renderClueTrack() {
  const finished = isFinished();
  const focused = document.activeElement?.closest?.('[data-clue]')?.dataset.clue;
  $('#clue-track').innerHTML = CLUE_TITLES.map((title, index) => {
    const open = index < game.clues || finished;
    const classes = ['clue-step', open && 'unlocked', index === game.viewed && 'active'].filter(Boolean).join(' ');
    return `<button class="${classes}" data-clue="${index}" ${open ? '' : 'disabled'} aria-label="${open ? 'Replay' : 'Locked'} clue ${index + 1}: ${title}" ${index === game.viewed ? 'aria-current="step"' : ''}><span class="step-number">0${index + 1}</span>${icon(open ? 'play' : 'lock')}<span class="step-title">${title}</span></button>`;
  }).join('');
  if (focused !== undefined) $(`[data-clue="${focused}"]`)?.focus();
}
function render() {
  const finished = isFinished();
  const score = currentScore();
  const clip = guest.clips[game.viewed];
  $('#score').textContent = format(score);
  $('#score-meter-fill').style.width = `${score / 100}%`;
  $('#guess-dots').innerHTML = Array.from({length:3}, (_, i) => `<i class="${i < game.guesses.length ? 'used' : ''}"></i>`).join('');
  $('#guess-dots').setAttribute('aria-label', `${plural(Math.max(0, guessesLeft()), 'guess')} remaining`);
  $('#guess-prompt').textContent = guessPrompt();
  input.disabled = finished;
  $('#submit-guess').type = finished ? 'button' : 'submit';
  $('#submit-guess').innerHTML = `<span>${finished ? 'See the reveal' : 'Lock in my guess'}</span>${icon('arrow')}`;
  $('#giveup-button').hidden = finished || (game.clues === 1 && !game.guesses.length);
  $('#caption-label').textContent = clip.label;
  $('#caption-text').textContent = `“${clip.text}”`;
  renderDuration();
  $('#clue-count').textContent = String(game.clues).padStart(2, '0');
  renderClueTrack();
  $('#reveal-button').disabled = game.clues === 8 || finished;
  $('#reveal-label').textContent = finished ? 'The story is yours' : game.clues === 8 ? 'You have every clue' : 'Reveal next clue';
  $('#reveal-price').innerHTML = game.clues < 8 && !finished ? `−${format(CLUE_COSTS[game.clues])} pts ${icon('arrow')}` : icon('check');
  $('#guess-history').innerHTML = game.guesses.map(name => `<span class="history-chip ${name === guest.answer ? 'correct' : ''}">${icon(name === guest.answer ? 'check' : 'close')}${name}</span>`).join('');
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
function revealNextClue() {
  if (isFinished() || game.clues === 8) return;
  game.clues++;
  showClue(game.clues - 1, true);
  flashScore();
  setFeedback(`${plural(guessesLeft(), 'guess')} left. A little more to go on.`);
}

/* Guessing */
function matchedAlias(profession, query) {
  const q = normalize(query);
  return normalize(profession.name).includes(q) ? '' : profession.aliases.find(alias => normalize(alias).includes(q)) || '';
}
function clearSuggestions() {
  suggestions = [];
  highlighted = -1;
  $('#profession-options').hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}
function renderSuggestions() {
  if (!input.value.trim()) { clearSuggestions(); return; }
  suggestions = searchProfessions(input.value);
  highlighted = -1;
  input.removeAttribute('aria-activedescendant');
  $('#profession-options').innerHTML = suggestions.length
    ? suggestions.map((p, i) => {
      const alias = matchedAlias(p, input.value);
      return `<li role="option" id="option-${i}" data-option="${i}" aria-selected="false"><span class="option-name">${p.name}${alias ? `<small> · ${alias}</small>` : ''}</span><span aria-hidden="true">↵</span></li>`;
    }).join('')
    : '<li class="empty-option" role="presentation">No match yet. Try a broader title or another name for the job.</li>';
  $('#profession-options').hidden = false;
  input.setAttribute('aria-expanded', 'true');
}
function highlight(index) {
  highlighted = index;
  $('#profession-options').querySelectorAll('[role=option]').forEach((el, i) => el.setAttribute('aria-selected', String(i === index)));
  input.setAttribute('aria-activedescendant', `option-${index}`);
  $(`#option-${index}`)?.scrollIntoView({block:'nearest'});
}
function selectSuggestion(index) {
  const profession = suggestions[index];
  if (!profession) return;
  input.value = profession.name;
  clearSuggestions();
  input.focus();
}
function submitGuess() {
  if (isFinished()) { showResult(); return; }
  const profession = findProfession(input.value);
  if (!profession) {
    const options = searchProfessions(input.value);
    if (options.length === 1) {
      input.value = options[0].name;
      clearSuggestions();
      setFeedback(`Did you mean ${options[0].name}? Press Enter to lock it in. No guess spent.`);
      return;
    }
    setFeedback(input.value.trim() ? 'Choose a profession from the list. No guess spent.' : 'Type a profession to make a guess.', true);
    renderSuggestions();
    return;
  }
  if (game.guesses.includes(profession.name)) { setFeedback('You’ve tried that one. No guess spent.', true); return; }
  game.guesses.push(profession.name);
  input.value = '';
  clearSuggestions();
  flashScore();
  if (profession.name === guest.answer) { finish('won'); return; }
  if (game.guesses.length === 3) { finish('lost'); return; }
  const hint = profession.family === target.family ? 'A related craft. Keep listening.'
    : profession.field === target.field ? 'You’re in the right broad field. Keep listening.'
    : 'That’s not the profession. Keep listening.';
  setFeedback(`${hint} −30% points.`, true);
  save();
  render();
}
function finish(status) {
  game.status = status;
  stopAudio();
  save();
  recordResult();
  clearSuggestions();
  setFeedback(restingFeedback());
  render();
  showResult();
}

/* Dialogs */
function openModal(content, {library = false} = {}) {
  stopAudio();
  $('#modal-content').innerHTML = content;
  $('#modal').classList.toggle('guest-library', library);
  const title = $('#modal-content h2');
  if (title) title.id = 'modal-title';
  if (!$('#modal').open) $('#modal').showModal();
  $('#modal-content').scrollTop = 0;
}
function closeModal() { $('#modal').close(); }
function nextGuestButton() {
  const next = nextGuest(guest.id, finishedNumbers());
  return next
    ? `<button class="modal-primary" data-guest="${next.id}">Meet ${next.name} ${icon('arrow')}</button><button class="modal-secondary" data-action="guests">See all six guests</button>`
    : `<button class="modal-primary" data-action="guests">You’ve met everyone. See the collection ${icon('arrow')}</button>`;
}
function showResult() {
  if (!isFinished()) return;
  const won = game.status === 'won';
  const score = currentScore();
  const detail = won ? plural(misses(), 'miss') : score > 0 ? 'Related profession credit' : 'A new perspective';
  openModal(`<span class="modal-eyebrow">${icon(won ? 'check' : 'search')} THE PERSON BEHIND THE PROFESSION</span>
    <h2>${guest.reveal}</h2>
    <p><strong>${guest.answer}.</strong> ${guest.description}</p>
    <div class="score-ticket"><div><div class="ticket-label">${game.practice ? 'PRACTICE SCORE' : 'YOUR FINAL SCORE'}</div><div class="ticket-score">${format(score)}<small> pts</small></div></div><div class="ticket-meta">${game.clues} of 8 clues<br>${game.guesses.length} of 3 guesses<br>${detail}</div></div>
    <p class="reveal-explanation">${guest.connection}</p>
    <div class="share-grid" aria-label="${plural(game.clues, 'clue')} revealed">${Array.from({length:8}, (_, i) => i < game.clues ? '🟩' : '⬜').join('')}</div>
    ${nextGuestButton()}
    <button class="modal-secondary" data-action="share">Copy my result</button>
    <button class="modal-secondary" data-action="close">Revisit the clues</button>
    <button class="modal-secondary" data-action="practice">Play again for practice</button>`);
}
function showHow() {
  openModal(`<span class="modal-eyebrow">A SMALL DAILY DISCOVERY</span><h2>Curiosity pays.</h2>
    <p>Meet a person. Listen to their stories. Guess what they do for a living.</p>
    <ol class="rules-list">
      <li><div><strong>Start with 10,000 points.</strong>Your first clue is free. Trust your instinct, or keep listening.</div></li>
      <li><div><strong>Eight clues. Each a little more revealing.</strong>The next clues cost 250, 500, 750, 1,000, 1,250, 1,500, and 1,750 points. The price is always shown before you reveal one.</div></li>
      <li><div><strong>Three guesses. Make them count.</strong>Each wrong guess multiplies your available score by 70%. Clue costs are applied before these penalties; the score is rounded to the nearest 10. Unknown or repeated guesses are free.</div></li>
      <li><div><strong>A good hunch still counts.</strong>If you don’t solve it, your closest guess earns 1,000 points for the same job family, 500 for the same broad field, or 0 for an unrelated job. Any correct solve beats partial credit.</div></li>
    </ol>
    <button class="modal-primary" data-action="close">${isFinished() ? 'Back to the clues' : 'Back to the story'} ${icon('arrow')}</button>
    ${isFinished() ? '' : '<button class="modal-secondary" data-action="giveup">Give up and see the reveal</button>'}`);
}
function confirmGiveUp() {
  if (isFinished()) { showResult(); return; }
  const credit = consolationFor(game.guesses, guest.answer);
  openModal(`<span class="modal-eyebrow">END THIS ROUND</span><h2>Ready for the full story?</h2>
    <p>Revealing ${guest.name}’s profession ends this round. ${game.guesses.length ? `You’ll receive ${format(credit)} points from your closest guess.` : 'With no guesses made, this round scores 0 points.'}</p>
    <button class="modal-primary" data-action="confirm-giveup">Reveal ${guest.name}’s profession ${icon('arrow')}</button>
    <button class="modal-secondary" data-action="close">I’ll keep guessing</button>`);
}
function showStats() {
  const completed = results.length;
  const wins = results.filter(result => result.won).length;
  const best = Math.max(0, ...results.map(result => result.score));
  openModal(`<span class="modal-eyebrow">YOUR CURIOSITY, BY THE NUMBERS</span><h2>A good eye for people.</h2>
    <div class="stats-grid"><div class="stats-cell"><strong>${completed}</strong><span>Rounds played</span></div><div class="stats-cell"><strong>${completed ? Math.round(wins / completed * 100) : 0}%</strong><span>Solve rate</span></div><div class="stats-cell"><strong>${format(best)}</strong><span>Best score</span></div></div>
    <p>${completed ? 'A little curiosity goes a long way. Each guest has a separate saved result. Practice rounds keep those original scores intact.' : 'Your story starts here. Finish your first round to see your results.'}</p>
    <button class="modal-primary" data-action="close">${isFinished() ? 'Back to the clues' : 'Back to your guest'} ${icon('arrow')}</button>
    <p class="modal-note">Your progress and statistics are stored on this device.</p>`);
}
function guestStatus(person) {
  const result = results.find(item => item.id === person.number);
  if (result) return `${format(result.score)} pts · ${result.won ? 'Solved' : 'Revealed'}`;
  if (person.id === guest.id) return 'Your current guest';
  const saved = readStorage(gameKey(person.id), null);
  return validSavedGame(saved, person.answer) && (saved.clues > 1 || saved.guesses.length) ? 'Continue the story' : 'Meet the mystery';
}
function showArchive() {
  const cards = GUESTS.map(person => {
    const status = guestStatus(person);
    const done = results.some(item => item.id === person.number);
    return `<button class="guest-card ${person.id === guest.id ? 'current' : ''}" data-guest="${person.id}" aria-label="Meet ${person.name}. ${status}"><span class="guest-card-photo" style="--guest-color:${person.color}"><span class="guest-card-number">NO. ${person.number}</span><img src="${person.portrait}" alt="" loading="lazy"><span class="guest-card-arrow">${icon(done ? 'check' : 'arrow')}</span></span><span class="guest-card-heading"><strong>${person.name}<small>${person.age}</small></strong><span>${person.location}</span></span><span class="guest-card-teaser">${person.teaser}</span><span class="guest-card-status">${status}</span></button>`;
  }).join('');
  openModal(`<span class="modal-eyebrow">SIX PEOPLE. SIX DIFFERENT WORLDS.</span><h2>Who’s off the clock?</h2>
    <p>Same game. A completely different story. Choose someone to meet—your progress with each person is saved.</p>
    <div class="collection-progress"><span>THE FIRST COLLECTION</span><span>${results.length} / ${GUESTS.length} DISCOVERED</span></div>
    <div class="guest-grid">${cards}</div>
    <p class="collection-note">Six faces. Eight clues each. How well do you read people?</p>`, {library:true});
}
function showAbout() {
  openModal(`<span class="modal-eyebrow">OFFCLOCK, ON PURPOSE</span><h2>There’s a person<br>behind every job.</h2>
    <p>Offclock is a profession-guessing game built around the small details of someone’s working life. A habit. An unexpected tool. A story they bring home.</p>
    <p>One person. Eight clues. Three guesses. Follow your curiosity and discover a world you might otherwise walk right past.</p>
    <p class="modal-note">This first collection features six fictional characters, AI-generated portraits, and AI-generated narration made with <a href="https://huggingface.co/ResembleAI/chatterbox" target="_blank" rel="noreferrer">Chatterbox</a>. The stories describe real professions. This is a playable reference collection; a new daily release schedule will follow.</p>
    <button class="modal-primary" data-action="guests">Meet the collection ${icon('arrow')}</button>
    <button class="modal-secondary" data-action="how">How to play</button>`);
}
function goToGuest(id) {
  if (id === guest.id) { if (isFinished()) showResult(); else closeModal(); return; }
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('guest', id);
  stopAudio();
  location.assign(url);
}
function startPractice() {
  stopAudio();
  game = newGame(true);
  input.value = '';
  clearSuggestions();
  setFeedback(restingFeedback());
  closeModal();
  render();
  input.focus();
}

/* Sharing */
function shareResult() {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('guest', guest.id);
  const text = shareSummary({...game, number:guest.number, score:currentScore(), answer:guest.answer, url:url.href});
  const copied = () => toast('Result copied. Keep the profession a mystery.');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(copied).catch(() => shareFallback(text, copied));
  else shareFallback(text, copied);
}
function shareFallback(text, copied) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.cssText = 'position:fixed;opacity:0';
  ($('#modal').open ? $('#modal-content') : document.body).append(area);
  area.select();
  const success = document.execCommand('copy');
  area.remove();
  if (success) { copied(); return; }
  openModal(`<span class="modal-eyebrow">SHARE YOUR CURIOSITY</span><h2>Your result.</h2><p id="share-fallback" style="white-space:pre-line"></p><button class="modal-primary" data-action="close">Done</button>`);
  $('#share-fallback').textContent = text;
}

/* Events */
input.addEventListener('input', renderSuggestions);
input.addEventListener('focus', () => { if (input.value.trim()) renderSuggestions(); });
input.addEventListener('keydown', event => {
  if (event.key === 'Escape') { clearSuggestions(); return; }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!suggestions.length) renderSuggestions();
    if (!suggestions.length) return;
    highlight((highlighted + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length);
  }
  if (event.key === 'Enter' && highlighted >= 0 && !$('#profession-options').hidden) { event.preventDefault(); selectSuggestion(highlighted); }
});
$('#profession-options').addEventListener('mousedown', event => {
  const option = event.target.closest('[data-option]');
  if (option) { event.preventDefault(); selectSuggestion(Number(option.dataset.option)); }
});
$('#profession-options').addEventListener('mousemove', event => {
  const option = event.target.closest('[data-option]');
  if (option && Number(option.dataset.option) !== highlighted) highlight(Number(option.dataset.option));
});
document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) clearSuggestions(); });
$('#guess-form').addEventListener('submit', event => { event.preventDefault(); submitGuess(); });
$('#submit-guess').addEventListener('click', () => { if (isFinished()) showResult(); });
$('#giveup-button').addEventListener('click', confirmGiveUp);
$('#reveal-button').addEventListener('click', revealNextClue);
$('#clue-track').addEventListener('click', event => {
  const button = event.target.closest('[data-clue]');
  if (button && !button.disabled) showClue(Number(button.dataset.clue), true);
});
$('#replay-button').addEventListener('click', playClue);
$('#meet-button').addEventListener('click', () => { if (game.viewed !== 0) showClue(0, true); else playClue(); });
$('#sound-button').addEventListener('click', () => { muted = !muted; if (muted) stopAudio(); renderSound(); });
$('#theme-button').addEventListener('click', () => { theme = theme === 'light' ? 'dark' : 'light'; writeStorage(THEME_KEY, theme); applyTheme(); });
$('#how-button').addEventListener('click', showHow);
$('#stats-button').addEventListener('click', showStats);
$('#archive-button').addEventListener('click', showArchive);
$('#about-button').addEventListener('click', showAbout);
$('#modal-close').addEventListener('click', closeModal);
$('#modal').addEventListener('click', event => {
  const modal = $('#modal');
  if (event.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeModal();
  }
  const personId = event.target.closest('[data-guest]')?.dataset.guest;
  if (personId) { goToGuest(personId); return; }
  const actions = {guests:showArchive, how:showHow, close:closeModal, share:shareResult, practice:startPractice, giveup:confirmGiveUp, 'confirm-giveup':() => { closeModal(); finish('gaveup'); }};
  actions[event.target.closest('[data-action]')?.dataset.action]?.();
});
audio.addEventListener('ended', () => { speaking = false; renderPlayback(); });
audio.addEventListener('error', () => { if (activeClip !== null) playbackFailed(); });
audio.addEventListener('loadedmetadata', () => { if (Number.isFinite(audio.duration)) $('#caption-duration').textContent = formatDuration(audio.duration); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); });
window.addEventListener('pagehide', stopAudio);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (requestedTheme()) return;
  theme = event.matches ? 'dark' : 'light';
  applyTheme();
});

/* Start */
applyTheme();
game = loadGame();
if (isFinished()) recordResult();
if (params.has('guest') && params.get('guest') !== guest.id) {
  const url = new URL(location.href);
  url.searchParams.set('guest', guest.id);
  history.replaceState(null, '', url);
}
$('.guest-portrait').src = guest.portrait;
$('#meet-name').textContent = `Meet ${guest.name}`;
$('#meet-subtitle').textContent = `Mystery guest · No. ${guest.number}`;
$('#guest-name').textContent = guest.name.toUpperCase();
$('#guest-age').textContent = `${guest.age} YEARS OLD`;
$('#guest-location').textContent = guest.location.toUpperCase();
$('#profession-label').textContent = `What does ${guest.name} do?`;
document.title = `Meet ${guest.name} — Offclock`;
setFeedback(restingFeedback());
renderSound();
render();
fetch(`assets/audio/${VOICE_SETTINGS.revision}/manifest.json`).then(response => response.ok ? response.json() : {}).then(data => { durations = data; renderDuration(); }).catch(() => {});
if (params.get('view') === 'guests') showArchive();
