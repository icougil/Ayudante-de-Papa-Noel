const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {
  validateBank,
  renderQuestionsJs,
  buildQuestions,
  INVALID_JSON
} = require('../scripts/build-questions.js');
const { AREAS } = require('../scripts/curriculum.js');

const SUBJECTS = [
  'geography', 'history', 'sports', 'culture', 'maths', 'science', 'language', 'english',
  'catalan', 'citizenship'
];
const LANG = { english: 'en', catalan: 'ca', language: 'es' };
const context = { subjects: SUBJECTS, stopIds: ['barcelona', 'paris'] };
const CURRICULUM = {
  geography: { area: 'medi', block: 'societats-i-territoris' },
  history: { area: 'medi', block: 'societats-i-territoris' },
  sports: { area: 'educacio-fisica', block: 'activitats-ludiques-culturals-i-expressives' },
  culture: { area: 'educacio-artistica', block: 'plastica-i-visual' },
  maths: { area: 'matematiques', block: 'sentit-numeric' },
  science: { area: 'medi', block: 'cultura-cientifica' },
  language: { area: 'llengua-castellana', block: 'reflexio-sobre-la-llengua' },
  english: { area: 'llengua-estrangera', block: 'reflexio-sobre-la-llengua' },
  catalan: { area: 'llengua-catalana', block: 'reflexio-sobre-la-llengua' },
  citizenship: { area: 'valors-civics', block: 'societat-justicia-i-democracia' }
};

function question(overrides = {}) {
  return {
    id: 'q-1',
    lang: 'es',
    topics: ['t-geography'],
    curriculum: CURRICULUM.geography,
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

test('a missing curriculum is reported', () => {
  const q = question();
  delete q.curriculum;
  const problems = withGeography((data) => { data.questions = [q]; });
  assert.deepEqual(problems, ['geography.json: q-1: missing field "curriculum"']);
});

test('a curriculum that is not an object is reported', () => {
  assert.deepEqual(withQuestion({ curriculum: 'medi' }), [
    'geography.json: q-1: curriculum must be an object with "area" and "block"'
  ]);
});

test('a curriculum without area or block is reported', () => {
  assert.deepEqual(withQuestion({ curriculum: { area: 'medi' } }), [
    'geography.json: q-1: curriculum must have "area" and "block"'
  ]);
  assert.deepEqual(withQuestion({ curriculum: {} }), [
    'geography.json: q-1: curriculum must have "area" and "block"'
  ]);
});

test('an unknown curriculum area is reported', () => {
  assert.deepEqual(withQuestion({ curriculum: { area: 'foo', block: 'bar' } }), [
    'geography.json: q-1: unknown curriculum area "foo"'
  ]);
  assert.deepEqual(withQuestion({ curriculum: { area: 'constructor', block: 'bar' } }), [
    'geography.json: q-1: unknown curriculum area "constructor"'
  ]);
});

test('a block that does not belong to the area is reported', () => {
  assert.deepEqual(withQuestion({ curriculum: { area: 'medi', block: 'foo' } }), [
    'geography.json: q-1: unknown curriculum block "foo" for area "medi"'
  ]);
});

test('a curriculum area that does not match the subject is reported', () => {
  assert.deepEqual(withQuestion({ curriculum: { area: 'matematiques', block: 'sentit-numeric' } }), [
    'geography.json: q-1: curriculum area "matematiques" does not match subject "geography"'
  ]);
});

test('an unknown curriculum field is reported', () => {
  assert.deepEqual(withQuestion({
    curriculum: { area: 'medi', block: 'societats-i-territoris', review: true }
  }), ['geography.json: q-1: curriculum has unknown field "review"']);
});

test('every curriculum id is documented', () => {
  const doc = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'curriculum', 'cicle-superior.md'), 'utf8'
  );
  for (const [area, blocks] of Object.entries(AREAS)) {
    assert.ok(doc.includes(`\`${area}\``), area);
    for (const block of blocks) assert.ok(doc.includes(`\`${block}\``), block);
  }
});

test('a language that does not match the subject is reported', () => {
  assert.deepEqual(withQuestion({ lang: 'en' }), [
    'geography.json: q-1: language "en" does not match subject "geography"'
  ]);
});

function withSubjectQuestion(subject, lang) {
  const bank = validBank();
  const file = bank.find((f) => f.file === `${subject}.json`);
  file.data.questions = [question({
    id: 'x-1', lang, place: 'general', topics: [`t-${subject}`], curriculum: CURRICULUM[subject]
  })];
  return validateBank(bank, context);
}

test('english needs en', () => {
  assert.deepEqual(withSubjectQuestion('english', 'es'), [
    'english.json: x-1: language "es" does not match subject "english"'
  ]);
  assert.deepEqual(withSubjectQuestion('english', 'en'), []);
});

test('catalan needs ca', () => {
  assert.deepEqual(withSubjectQuestion('catalan', 'es'), [
    'catalan.json: x-1: language "es" does not match subject "catalan"'
  ]);
  assert.deepEqual(withSubjectQuestion('catalan', 'ca'), []);
});

test('language needs es', () => {
  assert.deepEqual(withSubjectQuestion('language', 'ca'), [
    'language.json: x-1: language "ca" does not match subject "language"'
  ]);
  assert.deepEqual(withSubjectQuestion('language', 'es'), []);
});

test('citizenship accepts Spanish or Catalan and valors-civics', () => {
  assert.deepEqual(withSubjectQuestion('citizenship', 'es'), []);
  assert.deepEqual(withSubjectQuestion('citizenship', 'ca'), []);
});

test('a citizenship question cannot use another area', () => {
  const bank = validBank();
  const file = bank.find((f) => f.file === 'citizenship.json');
  file.data.questions = [question({
    id: 'c-1', place: 'general', topics: ['t-citizenship'], curriculum: CURRICULUM.maths
  })];
  assert.deepEqual(validateBank(bank, context), [
    'citizenship.json: c-1: curriculum area "matematiques" does not match subject "citizenship"'
  ]);
});

test('a blank or non-string prompt is reported', () => {
  assert.deepEqual(withQuestion({ prompt: '   ' }), ['geography.json: q-1: prompt must be non-blank text']);
  assert.deepEqual(withQuestion({ prompt: 5 }), ['geography.json: q-1: prompt must be non-blank text']);
});

test('a blank or non-string explanation is reported', () => {
  assert.deepEqual(withQuestion({ explanation: '' }), ['geography.json: q-1: explanation must be non-blank text']);
  assert.deepEqual(withQuestion({ explanation: null }), ['geography.json: q-1: explanation must be non-blank text']);
});

test('a topic without a usable name is reported', () => {
  for (const name of [undefined, 3, '  ']) {
    const problems = withGeography((data) => {
      data.topics.push({ id: 'nameless', name });
    });
    assert.deepEqual(problems, ['geography.json: -: topic "nameless" needs a non-blank name']);
  }
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
    question({ id: 'm-1', topics: ['t-maths'], place: 'paris', curriculum: CURRICULUM.maths })
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

test('a prompt over 90 characters is reported', () => {
  assert.deepEqual(withQuestion({ prompt: 'x'.repeat(91) }), [
    'geography.json: q-1: prompt longer than 90 characters'
  ]);
});

test('an option over 26 characters is reported', () => {
  assert.deepEqual(withQuestion({ options: ['x'.repeat(27), 'b', 'c', 'd'] }), [
    'geography.json: q-1: option longer than 26 characters'
  ]);
});

test('an explanation over 140 characters is reported', () => {
  assert.deepEqual(withQuestion({ explanation: 'x'.repeat(141) }), [
    'geography.json: q-1: explanation longer than 140 characters'
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
    'id', 'lang', 'subject', 'topics', 'curriculum', 'difficulty', 'place', 'minAge', 'maxAge',
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

test('the committed js/questions.js matches the JSON files', () => {
  const root = path.join(__dirname, '..');
  require(path.join(root, 'js', 'data-level-1.js'));
  const APN = globalThis.APN;
  const real = { subjects: APN.SUBJECTS, stopIds: APN.LEVELS[0].stops.map((s) => s.id) };
  const { problems, output } = buildQuestions(path.join(root, 'questions'), real);
  assert.deepEqual(problems, []);
  assert.equal(output, fs.readFileSync(path.join(root, 'js', 'questions.js'), 'utf8'));
});

test('accented text survives the build', () => {
  const text = "à ç l·l « » ñ '";
  const bank = validBank();
  bank[0].data.questions = [question({ prompt: text, explanation: text })];
  const output = renderQuestionsJs(bank, SUBJECTS);
  const sandbox = { globalThis: {} };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(output, sandbox);
  assert.equal(sandbox.APN.QUESTIONS[0].prompt, text);
  assert.equal(sandbox.APN.QUESTIONS[0].explanation, text);
});

function withEnglishQuestion(overrides) {
  const bank = validBank();
  const file = bank.find((f) => f.file === 'english.json');
  file.data.questions = [question({
    id: 'x-1', lang: 'en', place: 'general', topics: ['t-english'],
    curriculum: CURRICULUM.english,
    prompt: 'What is the opposite of «cold»?',
    explanation: '«Hot» ({caliente}) is the opposite of «cold» ({frío}).',
    ...overrides
  })];
  return validateBank(bank, context);
}

test('Spanish marked with braces in an English question is accepted', () => {
  assert.deepEqual(withEnglishQuestion({ prompt: 'Which English word means «{hermano}»?' }), []);
});

test('an unclosed, stray or nested brace is reported', () => {
  assert.deepEqual(withEnglishQuestion({ prompt: 'Which word means {hermano?' }), [
    'english.json: x-1: prompt has an unclosed, stray or nested { }'
  ]);
  assert.deepEqual(withEnglishQuestion({ explanation: '«Hot» (caliente}) is warm.' }), [
    'english.json: x-1: explanation has an unclosed, stray or nested { }'
  ]);
  assert.deepEqual(withEnglishQuestion({ explanation: '«Hot» ({cal{ien}te}) is warm.' }), [
    'english.json: x-1: explanation has an unclosed, stray or nested { }'
  ]);
});

test('an empty brace pair is reported', () => {
  assert.deepEqual(withEnglishQuestion({ prompt: 'Which word means { }?' }), [
    'english.json: x-1: prompt has an empty { }'
  ]);
});

test('a gloss in brackets that is not marked as Spanish is reported', () => {
  assert.deepEqual(withEnglishQuestion({ explanation: '«Hot» (caliente) is the opposite of «cold».' }), [
    'english.json: x-1: explanation has a gloss in brackets not marked as Spanish'
  ]);
  assert.deepEqual(withEnglishQuestion({ prompt: 'What does «hot» mean ({caliente} or not)?' }), [
    'english.json: x-1: prompt has a gloss in brackets not marked as Spanish'
  ]);
});

test('braces in a Spanish question are reported', () => {
  assert.deepEqual(withGeography((d) => { d.questions[0].explanation = 'Barcelona es la {capital}.'; }), [
    'geography.json: q-1: explanation marks Spanish in a Spanish question'
  ]);
});

test('a brace in an option is reported', () => {
  assert.deepEqual(withEnglishQuestion({ options: ['{hot}', 'warm', 'cool', 'cold'] }), [
    'english.json: x-1: an option has a { }'
  ]);
});

test('the braces do not count towards the length limits', () => {
  const explanation = '{' + 'a'.repeat(138) + '} b';
  assert.equal(explanation.length, 142);
  assert.deepEqual(withEnglishQuestion({ explanation }), []);
});
