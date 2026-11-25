const test = require('node:test');
const assert = require('node:assert/strict');
const APN = require('../js/data-level-1.js');
require('../js/questions.js');
require('../js/game-logic.js');

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
    assert.equal(typeof q.lang, 'string', q.id);
    assert.ok(q.prompt.trim().length > 0, q.id);
    assert.ok(q.explanation.trim().length > 0, q.id);
    assert.ok(q.minAge <= q.maxAge, q.id);
  }
});

// The braces that mark Spanish words are not shown, so they do not count, as in the build.
test('every question respects the length limits', () => {
  for (const q of APN.QUESTIONS) {
    assert.ok(APN.plainText(q.prompt).length <= 120, `${q.id} prompt`);
    assert.ok(q.options.every((o) => o.length <= 40), `${q.id} options`);
    assert.ok(APN.plainText(q.explanation).length <= 160, `${q.id} explanation`);
  }
});

test('every place is a stop of the level or general', () => {
  for (const q of APN.QUESTIONS) {
    assert.ok(q.place === 'general' || stopIds.includes(q.place), q.id);
  }
});

test('every stop has at least 3 questions and there are at least 12 general ones', () => {
  for (const id of stopIds) {
    const aboutPlace = APN.QUESTIONS.filter((q) => q.place === id);
    assert.ok(aboutPlace.length >= 3, id);
    assert.ok(new Set(aboutPlace.map((q) => q.subject)).size >= 2, `${id} subjects`);
    assert.ok(
      aboutPlace.every((q) => ['geography', 'history', 'sports', 'culture'].includes(q.subject)),
      id
    );
  }
  const general = APN.QUESTIONS.filter((q) => q.place === 'general');
  assert.ok(general.length >= 12);
});

test('every stop has at least 3 non-Catalan questions and there are at least 9 non-Catalan general ones', () => {
  const notCatalan = APN.QUESTIONS.filter((q) => q.lang !== 'ca');
  for (const id of stopIds) {
    assert.ok(notCatalan.filter((q) => q.place === id).length >= 3, id);
  }
  assert.ok(notCatalan.filter((q) => q.place === 'general').length >= 9);
});

test("every question's language matches its subject", () => {
  const fixed = { english: 'en', catalan: 'ca', language: 'es' };
  for (const q of APN.QUESTIONS) {
    assert.ok(['es', 'ca', 'en'].includes(q.lang), q.id);
    if (fixed[q.subject]) assert.equal(q.lang, fixed[q.subject], q.id);
    else assert.ok(q.lang === 'es' || q.lang === 'ca', q.id);
  }
});

test('topic ids are unique', () => {
  const ids = APN.TOPICS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of APN.TOPICS) {
    assert.ok(APN.SUBJECTS.includes(t.subject), t.id);
    assert.ok(t.name.trim().length > 0, t.id);
  }
});

test('every topic of a question belongs to its subject', () => {
  const subjectOf = new Map(APN.TOPICS.map((t) => [t.id, t.subject]));
  for (const q of APN.QUESTIONS) {
    assert.ok(q.topics.length >= 1 && q.topics.length <= 3, q.id);
    for (const t of q.topics) assert.equal(subjectOf.get(t), q.subject, `${q.id} ${t}`);
  }
});

test('every question has a difficulty from 1 to 3', () => {
  for (const q of APN.QUESTIONS) assert.ok([1, 2, 3].includes(q.difficulty), q.id);
});

test('every question has a curriculum area and block', () => {
  const { AREAS } = require('../scripts/curriculum.js');
  for (const q of APN.QUESTIONS) {
    assert.ok(q.curriculum && typeof q.curriculum.area === 'string', q.id);
    assert.ok(Array.isArray(AREAS[q.curriculum.area]), q.id);
    assert.ok(AREAS[q.curriculum.area].includes(q.curriculum.block), q.id);
  }
});

test('every question has at least one https reference', () => {
  for (const q of APN.QUESTIONS) {
    assert.ok(q.references.some((r) => r.startsWith('https://')), q.id);
  }
});

test('all questions suit an 11-year-old', () => {
  for (const q of APN.QUESTIONS) {
    assert.ok(q.minAge <= 11 && 11 <= q.maxAge, q.id);
  }
});
