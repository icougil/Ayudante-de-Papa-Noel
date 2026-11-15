const test = require('node:test');
const assert = require('node:assert/strict');
const APN = require('../js/data-level-1.js');

const level = APN.LEVELS[0];
const stopIds = level.stops.map((s) => s.id);

test('level 1 has the 6 stops in order', () => {
  assert.equal(level.id, 1);
  assert.equal(level.name, 'España');
  assert.deepEqual(stopIds, ['barcelona', 'zaragoza', 'madrid', 'sevilla', 'santiago', 'bilbao']);
  for (const s of level.stops) {
    assert.ok(s.name.length > 0);
    assert.ok(s.landmark.length > 0);
  }
});

test('question ids are unique', () => {
  const ids = APN.QUESTIONS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every question has the right shape', () => {
  for (const q of APN.QUESTIONS) {
    assert.equal(q.options.length, 4, q.id);
    assert.equal(new Set(q.options).size, 4, q.id);
    assert.ok(q.options.every((o) => typeof o === 'string' && o.trim().length > 0), q.id);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3, q.id);
    assert.ok(APN.SUBJECTS.includes(q.subject), q.id);
    assert.ok(q.prompt.trim().length > 0, q.id);
    assert.ok(q.explanation.trim().length > 0, q.id);
    assert.ok(q.minAge <= q.maxAge, q.id);
  }
});

test('every question respects the length limits', () => {
  for (const q of APN.QUESTIONS) {
    assert.ok(q.prompt.length <= 120, `${q.id} prompt`);
    assert.ok(q.options.every((o) => o.length <= 40), `${q.id} options`);
    assert.ok(q.explanation.length <= 160, `${q.id} explanation`);
  }
});

test('every place is a stop of the level or general', () => {
  for (const q of APN.QUESTIONS) {
    assert.ok(q.place === 'general' || stopIds.includes(q.place), q.id);
  }
});

test('there are 3 questions per stop and 12 general ones', () => {
  for (const id of stopIds) {
    const aboutPlace = APN.QUESTIONS.filter((q) => q.place === id);
    assert.equal(aboutPlace.length, 3, id);
    assert.ok(new Set(aboutPlace.map((q) => q.subject)).size >= 2, `${id} subjects`);
    assert.ok(
      aboutPlace.every((q) => ['geography', 'history', 'sports', 'culture'].includes(q.subject)),
      id
    );
  }
  const general = APN.QUESTIONS.filter((q) => q.place === 'general');
  assert.equal(general.length, 12);
  const count = (subject) => general.filter((q) => q.subject === subject).length;
  assert.equal(count('maths'), 4);
  assert.equal(count('science'), 3);
  assert.equal(count('language'), 2);
  assert.equal(count('english'), 3);
});

test('all questions suit an 11-year-old', () => {
  for (const q of APN.QUESTIONS) {
    assert.ok(q.minAge <= 11 && 11 <= q.maxAge, q.id);
  }
});
