import test from 'node:test';
import assert from 'node:assert/strict';
import {DESIGNS,getInitialDesign,designPickerMarkup} from './dist/designs.mjs';

test('five additional designs preserve the approved original and have unique shareable identifiers',()=>{
  assert.equal(DESIGNS.length,6);
  assert.equal(DESIGNS[0].id,'original');
  assert.equal(new Set(DESIGNS.map(d=>d.id)).size,6);
  for(const design of DESIGNS) assert.equal(getInitialDesign(`?design=${design.id}`).id,design.id);
});
test('explicit design links override preferences and invalid links fall back to the original',()=>{
  assert.equal(getInitialDesign('?design=studio','after-hours').id,'studio');
  assert.equal(getInitialDesign('','after-hours').id,'after-hours');
  assert.equal(getInitialDesign('?design=invalid','after-hours').id,'original');
  assert.equal(getInitialDesign('?design=%22%3E%3Cscript%3E').id,'original');
});
test('the comparison picker exposes all six choices and exactly one current selection',()=>{
  const html=designPickerMarkup('case-file');
  assert.equal((html.match(/data-design-choice=/g)||[]).length,6);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.match(html,/Choose Case File design" aria-pressed="true"/);
});
