export const DESIGNS = [
  {id:'original', name:'Original', number:'01', label:'The starting point', description:'Quiet editorial. Warm paper, oversized type, and a person at the center.', color:'#eeede7', accent:'#dbe8a6'},
  {id:'after-hours', name:'After Hours', number:'02', label:'Curiosity after dark', description:'A late-night portrait, electric chartreuse, and a cinematic black canvas.', color:'#111815', accent:'#d0fa79'},
  {id:'studio', name:'The Studio', number:'03', label:'A portrait in terracotta', description:'A sunlit gallery with warm clay, generous serif type, and a framed guest.', color:'#f7f0e6', accent:'#b85b3f'},
  {id:'case-file', name:'Case File', number:'04', label:'Follow the evidence', description:'Cobalt grids, numbered evidence, and the precision of a case dossier.', color:'#edf2fd', accent:'#2459df'},
  {id:'sunday', name:'Sunday Paper', number:'05', label:'A little daily reading', description:'An illustrated broadsheet: ink, butter yellow, and a portrait worth a second look.', color:'#faf5dc', accent:'#ead261'},
  {id:'playdate', name:'Playdate', number:'06', label:'Good guesses only', description:'Lilac, bright orange, playful shapes, and a guest with main-character energy.', color:'#e9defa', accent:'#ff6b32'},
];

export function getInitialDesign(search, saved = null) {
  const requested = new URLSearchParams(search).get('design');
  const id = requested === null ? saved : requested;
  return DESIGNS.find(design => design.id === id) || DESIGNS[0];
}

export function designPickerMarkup(activeId) {
  return `<span class="modal-eyebrow">ONE GAME. SIX PERSPECTIVES.</span><h2 id="modal-title">Find your kind of curious.</h2><p class="design-picker-intro">Six fully playable directions. Your clues, guesses, and score stay with you.</p><div class="design-grid">${DESIGNS.map(design => `<button class="design-card ${design.id === activeId ? 'selected' : ''}" data-design-choice="${design.id}" aria-label="Choose ${design.name} design" aria-pressed="${design.id === activeId}"><span class="design-mini mini-${design.id}" aria-hidden="true"><span class="mini-wordmark">✳ offclock.</span><span class="mini-headline">What do <em>I do?</em></span><span class="mini-shape"></span><img src="assets/maya.png" alt="" loading="lazy"><span class="mini-caption">A face. A few clues.</span><span class="mini-score">10,000<small> points</small></span><span class="mini-input"></span><span class="mini-cta">Make a guess ↗</span><span class="mini-dock"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="mini-note">${design.number} / THE DAILY GUEST</span></span><span class="design-card-heading"><span><small>${design.number}</small><strong>${design.name}</strong></span><span class="design-selected-icon" aria-hidden="true">${design.id === activeId ? '✓' : '↗'}</span></span><span class="design-card-description">${design.description}</span></button>`).join('')}</div><p class="design-picker-footnote">The same guest. The same scoring. A different point of view.</p>`;
}
