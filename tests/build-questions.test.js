const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  validateBank,
  renderQuestionsJs,
  buildQuestions,
  INVALID_JSON
} = require('../scripts/build-questions.js');

const SUBJECTS = ['geography', 'history', 'sports', 'culture', 'maths', 'science', 'language', 'english', 'catalan'];
const LANG = { english: 'en', catalan: 'ca', language: 'es' };
const context = { subjects: SUBJECTS, stopIds: ['barcelona', 'paris'] };

function question(overrides = {}) {
  return {
    id: 'q-1',
    lang: 'es',
    topics: ['t-geography'],
    difficulty: 1,
    place: 'barcelona',
    minAge: 10,
    maxAge: 12,
    prompt: 'Cual es la capital de Cataluna?',
    options: ['Girona', 'Barcelona', 'Lleida', 'Tarragona'],
    correct: 1,
    explanation: 'Barcelona es la capital.',
    references: ['https://example.org/barcelona'],
    ...overrides
  };
}

function validBank() {
  return SUBJECTS.map((subject) => ({
    file: `${subject}.json`,
    data: {
      topics: [{ id: `t-${subject}`, name: `Tema ${subject}` }],
      questions: subject === 'geography' ? [question()] : []
    }
  }));
}

function withGeography(mutate) {
  const bank = validBank();
  mutate(bank[0].data, bank);
  return validateBank(bank, context);
}

function withQuestion(overrides) {
  return withGeography((data) => {
    data.questions = [question(overrides)];
  });
}

test('a valid bank has no problems', () => {
  assert.deepEqual(validateBank(validBank(), context), []);
});

test('invalid JSON is reported, not thrown', () => {
  const bank = validBank();
  bank[1].data = INVALID_JSON;
  assert.deepEqual(validateBank(bank, context), ['history.json: -: invalid JSON']);
});

test('a file with the wrong shape is reported', () => {
  const bank = validBank();
  bank[1].data = { topics: [] };
  assert.deepEqual(validateBank(bank, context), [
    'history.json: -: must be an object with "topics" and "questions" arrays'
  ]);
});

test('a file that is not a subject is reported', () => {
  const bank = validBank();
  bank.push({ file: 'cooking.json', data: { topics: [], questions: [] } });
  assert.deepEqual(validateBank(bank, context), ['cooking.json: -: not a subject']);
});

test('a missing subject file is reported', () => {
  const bank = validBank().filter((f) => f.file !== 'maths.json');
  assert.deepEqual(validateBank(bank, context), ['maths.json: -: missing file']);
});

test('an invalid topic id is reported', () => {
  const problems = withGeography((data) => {
    data.topics.push({ id: 'Bad Id', name: 'x' });
  });
  assert.deepEqual(problems, ['geography.json: -: invalid topic id "Bad Id"']);
});

test('a duplicate topic id is reported', () => {
  const problems = withGeography((data, bank) => {
    bank[1].data.topics[0].id = 't-geography';
  });
  assert.deepEqual(problems, ['history.json: -: duplicate topic id "t-geography"']);
});

test('an invalid id is reported', () => {
  assert.deepEqual(withQuestion({ id: 'Bad_Id' }), ['geography.json: Bad_Id: invalid id']);
});

test('a question without a usable id is reported with a question mark', () => {
  assert.deepEqual(withQuestion({ id: 5 }), ['geography.json: ?: invalid id']);
});

test('a duplicate id is reported', () => {
  const problems = withGeography((data) => {
    data.questions = [question(), question()];
  });
  assert.deepEqual(problems, ['geography.json: q-1: duplicate id']);
});

test('a duplicate id across files is reported', () => {
  const bank = validBank();
  bank[1].data.questions = [question({ topics: ['t-history'] })];
  assert.deepEqual(validateBank(bank, context), ['history.json: q-1: duplicate id']);
});

test('a missing field is reported', () => {
  const q = question();
  delete q.explanation;
  const problems = withGeography((data) => {
    data.questions = [q];
  });
  assert.deepEqual(problems, ['geography.json: q-1: missing field "explanation"']);
});

test('an unknown field is reported', () => {
  assert.deepEqual(withQuestion({ refrences: [] }), ['geography.json: q-1: unknown field "refrences"']);
});

test('a language that does not match the subject is reported', () => {
  assert.deepEqual(withQuestion({ lang: 'en' }), [
    'geography.json: q-1: language "en" does not match subject "geography"'
  ]);
});

test('english needs en, catalan needs ca and language needs es', () => {
  const bank = validBank();
  const english = bank.find((f) => f.file === 'english.json');
  english.data.questions = [question({ id: 'e-1', lang: 'es', place: 'general', topics: ['t-english'] })];
  assert.deepEqual(validateBank(bank, context), [
    'english.json: e-1: language "es" does not match subject "english"'
  ]);
  english.data.questions[0].lang = 'en';
  assert.deepEqual(validateBank(bank, context), []);
});

test('a fourth topic is reported', () => {
  const problems = withGeography((data) => {
    data.topics.push({ id: 'a', name: 'a' }, { id: 'b', name: 'b' }, { id: 'c', name: 'c' });
    data.questions = [question({ topics: ['t-geography', 'a', 'b', 'c'] })];
  });
  assert.deepEqual(problems, ['geography.json: q-1: needs 1 to 3 different topics']);
});

test('a repeated topic is reported', () => {
  assert.deepEqual(withQuestion({ topics: ['t-geography', 't-geography'] }), [
    'geography.json: q-1: needs 1 to 3 different topics'
  ]);
});

test('a topic from another file is reported as unknown', () => {
  assert.deepEqual(withQuestion({ topics: ['t-history'] }), ['geography.json: q-1: unknown topic "t-history"']);
});

test('difficulty 4 is reported', () => {
  assert.deepEqual(withQuestion({ difficulty: 4 }), ['geography.json: q-1: difficulty must be 1, 2 or 3']);
});

test('an unknown place is reported', () => {
  assert.deepEqual(withQuestion({ place: 'atlantis' }), ['geography.json: q-1: unknown place "atlantis"']);
});

test('a place question outside the place subjects is reported', () => {
  const bank = validBank();
  bank.find((f) => f.file === 'maths.json').data.questions = [
    question({ id: 'm-1', topics: ['t-maths'], place: 'paris' })
  ];
  assert.deepEqual(validateBank(bank, context), [
    'maths.json: m-1: a question about a place must be geography, history, sports or culture'
  ]);
});

test('ages outside 10 to 12 are reported', () => {
  assert.deepEqual(withQuestion({ minAge: 9 }), ['geography.json: q-1: ages must be 10 to 12']);
  assert.deepEqual(withQuestion({ maxAge: 13 }), ['geography.json: q-1: ages must be 10 to 12']);
});

test('repeated or blank options are reported', () => {
  const expected = ['geography.json: q-1: needs 4 different non-blank options'];
  assert.deepEqual(withQuestion({ options: ['a', 'a', 'b', 'c'] }), expected);
  assert.deepEqual(withQuestion({ options: ['a', ' ', 'b', 'c'] }), expected);
  assert.deepEqual(withQuestion({ options: ['a', 'b', 'c'] }), expected);
});

test('a correct index out of range is reported', () => {
  assert.deepEqual(withQuestion({ correct: 4 }), ['geography.json: q-1: correct must be 0 to 3']);
  assert.deepEqual(withQuestion({ correct: 1.5 }), ['geography.json: q-1: correct must be 0 to 3']);
});

test('a prompt over 120 characters is reported', () => {
  assert.deepEqual(withQuestion({ prompt: 'x'.repeat(121) }), [
    'geography.json: q-1: prompt longer than 120 characters'
  ]);
});

test('an option over 40 characters is reported', () => {
  assert.deepEqual(withQuestion({ options: ['x'.repeat(41), 'b', 'c', 'd'] }), [
    'geography.json: q-1: option longer than 40 characters'
  ]);
});

test('an explanation over 160 characters is reported', () => {
  assert.deepEqual(withQuestion({ explanation: 'x'.repeat(161) }), [
    'geography.json: q-1: explanation longer than 160 characters'
  ]);
});

test('a missing reference is reported', () => {
  const expected = ['geography.json: q-1: needs at least one https reference'];
  assert.deepEqual(withQuestion({ references: [] }), expected);
  assert.deepEqual(withQuestion({ references: ['http://example.org'] }), expected);
});

test('the output puts subject after lang and keeps file order', () => {
  const bank = validBank();
  bank[0].data.questions = [question({ id: 'g-2' }), question({ id: 'g-1' })];
  bank[1].data.questions = [question({ id: 'h-1', topics: ['t-history'] })];
  const output = renderQuestionsJs(bank, SUBJECTS);
  const loaded = new Function('globalThis', `${output}; return globalThis.APN;`)({});
  assert.deepEqual(loaded.QUESTIONS.map((q) => q.id), ['g-2', 'g-1', 'h-1']);
  assert.deepEqual(Object.keys(loaded.QUESTIONS[0]), [
    'id', 'lang', 'subject', 'topics', 'difficulty', 'place', 'minAge', 'maxAge',
    'prompt', 'options', 'correct', 'explanation', 'references'
  ]);
  assert.deepEqual(Object.keys(loaded.TOPICS[0]), ['id', 'subject', 'name']);
  assert.equal(loaded.QUESTIONS[2].subject, 'history');
  assert.ok(output.startsWith(
    '// Generated by scripts/build-questions.js from questions/*.json. Do not edit by hand.\n(function () {\n'
  ));
  assert.ok(output.endsWith('})();\n'));
});

test('the output is the same for the same input', () => {
  assert.equal(renderQuestionsJs(validBank(), SUBJECTS), renderQuestionsJs(validBank(), SUBJECTS));
});

test('buildQuestions writes nothing on problems', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbank-'));
  fs.writeFileSync(path.join(dir, 'geography.json'), '{ not json');
  const result = buildQuestions(dir, context);
  assert.equal(result.output, null);
  assert.ok(result.problems.includes('geography.json: -: invalid JSON'));
  fs.rmSync(dir, { recursive: true });
});

test('buildQuestions renders a valid directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbank-'));
  for (const { file, data } of validBank()) fs.writeFileSync(path.join(dir, file), JSON.stringify(data));
  const result = buildQuestions(dir, context);
  assert.deepEqual(result.problems, []);
  assert.equal(typeof result.output, 'string');
  fs.rmSync(dir, { recursive: true });
});
