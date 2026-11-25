const test = require('node:test');
const assert = require('node:assert/strict');
const { countCurriculum, FLOOR, HIGH } = require('../scripts/curriculum-pools.js');
const { AREAS } = require('../scripts/curriculum.js');

const AREAS_FIXTURE = { medi: ['science', 'society'], maths: ['number'] };
const q = (id, area, block) => ({ id, curriculum: { area, block } });
const rowOf = (rows, area, block) => rows.find((row) => row.area === area && row.block === block);

test('a question counts in its curriculum block', () => {
  const rows = countCurriculum([q('a', 'medi', 'science'), q('b', 'medi', 'science')], AREAS_FIXTURE);
  assert.equal(rowOf(rows, 'medi', 'science').count, 2);
});

test('a block with no question is listed and missing its floor', () => {
  const rows = countCurriculum([q('a', 'medi', 'science')], AREAS_FIXTURE);
  const society = rowOf(rows, 'medi', 'society');
  assert.equal(society.count, 0);
  assert.equal(society.floor, FLOOR);
  assert.equal(society.missing, FLOOR);
  assert.equal(society.status, 'below');
});

test('a block at the floor is ok and one above the high mark is high', () => {
  const atFloor = Array.from({ length: FLOOR }, (_, i) => q(`f-${i}`, 'medi', 'science'));
  assert.equal(rowOf(countCurriculum(atFloor, AREAS_FIXTURE), 'medi', 'science').status, 'ok');

  const high = Array.from({ length: HIGH + 1 }, (_, i) => q(`h-${i}`, 'medi', 'science'));
  assert.equal(rowOf(countCurriculum(high, AREAS_FIXTURE), 'medi', 'science').status, 'high');
});

test('missing is never negative', () => {
  const many = Array.from({ length: 10 }, (_, i) => q(`q-${i}`, 'maths', 'number'));
  assert.equal(rowOf(countCurriculum(many, AREAS_FIXTURE), 'maths', 'number').missing, 0);
});

test('a curriculum block outside the list is an error', () => {
  assert.throws(
    () => countCurriculum([q('x-1', 'medi', 'unknown')], AREAS_FIXTURE),
    { message: 'question x-1: curriculum "medi/unknown" is not in the list' }
  );
});

test('a question without a curriculum is an error', () => {
  assert.throws(
    () => countCurriculum([{ id: 'x-2' }], AREAS_FIXTURE),
    { message: 'question x-2: missing curriculum area or block' }
  );
});

test('the current bank is counted in full', () => {
  const APN = require('../js/data-level-1.js');
  require('../js/questions.js');
  const rows = countCurriculum(APN.QUESTIONS);
  const blocks = Object.values(AREAS).flat().length;
  assert.equal(rows.length, blocks);
  assert.equal(rows.reduce((sum, row) => sum + row.count, 0), APN.QUESTIONS.length);
  for (const row of rows) {
    assert.ok(row.count >= 0);
    assert.equal(row.missing, Math.max(0, row.floor - row.count));
  }
});
