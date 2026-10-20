import test from 'node:test';
import assert from 'node:assert/strict';
import {compareScript} from './scripts/script-match.mjs';

test('accepts transcripts that only differ in numerals, spelling and punctuation', () => {
  assert.equal(compareScript('That was 1929. We’ve got slightly better equipment now.', 'That was nineteen twenty-nine, we\'ve got slightly better equipment now').ok, true);
  assert.equal(compareScript('People were doing my job four and a half thousand years ago.', 'People were doing my job 4,500 years ago.').ok, true);
  assert.equal(compareScript('You wouldn’t recognise me, though.', 'You wouldn\'t recognize me though.').ok, true);
  assert.equal(compareScript('There’s a book from thirteenth-century China.', 'There\'s a book from 13th century China.').ok, true);
  assert.equal(compareScript('Most of my day’s in a lab.', 'Most of my days in a lab.').ok, true);
});
test('rejects recordings that skip, repeat or invent words', () => {
  const skipped = compareScript('I check the labels, the seals, all the paperwork.', 'I check the labels, all the paperwork.');
  assert.equal(skipped.ok, false);
  assert.deepEqual(skipped.missing, ['the', 'seals']);
  assert.equal(compareScript('Hearing it tick again was lovely, actually.', 'Hearing it tick again was lovely.').ok, false);
  assert.equal(compareScript('I keep tweezers next to my chopping board.', 'I keep tweezers next to my chopping board board next to my chopping board.').ok, false);
});
