# A growing question bank — design (part 1 of 3)

Date: 2026-11-18. Approved by the owner in conversation on the same day.

## Intent

A bank of 30 questions repeats after a game or two. The owner wants a large, varied bank that
keeps growing, built from what children are taught in the last cycle of primary school in
Catalonia (cicle superior, 5è and 6è, ages 10 to 12), with some questions in Catalan. This
document covers part 1 of three:

1. **A new question bank** (this document): the questions' data format, a build step, labels for
   language, topic and difficulty, a picker that spreads subjects and caps Catalan, and a first
   batch of about 30 new questions.
2. **A scheduled job** (later design): a Claude cloud routine that adds a batch every few days as
   a pull request the owner reviews.
3. **Remembering the player** (later design): the browser keeps past games, to avoid repeated
   questions, to raise the difficulty as the player does well, and later to bring back topics
   answered wrongly. The first slice, not repeating seen questions, is done: see
   `2026-11-23-seen-questions-design.md`.

Points the owner did not decide are marked **(designer's call)**.

## Goals, non-goals, anti-goals

- Goal: questions live in JSON files that a person or a job can add to without touching code.
- Goal: each question is labelled with its language, subject, topics, difficulty and references,
  so later parts can pick by them.
- Goal: a game spreads its six questions over different subjects and topics, and asks at most two
  questions in Catalan.
- Goal: the bank grows to about 60 questions with this part, about a third of the new ones in
  Catalan.
- Goal: opening `index.html` from disk keeps working, with no build to run first.
- Non-goal: using the difficulty to pick questions (part 3), remembering past games (part 3),
  the scheduled job (part 2), letting the player choose topics (future), translating the game's
  screens (they stay in Spanish).
- Anti-goal: text copied or adapted from a source. Every question is written in the project's own
  words; sources are used only for facts and as references (see Sources and licence).
- Anti-goal: a game that is mostly in Catalan. The game is in Spanish with some Catalan questions.
- Anti-goal: a stale generated file reaching the player because someone edited the JSON and
  forgot the build.

## Approaches

Where the questions live, given that the game loads only plain `<script>` tags (it opens from
`file://` and cannot fetch a JSON file):

1. One hand-edited JS file, `js/questions.js`, that each batch appends to. Simplest, no build.
2. One JS file per batch, each with its own `<script>` tag. Every batch edits `index.html`.
3. **JSON files plus a Node script that generates one JS file — chosen by the owner.** JSON is the
   easiest format for a job to write and for the owner to review, and it leaves room for tools
   that read the bank (counts per topic, a future topic picker). The generated file is committed
   and a test fails when it is out of date, which removes the risk of a forgotten build.

## Design

### Files

| Path | Role |
|---|---|
| `questions/<subject>.json` | One file per subject (`geography.json`, `maths.json`, `catalan.json`…): that subject's topics and questions. |
| `scripts/build-questions.js` | Reads every `questions/*.json` file, validates, writes `js/questions.js`. |
| `js/questions.js` | Generated, committed. Defines `APN.TOPICS` and `APN.QUESTIONS`. |
| `js/data-level-1.js` | Keeps `APN.SUBJECTS` and `APN.LEVELS`; loses `APN.QUESTIONS`. |
| `index.html` | Loads `js/questions.js` after `js/data-level-1.js` and before `js/game-logic.js`. |

The files are grouped by subject, as the owner chose: all the maths in `maths.json`, and so on.
A question about a city goes in its subject's file with `place` set to the city (a Barcelona
history question is in `history.json`). Each file is
`{ "topics": [ ... ], "questions": [ ... ] }`, and its name must be one of `APN.SUBJECTS`; every
subject has a file, even if it is still short. The file name is the subject: questions and topics
carry no `subject` field, and a question can only use the topics of its own file **(designer's
call: the structure itself keeps topics and subjects consistent)**. The build reads the files in
the order of `APN.SUBJECTS` and keeps each file's question order, so the generated file is stable.
New questions are added at the end of their file. Which questions came in together is in the git
history and the pull requests.

### A question

```json
{
  "id": "medi-ca-001",
  "lang": "ca",
  "topics": ["cos-huma"],
  "difficulty": 1,
  "place": "general",
  "minAge": 10,
  "maxAge": 12,
  "prompt": "Quin òrgan bombeja la sang per tot el cos?",
  "options": ["El fetge", "El cor", "Els pulmons", "El ronyó"],
  "correct": 1,
  "explanation": "El cor és un múscul que bombeja la sang per tot el cos.",
  "references": ["https://www.edu365.cat/..."]
}
```

Rules, enforced by the build and by `tests/data.test.js`:

- `id`: unique across all files, lowercase letters, digits and hyphens. The 30 existing ids keep
  their value (`barcelona-1`, `general-7`…). New ids are free-form but unique **(designer's call)**.
- `lang`: `es`, `ca` or `en`. The prompt, options and explanation are all in that language.
- An `en` question's explanation glosses each key English word with its Spanish meaning in
  brackets, e.g. «Hot» ({caliente}), so a learner reads the meaning too; it still counts towards
  the 160-character limit.
- The subject comes from the file (here `science.json`). `APN.SUBJECTS` gains `catalan`
  (questions about the Catalan language). Language and subject must agree: `english` ⇔ `en`; `catalan` ⇒ `ca`; `language` (the Spanish
  language) ⇒ `es`. Other subjects are `es` or `ca`.
- `topics`: one to three ids, each among the topics of the same file, with no repeats.
- `difficulty`: 1, 2 or 3. **1** is taught in 5è, **2** is a 6è topic, **3** is a 6è topic with a
  harder twist (two steps, a less obvious fact). Labelled now, unused by the game until part 3.
- `place`: a stop id of the level, or `general`. Questions about a place keep today's subject
  rule: `geography`, `history`, `sports` or `culture`.
- `minAge`/`maxAge`: kept as today (10 and 12), so the picker's age filter is unchanged.
- `prompt` at most 120 characters, each option at most 40, `explanation` at most 160 (today's
  limits). Four distinct, non-blank options; `correct` an integer 0 to 3.
- `references`: at least one `https://` URL where the fact can be checked. Required for every
  question, including the 30 existing ones, which get references added while being moved
  **(designer's call: it also makes the owner's pending review of those 30 easier)**.

### Topics

Each subject file's `topics` is an array of `{ "id": "rius", "name": "Ríos" }`. `id` is unique
across all files, lowercase with hyphens; `name` is the Spanish label a future topic picker would
show. In the generated `APN.TOPICS` each topic gets its `subject` from its file. The first list is built from the cicle superior parts of
the current curriculum's orientations for Coneixement del medi, Matemàtiques, Llengües and
Llengües estrangeres (projectes.xtec.cat/nou-curriculum), plus the topics the 30 existing
questions need (sports, culture of the six cities). A batch that needs a new topic adds it to
its subject's file in the same pull request. A topic that no question uses is allowed.

### The build

`node scripts/build-questions.js` reads the files, applies every rule above, and on success writes
`js/questions.js`:

```js
// Generated by scripts/build-questions.js from questions/*.json. Do not edit by hand.
(function () {
  const APN = (globalThis.APN = globalThis.APN || {});
  APN.TOPICS = [ ... ];
  APN.QUESTIONS = [ ... ];
})();
```

The output is deterministic: same input, byte-identical file. The arrays are written as
`JSON.stringify(value, null, 2)` (JSON inside the JS file, double-quoted keys), with each
question's keys reordered to the order of the example above, and a trailing newline. On a broken
rule it writes nothing, prints one line per problem as `<file>: <id>: <problem>`, and exits with
code 1. The script exports its functions for the tests (as `scripts/stamp-release.js` does) and
uses Node's standard library only.

**What the build checks (designer's call):** every per-question rule above, including an unknown
field (an error, so a typo such as `"refrences"` cannot pass silently); unique ids across files;
unique topic ids across files; every topic of a question existing in the same file; every file
name being a subject and every subject having a file; `place` being a stop id or `general`;
the Spanish marks (see *Marking the language on screen*). It gets `APN.SUBJECTS` and the stop ids by requiring `js/data-level-1.js`, so the lists
live in one place. Counts over the whole bank (at least 3 per stop, at least 12 general) stay in
`tests/data.test.js` only: they describe the bank, not a single file.

**Loading:** like `js/data-level-1.js` today, the generated file sets `globalThis.APN` and is
loaded for that effect, by a `<script>` tag in the page and by `require('../js/questions.js')` in
the tests, after `js/data-level-1.js`. `tests/data.test.js` and `tests/game-logic.test.js` gain that
`require`.

`npm run build:questions` runs it **(designer's call)**. The deploy job does not run it: the file
is committed, and the test below guarantees it matches the JSON.

### The picker

`APN.pickQuestions(level, bank, age, rng)` keeps its signature and today's shape: one question per
stop, alternating "about the place" and "general", a general question never twice in a game. For
each stop, from the candidates of that turn it prefers, in this order:

1. no more than two `ca` questions in the game;
2. a subject not yet used in this game;
3. no topic shared with a question already picked.

It picks at random among the candidates that meet all three. If none does, it drops rule 3, then
rule 2, then rule 1, until some candidate remains; only an empty candidate list throws today's
`Not enough questions for this level and age`. So the Catalan cap is the last rule to give way:
it holds whenever the turn has any non-Catalan candidate, even at the cost of rules 2 and 3. With
the bank's guarantee of non-Catalan questions for every stop and general turn (see The first
batch), it always holds in practice. Because place questions are only geography,
history, sports or culture, the subject rule spreads them over those four and the general turns
over maths, science, language, english and catalan.

### Marking the language on screen

The page is `lang="es"`. When a question is shown, `js/ui.js` sets the `lang` attribute of the
prompt, the options and the explanation to the question's `lang` (`ca`, `en` or `es`), so screen
readers and hyphenation use the right language. The game's own texts around them stay Spanish
**(designer's call: one attribute, and it also fixes the English questions today)**. Covered by a
browser test `a Catalan question is marked as Catalan`.

Spanish words inside a Catalan or English prompt or explanation (the glosses, or «{hermano}» in
"Which English word means «{hermano}»?") are written in braces. `APN.splitSpanish` turns them
into `<span lang="es">` without the braces, and the length limits count the text without them.
The build reports, for the prompt and the explanation:
- `<field> has an unclosed, stray or nested { }`
- `<field> has an empty { }`
- `<field> marks Spanish in a Spanish question`
- `<field> has a gloss in brackets not marked as Spanish` (English only: everything in brackets
  must be inside braces)
and, for the options, `an option has a { }`. Covered by the browser test `the Spanish words
inside an English question are marked as Spanish`.

### Sources and licence

- XTEC and the curriculum site are read for facts and for what is taught at this age. Their legal
  notice reserves all rights and allows only personal use, so no text is copied or adapted. Every
  prompt, option and explanation is written in the project's own words.
- Reading list for facts: edu365 (Medi), XTEC's Ciències de la naturalesa and Ciències socials
  pages, Tresor de recursos, and general references (Wikipedia in Catalan or Spanish, official
  sites of the cities) for the city questions.
- Each question's `references` points to where its fact can be checked, not to text it copies.
- The bank stays under the repository's MIT licence.

### The first batch

About 30 new questions written from the reading list, added to their subject files.

- About a third in Catalan, at most two Catalan questions per city.
- For each of the six cities, two or three new place questions, so every city has at least five.
- The rest general, spread over maths, science, language, english and catalan, at least two each.
- Difficulties spread across 1, 2 and 3.
- Every stop keeps at least 3 non-Catalan questions (its 3 existing ones), and the general
  questions keep at least 9 non-Catalan ones, so the Catalan cap never has to give way.
- The owner reviews them in the pull request, as the reference for what a good batch looks like.

Writing this content is in scope of this part, not only the machinery: the implementer writes the
new questions, labels the 30 existing ones (`lang`, `topics`, `difficulty`), and finds a real,
checkable reference for each of the 60. The content review is a separate step from the code review
and checks: each fact against its reference, Catalan and Spanish spelling, the own-words rule,
the difficulty labels, and the length limits.

### Tests

`tests/data.test.js` (rewritten where the bank's shape changed):

- `question ids are unique`, `every question has the right shape`,
  `every question respects the length limits`, `every place is a stop of the level or general`,
  `all questions suit an 11-year-old`: kept, run on the generated `APN.QUESTIONS`.
- `there are 3 questions per stop and 12 general ones` becomes
  `every stop has at least 3 questions and there are at least 12 general ones`, keeping the place
  subject rule; the exact per-subject counts of the general questions are dropped.
- New: `every question's language matches its subject`, `every topic of a question belongs to
  its subject`, `every question has a difficulty from 1 to 3`, `every question has at least one
  https reference`, `topic ids are unique`.

`tests/build-questions.test.js` (new):

- `the committed js/questions.js matches the JSON files`: builds in memory and compares with the
  file on disk. This is the guard against a forgotten build.
- One test per broken rule (duplicate id, a topic from another file, language and subject
  disagree, a fourth topic, difficulty 4, missing reference, prompt over 120 characters, a file
  that is not a subject, an unknown field), each asserting the exact
  `<file>: <id>: <problem>` line and that nothing is written.

`tests/game-logic.test.js` (picker):

- `a game never has more than two Catalan questions` (a bank with many Catalan candidates, many
  seeds).
- `a game spreads subjects when the bank allows it`.
- `a game avoids shared topics when the bank allows it`.
- `the rules are relaxed rather than failing` (a bank where every candidate is Catalan, or of one
  subject, still yields six questions).

`e2e`: the existing browser tests keep passing; `stamp-release` guard already requires the new
`<script>` reference to be stamped.

### Documentation

- README: "Adding a question" describes the subject files, their topics, the build command, and
  the own-words rule. The file table lists `questions/`, `js/questions.js` and the script.
- BACKLOG: "Grow the question bank" and "Get questions from an external source" are updated to
  say part 1 is done and parts 2 and 3 remain; "Do not repeat questions" moves under part 3.

## Left to the builder

- The exact first topic list, within the rules above.
- The wording of the build's problem messages, within the `<file>: <id>: <problem>` shape.
- How the picker implements the relaxing order, as long as the tests above hold.
