import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreFor, CLUE_BALANCES, findProfession, searchProfessions, consolationFor, validSavedGame} from './dist/game-core.mjs';

test('agreed scoring balances, penalties, and minimum winning score', () => {
  assert.deepEqual(Array.from({length:8},(_,i)=>scoreFor(i+1,0)), CLUE_BALANCES);
  assert.equal(scoreFor(1,1),7000);
  assert.equal(scoreFor(8,2),1470);
  for(let clue=1;clue<=8;clue++) for(let misses=0;misses<=2;misses++) {
    assert.ok(scoreFor(clue,misses)>1000,'every winning score beats consolation');
    assert.equal(scoreFor(clue,misses)%10,0);
    if(clue<8)assert.ok(scoreFor(clue,misses)>scoreFor(clue+1,misses));
  }
});
test('profession aliases and search prevent equivalent-title guessing traps', () => {
  assert.equal(findProfession('  FOLEY  ').name,'Foley artist');
  assert.equal(findProfession('cabin crew').name,'Flight attendant');
  assert.equal(findProfession('audio engineer').name,'Sound engineer');
  assert.equal(searchProfessions('foley')[0].name,'Foley artist');
  assert.equal(findProfession('<script>'),undefined);
  assert.deepEqual(searchProfessions(''),[]);
});
test('consolation uses the closest of all guesses and never exceeds 1000', () => {
  assert.equal(consolationFor([]),0);
  assert.equal(consolationFor(['Carpenter']),0);
  assert.equal(consolationFor(['Film director']),500);
  assert.equal(consolationFor(['Sound engineer','Doctor','Film director']),1000);
});
test('invalid persisted game states cannot restore extra guesses or invalid clues', () => {
  assert.equal(validSavedGame({clues:1,guesses:[],status:'playing'}),true);
  assert.equal(validSavedGame({clues:8,guesses:['Doctor','Foley artist'],status:'won'}),true);
  assert.equal(validSavedGame({clues:9,guesses:[],status:'playing'}),false);
  assert.equal(validSavedGame({clues:1,guesses:['Doctor','Doctor'],status:'playing'}),false);
  assert.equal(validSavedGame({clues:1,guesses:['Doctor','Chef','Nurse'],status:'playing'}),false);
  assert.equal(validSavedGame({clues:1,guesses:['Doctor'],status:'won'}),false);
});
