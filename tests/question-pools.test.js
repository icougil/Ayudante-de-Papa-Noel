const test = require('node:test');
const assert = require('node:assert/strict');
const { countPools, TARGET, GENERAL_SUBJECTS } = require('../scripts/question-pools.js');

const STOPS = ['barcelona', 'zaragoza', 'madrid'];
const GENERAL = ['general:maths', 'general:science', 'general:language', 'general:english', 'general:catalan'];

const q = (id, place, subject, difficulty = 1) => ({ id, place, subject, difficulty });
const poolOf = (pools, name) => pools.find((p) => p.pool === name);

test('a city question counts in its city\'s pool', () => {
  const pools = countPools([q('a', 'madrid', 'geography'), q('b', 'madrid', 'history')], STOPS);
  assert.equal(poolOf(pools, 'madrid').count, 2);
});

test('a general question counts in its subject\'s pool', () => {
  const pools = countPools([q('a', 'general', 'maths')], STOPS);
  assert.equal(poolOf(pools, 'general:maths').count, 1);
});

test('a pool with no question is listed with a count of 0', () => {
  const pools = countPools([q('a', 'madrid', 'geography')], STOPS);
  const catalan = poolOf(pools, 'general:catalan');
  assert.equal(catalan.count, 0);
  assert.equal(catalan.belowTarget, true);
});

test('a pool at the target is not below it and one under it is', () => {
  const make = (n) => Array.from({ length: n }, (_, i) => q(`m-${i}`, 'madrid', 'geography'));
  assert.equal(TARGET, 15);
  assert.equal(poolOf(countPools(make(15), STOPS), 'madrid').belowTarget, false);
  assert.equal(poolOf(countPools(make(14), STOPS), 'madrid').belowTarget, true);
});

test('the pools come in route order, then the general subjects', () => {
  const pools = countPools([], STOPS);
  assert.deepEqual(pools.map((p) => p.pool), [...STOPS, ...GENERAL]);
  assert.deepEqual(GENERAL_SUBJECTS, ['maths', 'science', 'language', 'english', 'catalan']);
});

test('a place question outside the level is an error', () => {
  assert.throws(
    () => countPools([q('x-1', 'paris', 'geography')], STOPS),
    { message: 'question x-1: place "paris" is not a stop of the level' }
  );
});

test('a general question with a place subject is an error', () => {
  assert.throws(
    () => countPools([q('x-2', 'general', 'geography')], STOPS),
    { message: 'question x-2: a general question cannot have the place subject "geography"' }
  );
});

test('the difficulties and subjects of a pool are listed', () => {
  const pools = countPools(
    [q('a', 'madrid', 'geography', 1), q('b', 'madrid', 'history', 3)],
    STOPS
  );
  const madrid = poolOf(pools, 'madrid');
  assert.deepEqual(madrid.subjects, ['geography', 'history']);
  assert.deepEqual(madrid.difficulties, { 1: 1, 2: 0, 3: 1 });
});

test('the current bank has the eleven pools', () => {
  const APN = require('../js/data-level-1.js');
  require('../js/questions.js');
  const stopIds = APN.LEVELS[0].stops.map((s) => s.id);
  const pools = countPools(APN.QUESTIONS, stopIds);
  assert.equal(pools.length, 11);
  assert.equal(pools.reduce((sum, p) => sum + p.count, 0), APN.QUESTIONS.length);
});
