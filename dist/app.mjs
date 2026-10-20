import {CLUE_COSTS, CLUE_BALANCES, scoreFor, findProfession, searchProfessions, consolationFor, validSavedGame} from './game-core.mjs';

const $ = selector => document.querySelector(selector);
const icon = (name, cls = '') => `<svg ${cls ? `class="${cls}"` : ''} aria-hidden="true"><use href="#i-${name}"/></svg>`;
const format = number => number.toLocaleString('en-US');
const GAME_KEY = 'offclock:edition-001:v1';
const STATS_KEY = 'offclock:results:v1';
const titles = ['First impression', 'The morning', 'Misconceptions', 'My tools', 'My workplace', 'The challenge', 'A work story', 'The giveaway'];
const captions = [
  {label:'A FIRST IMPRESSION', text:'Most people hear my work every day. Almost nobody knows my name.', duration:8},
  {label:'HOW MY MORNING STARTS', text:'My morning usually starts in a very quiet room. Then I spend the rest of the day making noise.', duration:10},
  {label:'WHAT PEOPLE GET WRONG', text:'People assume a computer does what I do. Sometimes it helps. But a pair of hands and good timing can be much more convincing.', duration:12},
  {label:'SOMETHING I USE', text:'My collection of old shoes is a little ridiculous. Different soles, different sizes. Every pair has its own personality.', duration:11},
  {label:'WHERE YOU’LL FIND ME', text:'There’s a microphone, a screen, and patches of gravel, wood, and sand on the floor. It’s a strange place to call an office.', duration:12},
  {label:'THE HARD PART', text:'I have to make something sound exactly right, at exactly the right moment. Even if I’m using something completely different to make it.', duration:12},
  {label:'A STORY FROM MY SHIFT', text:'Yesterday I snapped vegetables to bring a fight scene to life. Then I spent an hour walking in someone else’s shoes. Quite literally.', duration:12},
  {label:'PUTTING IT ALL TOGETHER', text:'When you hear footsteps, rustling clothes, or a door handle in a film, those sounds might be my performance, recorded to match the picture.', duration:13},
];
let game = {clues:1, viewed:0, guesses:[], status:'playing', practice:false};
let muted = false;
let suggestions = [];
let highlighted = -1;
let speaking = false;
let speechToken = 0;
let speechTimer;
let toastTimer;
let resultTimer;

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* The round remains playable without storage. */ }
}
const saved = readStorage(GAME_KEY, null);
if (validSavedGame(saved)) game = {...saved, viewed:Math.max(0, Math.min(saved.clues-1, Number(saved.viewed)||0)), practice:false};
let results = readStorage(STATS_KEY, []);
if (!Array.isArray(results)) results = [];
results = results.filter(result => result && result.id === '001' && Number.isFinite(result.score) && typeof result.won === 'boolean');

function save() { if (!game.practice) writeStorage(GAME_KEY, game); }
function currentScore() {
  if (game.status === 'lost' || game.status === 'gaveup') return consolationFor(game.guesses);
  return scoreFor(game.clues, game.guesses.filter(g => g !== 'Foley artist').length);
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
function stopAudio() {
  speechToken++;
  clearTimeout(speechTimer);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  speaking = false;
  renderPlayback();
}
function renderPlayback() {
  $('.caption-region').classList.toggle('playing', speaking);
  $('#replay-button').innerHTML = icon(speaking ? 'pause' : 'play') + `<span id="replay-label">${speaking ? 'Pause her story' : 'Listen to her story'}</span>`;
  $('#replay-button').setAttribute('aria-label', speaking ? 'Pause narration' : 'Listen to this clue');
  $('.play-circle').innerHTML = icon(speaking ? 'pause' : 'play');
}
function playClue() {
  if (speaking) { stopAudio(); return; }
  if (muted) { muted = false; renderSound(); }
  if (!('speechSynthesis' in window)) { toast('Audio isn’t available here. You can read the full clue on screen.'); return; }
  stopAudio();
  const token = ++speechToken;
  const utterance = new SpeechSynthesisUtterance(captions[game.viewed].text);
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find(v => v.lang.startsWith('en-GB') && /female|serena|martha|kate|sonia|libby/i.test(v.name)) ||
    voices.find(v => /samantha|karen|moira/i.test(v.name)) || voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en')) || null;
  utterance.lang = utterance.voice?.lang || 'en-GB';
  utterance.rate = .91;
  utterance.pitch = 1;
  utterance.onstart = () => { if (token === speechToken) {clearTimeout(speechTimer); speaking = true; renderPlayback();} };
  utterance.onend = () => {if (token === speechToken) {speaking = false; renderPlayback();} };
  utterance.onerror = event => {if (token === speechToken && event.error !== 'interrupted' && event.error !== 'canceled') {speaking = false; renderPlayback(); toast('Narration is unavailable in this browser. The complete clue is on screen.');} };
  window.speechSynthesis.speak(utterance);
  speechTimer = setTimeout(() => {if (!speaking && token === speechToken) toast('Narration is unavailable in this browser. The complete clue is on screen.');}, 3000);
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
  $('#caption-duration').textContent = `0:${String(captions[game.viewed].duration).padStart(2, '0')}`;
  $('#clue-count').textContent = String(game.clues).padStart(2, '0');
  $('#clue-track').innerHTML = titles.map((title, index) => `<button class="clue-step ${index < game.clues ? 'unlocked' : ''} ${index === game.viewed ? 'active' : ''}" data-clue="${index}" ${index >= game.clues && !finished ? 'disabled' : ''} aria-label="${index < game.clues || finished ? 'Replay' : 'Locked'} clue ${index+1}: ${title}" ${index === game.viewed ? 'aria-current="step"' : ''}><span class="step-number">0${index+1}</span>${icon(index < game.clues || finished ? 'play' : 'lock')}<span class="step-title">${title}</span></button>`).join('');
  $('#reveal-button').disabled = game.clues === 8 || finished;
  $('#reveal-label').textContent = finished ? 'The story is yours' : game.clues === 8 ? 'You have every clue' : 'Reveal next clue';
  $('#reveal-price').innerHTML = game.clues < 8 && !finished ? `−${format(CLUE_COSTS[game.clues])} pts ${icon('arrow')}` : icon('check');
  $('#clue-tip').textContent = finished ? 'A little less guessing. A little more understanding.' : game.clues === 8 ? 'All the pieces are here. What’s your guess?' : 'A little more insight. A few fewer points.';
  $('#guess-history').innerHTML = game.guesses.map(name => `<span class="history-chip ${name === 'Foley artist' ? 'correct' : ''}">${icon(name === 'Foley artist' ? 'check' : 'close')}${name}</span>`).join('');
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
function openModal(content) {
  clearTimeout(resultTimer);
  stopAudio();
  $('#modal-content').innerHTML = content;
  if (!$('#modal').open) $('#modal').showModal();
}
function closeModal() {$('#modal').close();}
function recordResult() {
  if (game.practice || results.some(result => result.id === '001')) return;
  results.push({id:'001', score:currentScore(), won:game.status === 'won', date:new Date().toISOString(), clues:game.clues, guesses:game.guesses.length});
  writeStorage(STATS_KEY, results);
}
function finish(status) {
  game.status = status;
  stopAudio();
  save();
  recordResult();
  clearSuggestions();
  render();
  resultTimer = setTimeout(showResult, 350);
}
function showResult() {
  if (game.status === 'playing') return;
  const won = game.status === 'won';
  const related = !won && currentScore() > 0;
  const wrongCount = game.guesses.filter(g => g !== 'Foley artist').length;
  openModal(`<span class="modal-eyebrow">${icon(won ? 'check' : 'search')} THE PERSON BEHIND THE PROFESSION</span><h2>${won ? 'You heard the clues.' : 'Meet the sound of cinema.'}</h2><p>Maya is a <strong>Foley artist.</strong> She performs everyday sounds for film and television, matching each movement on screen.</p><div class="score-ticket"><div><div class="ticket-label">${game.practice ? 'PRACTICE SCORE' : 'YOUR FINAL SCORE'}</div><div class="ticket-score">${format(currentScore())}<small style="font-size:17px;letter-spacing:0"> pts</small></div></div><div class="ticket-meta">${game.clues} of 8 clues<br>${game.guesses.length} of 3 guesses<br>${won ? `${wrongCount} ${wrongCount === 1 ? 'miss' : 'misses'}` : related ? 'Related profession credit' : 'A new perspective'}</div></div><p class="reveal-explanation">“The shoes were for footsteps.<br>The vegetables? Movie fight scenes.”</p><p>Her props create familiar sounds in unexpected ways. The quiet room, the microphone, and the timing all pointed to the same craft.</p><div class="share-grid" aria-label="${game.clues} clues revealed">${Array.from({length:8},(_,i) => i < game.clues ? '🟩' : '⬜').join('')}</div><button class="modal-primary" data-action="share">${icon('share')} Copy my result</button><button class="modal-secondary" data-action="close">Revisit the clues</button>${game.practice ? '' : '<button class="modal-secondary" data-action="practice">Play again for practice</button>'}`);
}
function showHow() {
  openModal(`<span class="modal-eyebrow">A SMALL DAILY DISCOVERY</span><h2>Curiosity pays.</h2><p>Meet Maya. Listen to her stories. Guess what she does for a living.</p><ol class="rules-list"><li><div><strong>Start with 10,000 points.</strong>Your first clue is free. Trust your instinct, or keep listening.</div></li><li><div><strong>Eight clues. Each a little more revealing.</strong>The next clues cost 250, 500, 750, 1,000, 1,250, 1,500, and 1,750 points. The price is always shown before you reveal one.</div></li><li><div><strong>Three guesses. Make them count.</strong>Each wrong guess multiplies your available score by 70%. Clue costs are applied before these penalties; the score is rounded to the nearest 10.</div></li><li><div><strong>A good hunch still counts.</strong>If you don’t solve it, your closest guess earns 1,000 points for the same job family, 500 for the same broad field, or 0 for an unrelated job. Any correct solve beats partial credit.</div></li></ol><button class="modal-primary" data-action="close">Let’s meet Maya ${icon('arrow')}</button><button class="modal-secondary" data-action="giveup">Give up and see the reveal</button>`);
}
function showStats() {
  const completed = results.length;
  const wins = results.filter(result => result.won).length;
  const best = Math.max(0,...results.map(result => result.score));
  openModal(`<span class="modal-eyebrow">YOUR CURIOSITY, BY THE NUMBERS</span><h2>A good eye for people.</h2><div class="stats-grid"><div class="stats-cell"><strong>${completed}</strong><span>Rounds played</span></div><div class="stats-cell"><strong>${completed ? Math.round(wins/completed*100) : 0}%</strong><span>Solve rate</span></div><div class="stats-cell"><strong>${format(best)}</strong><span>Best score</span></div></div><p>${completed ? 'A little curiosity goes a long way. Your first-edition result is saved here, and practice rounds keep that original score intact.' : 'Your story starts here. Finish your first round to see your results.'}</p><button class="modal-primary" data-action="close">${game.status === 'playing' ? 'Back to today’s guest' : 'Back to the clues'} ${icon('arrow')}</button><p class="modal-note">Your progress and statistics are stored on this device.</p>`);
}
function showArchive() {
  openModal(`<span class="modal-eyebrow">THE PEOPLE WE’VE MET</span><h2>Every job has a story.</h2><p>You’re here for the first edition. Start with Maya and discover the person behind the profession.</p><button class="archive-card" data-action="archive-current"><span class="archive-thumbnail"><img src="assets/maya.png" alt="Maya"></span><span><strong>No. 001 — Meet Maya</strong><small>${game.status === 'playing' ? 'First edition · Continue your round' : 'First edition · View your result'}</small></span>${icon('arrow')}</button><p class="archive-end">A little collection of other people’s worlds.</p><button class="modal-primary" data-action="close">Back to the first edition ${icon('arrow')}</button>`);
}
function showAbout() {
  openModal(`<span class="modal-eyebrow">OFFCLOCK, ON PURPOSE</span><h2>There’s a person<br>behind every job.</h2><p>Offclock is a daily profession-guessing game built around the small details of someone’s working life. A habit. An unexpected tool. A story they bring home.</p><p>One person. Eight clues. Three guesses. Follow your curiosity and discover a world you might otherwise walk right past.</p><p class="modal-note">This playable first edition features a fictional guest, an AI-generated portrait, and a demo narration voice. Her profession and clues describe the real craft of Foley.</p><button class="modal-primary" data-action="close">Stay curious ${icon('arrow')}</button>`);
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
  const text = `Offclock #001${game.practice ? ' · Practice' : ''}\n${statusText}\n${game.clues}/8 clues · ${game.guesses.length}/3 guesses\n${Array.from({length:8},(_,i) => i < game.clues ? '🟩' : '⬜').join('')}\n${location.origin}${location.pathname}`;
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
  if (profession.name === 'Foley artist') {finish('won');return;}
  if (game.guesses.length === 3) {finish('lost');return;}
  const related = profession.family === 'sound' ? 'A related craft. Keep listening.' : profession.field === 'arts' ? 'You’re in the creative world. Keep listening.' : 'That’s not her profession. Keep listening.';
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
$('#stats-button').addEventListener('click', showStats);
$('#archive-button').addEventListener('click', showArchive);
$('#about-button').addEventListener('click', showAbout);
$('#modal-close').addEventListener('click', closeModal);
$('#modal').addEventListener('click', event => {
  if (event.target === $('#modal')) {const rect=$('#modal').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}
  const action=event.target.closest('[data-action]')?.dataset.action;
  if (action === 'close') closeModal();
  if (action === 'share') shareResult();
  if (action === 'practice') resetForPractice();
  if (action === 'archive-current') {if(game.status==='playing')closeModal();else showResult();}
  if (action === 'giveup') {
    if(game.status!=='playing'){showResult();return;}
    openModal(`<span class="modal-eyebrow">END THIS ROUND</span><h2>Ready for her story?</h2><p>Revealing Maya’s profession ends this round. You’ll receive ${format(consolationFor(game.guesses))} points from your closest guess.</p><button class="modal-primary" data-action="confirm-giveup">Reveal Maya’s profession ${icon('arrow')}</button><button class="modal-secondary" data-action="close">I’ll keep guessing</button>`);
  }
  if (action === 'confirm-giveup') {closeModal();finish('gaveup');}
});
document.addEventListener('visibilitychange', () => {if (document.hidden) stopAudio();});
window.addEventListener('pagehide', stopAudio);
render();
