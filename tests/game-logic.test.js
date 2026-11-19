const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/data-level-1.js');
require('../js/questions.js');
const APN = require('../js/game-logic.js');

const level = APN.LEVELS[0];
const bank = APN.QUESTIONS;
const stopIds = level.stops.map((s) => s.id);
const NOT_ENOUGH_MESSAGE = 'Not enough questions for this level and age';

// Deterministic rng: returns the given values in order, then repeats the last one.
function rngOf(...values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

function sampleQuestions() {
  return APN.pickQuestions(level, bank, 11, rngOf(0.1));
}

function answerRight(state, beforeArrival = true) {
  return APN.answer(state, state.questions[state.index].correct, beforeArrival);
}

function answerWrong(state, beforeArrival = true) {
  const wrong = (state.questions[state.index].correct + 1) % 4;
  return APN.answer(state, wrong, beforeArrival);
}

function play(rightAnswers, expressAnswers = rightAnswers) {
  let state = APN.createGame(sampleQuestions());
  for (let i = 0; i < 6; i++) {
    state = (i < rightAnswers ? answerRight(state, i < expressAnswers) : answerWrong(state)).state;
  }
  return state;
}

test('pickQuestions returns 6, one per stop, alternating place and general', () => {
  const placeFirst = APN.pickQuestions(level, bank, 11, rngOf(0.1));
  assert.equal(placeFirst.length, 6);
  assert.deepEqual(
    placeFirst.map((q) => q.place),
    ['barcelona', 'general', 'madrid', 'general', 'santiago', 'general']
  );
  const generalFirst = APN.pickQuestions(level, bank, 11, rngOf(0.9));
  assert.deepEqual(
    generalFirst.map((q) => q.place),
    ['general', 'zaragoza', 'general', 'sevilla', 'general', 'bilbao']
  );
});

test('pickQuestions never repeats a question', () => {
  for (let i = 0; i < 200; i++) {
    const ids = APN.pickQuestions(level, bank, 11, Math.random).map((q) => q.id);
    assert.equal(new Set(ids).size, 6);
  }
});

test('pickQuestions filters by age', () => {
  assert.throws(() => APN.pickQuestions(level, bank, 8, Math.random), { message: NOT_ENOUGH_MESSAGE });
});

test('pickQuestions throws when questions are missing', () => {
  assert.throws(() => APN.pickQuestions(level, [], 11, Math.random), { message: NOT_ENOUGH_MESSAGE });
});

test('pickQuestions does not modify the bank', () => {
  const before = bank.map((q) => q.id);
  APN.pickQuestions(level, bank, 11, Math.random);
  assert.deepEqual(bank.map((q) => q.id), before);
});

test('shuffleOptions keeps the correct answer', () => {
  for (const original of bank) {
    const optionsCopy = [...original.options];
    const shuffled = APN.shuffleOptions(original, Math.random);
    assert.equal(shuffled.options[shuffled.correct], original.options[original.correct]);
    assert.deepEqual([...shuffled.options].sort(), [...original.options].sort());
    assert.deepEqual(original.options, optionsCopy);
    assert.equal(shuffled.id, original.id);
  }
});

test('a right answer delivers a gift and moves on', () => {
  const r = answerRight(APN.createGame(sampleQuestions()), false);
  assert.equal(r.correct, true);
  assert.equal(r.turbo, false);
  assert.equal(r.state.delivered, 1);
  assert.equal(r.state.streak, 1);
  assert.equal(r.state.index, 1);
});

test('a wrong answer delivers nothing and breaks the streak', () => {
  let state = APN.createGame(sampleQuestions());
  state = answerRight(state).state;
  state = answerRight(state).state;
  const r = answerWrong(state);
  assert.equal(r.correct, false);
  assert.equal(r.turbo, false);
  assert.equal(r.state.delivered, 2);
  assert.equal(r.state.streak, 0);
  assert.equal(r.state.index, 3);
});

test('a right answer before arrival is an express delivery', () => {
  const r = answerRight(APN.createGame(sampleQuestions()), true);
  assert.equal(r.express, true);
  assert.equal(r.state.express, 1);
  assert.equal(r.state.delivered, 1);
});

test('a late right answer or a wrong answer is not express', () => {
  const late = answerRight(APN.createGame(sampleQuestions()), false);
  assert.equal(late.express, false);
  assert.equal(late.state.delivered, 1);
  assert.equal(late.state.express, 0);
  const wrong = answerWrong(APN.createGame(sampleQuestions()), true);
  assert.equal(wrong.express, false);
  assert.equal(wrong.state.express, 0);
});

test('three right answers in a row give turbo, and so does the fourth', () => {
  let state = APN.createGame(sampleQuestions());
  const turbos = [];
  for (let i = 0; i < 4; i++) {
    const r = answerRight(state);
    turbos.push(r.turbo);
    state = r.state;
  }
  assert.deepEqual(turbos, [false, false, true, true]);
});

test('answer does not modify the state it receives', () => {
  const state = APN.createGame(sampleQuestions());
  answerRight(state);
  assert.equal(state.index, 0);
  assert.equal(state.delivered, 0);
  assert.equal(state.express, 0);
  assert.equal(state.streak, 0);
  assert.equal(state.finished, false);
});

test('the game ends after the sixth answer', () => {
  let state = APN.createGame(sampleQuestions());
  for (let i = 0; i < 5; i++) {
    state = answerRight(state).state;
    assert.equal(state.finished, false);
  }
  state = answerRight(state).state;
  assert.equal(state.finished, true);
  assert.throws(() => APN.answer(state, 0, true), { message: 'The game is already over' });
});

test('result: stars depend on the gifts delivered and the express deliveries', () => {
  // [gifts, express, passed, stars, missing]
  const expected = [
    [0, 0, false, 0, 3], [1, 1, false, 0, 2], [2, 2, false, 0, 1],
    [3, 0, true, 1, 0], [3, 3, true, 1, 0], [4, 4, true, 2, 0], [5, 5, true, 3, 0],
    [6, 0, true, 4, 0], [6, 5, true, 4, 0], [6, 6, true, 5, 0],
  ];
  for (const [gifts, express, passed, stars, missing] of expected) {
    const r = APN.result(play(gifts, express));
    const label = `${gifts} gifts, ${express} express`;
    assert.equal(r.delivered, gifts, label);
    assert.equal(r.express, express, label);
    assert.equal(r.total, 6, label);
    assert.equal(r.passed, passed, label);
    assert.equal(r.stars, stars, label);
    assert.equal(r.missing, missing, label);
    assert.equal(r.maxStars, 5, label);
  }
});

test('pickMishap covers all three', () => {
  assert.equal(APN.pickMishap(() => 0).id, 'storm');
  assert.equal(APN.pickMishap(() => 0.34).id, 'reindeer');
  assert.equal(APN.pickMishap(() => 0.99).id, 'drop');
  assert.deepEqual(APN.MISHAPS.map((m) => m.text), [
    '¡Tormenta de nieve! El regalo se ha perdido.',
    '¡Un reno se ha resfriado! El regalo no llega a tiempo.',
    '¡El regalo se ha caído del trineo!',
  ]);
});

test('the game constants match the design', () => {
  assert.equal(APN.STOPS_PER_LEVEL, 6);
  assert.equal(APN.MIN_TO_PASS, 3);
  assert.equal(APN.TURBO_STREAK, 3);
  assert.equal(APN.FLIGHT_SECONDS, 20);
  assert.equal(APN.TURBO_FLIGHT_SECONDS, 14);
  assert.equal(APN.MAX_STARS, 5);
  assert.equal(APN.EXPRESS_FOR_FOURTH_STAR, undefined);
  assert.equal(APN.EXPRESS_FOR_FIFTH_STAR, 6);
  assert.equal(stopIds.length, APN.STOPS_PER_LEVEL);
});

// Seeded rng (mulberry32) so many-seed tests are repeatable.
function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// `count` questions for every stop plus `count` general ones; `describe(j)` gives the
// subject, topics and lang of the j-th question of each group.
function spreadBank(count, describe) {
  const bank = [];
  for (const place of [...stopIds, 'general']) {
    for (let j = 0; j < count; j++) {
      bank.push({
        id: `${place}-${j}`,
        place,
        minAge: 10,
        maxAge: 12,
        ...describe(j),
      });
    }
  }
  return bank;
}

const mixedBank = spreadBank(60, (j) => ({
  lang: j % 5 === 0 ? 'es' : 'ca',
  subject: `s${j % 6}`,
  topics: [`t${j % 10}`],
}));

function gamesOver(bank, seeds = 200) {
  return Array.from({ length: seeds }, (_, seed) =>
    APN.pickQuestions(level, bank, 11, seededRng(seed + 1)),
  );
}

test('a game never has more than two Catalan questions', () => {
  for (const game of gamesOver(mixedBank)) {
    assert.ok(game.filter((q) => q.lang === 'ca').length <= 2);
  }
});

test('a game spreads subjects when the bank allows it', () => {
  for (const game of gamesOver(mixedBank)) {
    assert.equal(new Set(game.map((q) => q.subject)).size, 6);
  }
});

test('a game avoids shared topics when the bank allows it', () => {
  const spanishBank = spreadBank(60, (j) => ({ lang: 'es', subject: `s${j % 6}`, topics: [`t${j % 10}`] }));
  for (const game of gamesOver(spanishBank)) {
    const topics = game.flatMap((q) => q.topics);
    assert.equal(new Set(topics).size, topics.length);
  }
});

test('the Catalan cap outlasts the subject and topic rules', () => {
  const sameKind = { subject: 'math', topics: ['x'] };
  const bank = spreadBank(4, (j) => ({ ...sameKind, lang: j === 0 ? 'es' : 'ca' }));
  // Three more Spanish general questions so a general turn is never forced into Catalan.
  for (let j = 0; j < 3; j++) {
    bank.push({ id: `general-es-${j}`, place: 'general', minAge: 10, maxAge: 12, lang: 'es', ...sameKind });
  }
  for (const game of gamesOver(bank)) {
    assert.ok(game.filter((q) => q.lang === 'ca').length <= 2);
  }
});

test('the rules are relaxed rather than failing', () => {
  const bank = spreadBank(4, () => ({ lang: 'ca', subject: 'math', topics: ['x'] }));
  for (const game of gamesOver(bank, 20)) {
    assert.equal(game.length, 6);
  }
});

test('splitSpanish turns braces into Spanish parts and drops them from the text', () => {
  assert.deepEqual(APN.splitSpanish('«Hot» ({caliente}) is warm.'), ['«Hot» (', ['caliente', 'es'], ') is warm.']);
  assert.deepEqual(APN.splitSpanish('{hermano} first'), [['hermano', 'es'], ' first']);
  assert.deepEqual(APN.splitSpanish('No marks here.'), ['No marks here.']);
});

test('plainText drops the braces', () => {
  assert.equal(APN.plainText('«Hot» ({caliente}) is warm.'), '«Hot» (caliente) is warm.');
});
