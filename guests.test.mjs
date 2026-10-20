import test from 'node:test';
import assert from 'node:assert/strict';
import {GUESTS,getGuest,gameKey,getTheme} from './dist/guests.mjs';
import {findProfession, validSavedGame, consolationFor} from './dist/game-core.mjs';

test('six distinct stories have eight clues, voices, answers, and separate progress', () => {
  assert.equal(GUESTS.length,6);
  for (const property of ['id','number','answer','portrait','voice']) assert.equal(new Set(GUESTS.map(g=>g[property])).size,6,property);
  assert.equal(new Set(GUESTS.map(g=>gameKey(g.id))).size,6);
  for (const guest of GUESTS) {
    assert.equal(guest.clips.length,8);
    assert.equal(findProfession(guest.answer).name,guest.answer);
    assert.ok(guest.clips.every(clip=>clip.text && clip.audio && clip.label));
    assert.equal(validSavedGame({clues:3,guesses:[guest.answer],status:'won'},guest.answer),true);
    const other = GUESTS.find(item=>item.answer!==guest.answer);
    assert.equal(validSavedGame({clues:3,guesses:[other.answer],status:'won'},guest.answer),false);
    assert.equal(consolationFor(['Doctor'],guest.answer),0);
  }
});
test('only light and dark modes; malformed guest links resolve to a playable story', () => {
  assert.equal(getGuest('jonah').name,'Jonah');
  assert.equal(getGuest('unknown').id,'maya');
  assert.equal(getGuest(null).id,'maya');
  assert.equal(getTheme('dark'),'dark');
  assert.equal(getTheme('light',true),'light');
  assert.equal(getTheme('casefile'),'light');
  assert.equal(getTheme(null,true),'dark');
});
