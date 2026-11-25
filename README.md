# Ayudante de Papá Noel

*Santa's Helper*: a small browser quiz game for children aged 10 to 12. Santa flies across Spain
and the player helps him deliver a gift in each city by answering a question.

**Play it:** <https://tiny.cc/ayudante-de-papa-noel/>

![Santa flying over Barcelona while the player answers a question](docs/screenshot.png)

The code is in English. The game itself (screens, questions, explanations) is in Spanish.

## How to play

- Santa never stops: the question is asked while he flies to the next city.
- A right answer delivers the gift. Answering before Santa reaches the city is an express
  delivery (⚡).
- There is no penalty for taking time: Santa circles over the city until the player answers.
- A wrong answer loses the gift to a mishap (a snowstorm, a reindeer with a cold, a gift falling
  off the sleigh) and shows the right answer with a short explanation.
- Three right answers in a row turn on turbo: the next flight is faster.
- A level has 6 cities. Delivering 3 gifts passes it; 3, 4, 5 or 6 gifts earn 1, 2, 3 or 4 stars.
  The fifth star needs all 6 gifts delivered as express deliveries.
- The game has music and sound effects. The 🔊 button switches them off: in the top-right
  corner of the cover and the result screen, and at the right end of the scoreboard during the
  trip. The choice is remembered. The music is the chorus of Jingle Bells (James Pierpont, 1857),
  in the public domain; no sound file is used.

Level 1 is Spain: Barcelona, Zaragoza, Madrid, Sevilla, Santiago de Compostela and Bilbao.

## Run it

There is nothing to build or install to play: open `index.html` in a browser.

To serve it over HTTP instead, with Node.js:

```sh
npx serve .
```

and visit the address it prints (`http://localhost:3000` by default).

## Tests

The game logic and the question bank are covered by tests that run on Node.js
(24 or later, the version CI uses), with no dependencies:

```sh
node --test tests/*.test.js
```

The screens are covered by browser tests that drive the real game with
[Playwright](https://playwright.dev), the only development dependency: in desktop Chromium, and
as an emulated iPhone 13 on WebKit (the engine behind Safari):

```sh
npm install
npx playwright install chromium webkit
npm run test:e2e
```

GitHub Actions runs both sets on every push to `main` and on every pull request
(`.github/workflows/ci.yml`). The game is published to GitHub Pages only from `main`, and only
when every test passes. The deploy stamps the published copy with its date, time (Barcelona) and
commit, so browsers load fresh files. The version shows faintly at the bottom of the cover and in
the console. Opened from disk, no version is shown. If a deploy fails, re-run the whole workflow
(or start it from the Actions tab, `Run workflow` on `main`), never only the failed job: that
uploads a second `github-pages` artifact and every further retry fails.

A pull request can be played before merging, on a phone too, through the `Play this branch` link
in its description. The link uses [htmlpreview.github.io](https://htmlpreview.github.io), which
loads the pull request's last push from GitHub, so that copy has no version stamp. The link keeps
working after the merge, so earlier pull requests can still be played. After a push, GitHub may
take a few minutes to serve the new files.

## Privacy

The published game counts visits with [Umami](https://umami.is). It sets no cookies, so the game
shows no cookie banner. To tell one visit from another, Umami's servers use the visitor's IP
address and browser details to work out an anonymous visit identifier, and use the IP address to
derive an approximate location. The IP address itself is not kept in the statistics, but Umami
may record it in its operational and security logs. See
[Umami's privacy policy](https://umami.is/privacy).

Only visits on `icougil.github.io` are counted. A local run or a pull request preview still downloads Umami's
script, but sends no visit. The browser tests never contact Umami: they replace its script with an empty one.

The game keeps two things in the browser: whether sound is on or off (the `localStorage` key
`apn.sound`) and the ids of the questions already seen (`apn.seenQuestions`), so a new game prefers
questions the player has not met. It keeps no answers. If the browser blocks storage, the game
plays the same, just without remembering. Some browsers do this for a page opened straight from disk,
so the memory only works when the game is served over http(s).

## Project layout

| Path | What it holds |
|---|---|
| `index.html` | The three screens: start, trip and result |
| `css/styles.css` | All the styles and animations |
| `js/data-level-1.js` | Level 1: the subjects and the cities on the route |
| `questions/` | The question bank, one JSON file per subject: its topics and its questions |
| `js/questions.js` | The questions and topics the game loads. Generated, do not edit |
| `scripts/build-questions.js` | Checks `questions/*.json` and generates `js/questions.js` |
| `scripts/question-pools.js` | Counts the questions of each pool (`npm run pools`) |
| `scripts/curriculum-pools.js` | Counts the questions of each curriculum block (`npm run curriculum`) |
| `.claude/skills/write-question-batch/` | The instructions of the scheduled job that adds questions |
| `docs/curriculum/` | The curriculum reference for question writers: the sabers and the facts that are out |
| `js/game-logic.js` | The rules, as pure functions that never touch the page |
| `js/sound.js` | The music and the sound effects, generated in the browser, and the sound switch |
| `js/ui.js` | Draws the scene, moves it and wires the rules to the page |
| `tests/` | Unit tests for the data, the rules, the tune, the sound choice and the version stamp |
| `scripts/` | Release tooling run by CI (the version stamp) |
| `e2e/` | Browser tests for the screens |
| `BACKLOG.md` | Work agreed but not started |

## Adding a question

Questions live in the file of their subject, `questions/<subject>.json` (`geography`, `history`,
`sports`, `culture`, `maths`, `science`, `language`, `english`, `catalan`, `citizenship`). Each
file has a `topics` list (`id` in kebab-case, `name` in Spanish) and a `questions` list. Copy an
existing question and change its fields, in this order:

| Field | Meaning |
|---|---|
| `id` | Unique across all files, `<subject>-<lang>-<nnn>`, e.g. `geography-es-007` or `catalan-ca-004` |
| `lang` | `es`, `ca` or `en`: `english` is `en`, `catalan` is `ca`, `language` is `es`, the others `es` or `ca` |
| `topics` | 1 to 3 different topic ids from the `topics` list of the same file |
| `curriculum` | The cicle superior area and block the fact applies, e.g. `{"area":"medi","block":"societats-i-territoris"}`. The ids are in `docs/curriculum/cicle-superior.md` |
| `difficulty` | 1 (direct recall of one cicle superior saber), 2 (applies or relates two sabers), 3 (two steps, a less obvious application, or a justification) |
| `place` | The id of a city on the route, or `general`. A city only for geography, history, sports and culture |
| `minAge` | 10 |
| `maxAge` | 12 |
| `prompt` | The question, 120 characters at most |
| `options` | Exactly 4 different answers, 40 characters each at most |
| `correct` | Position of the right answer in `options`, from 0 to 3 |
| `explanation` | Shown after a wrong answer, 160 characters at most. In an English question it glosses each key English word in Spanish in brackets, e.g. «Hot» ({caliente}) |
| `references` | At least one `https://` page where the fact can be checked |

Before writing, read [`docs/curriculum/cicle-superior.md`](docs/curriculum/cicle-superior.md). It
lists the sabers of the cicle superior and the facts that are only review or general culture
(prehistory, the astronomy of the first cycle, club sport, heraldry, artist biographies). Most
questions must apply one of those sabers. A batch may include one review or general-culture
question from that list, marked as such; the rest stay anchored. The official curriculum defines the
sabers for the whole cicle (5è-6è), not per course; the `difficulty` labels are a project convention.
The `curriculum` field is required: the build rejects a question without a valid area and block.
New questions should also keep the prompt at most 90 characters, the options around 25 and the
explanation at most 140: the build allows more, but the browser tests put the longest prompt on a
360×640 phone.

Spanish words inside a Catalan or English prompt or explanation go in braces, e.g.
`Which English word means «{hermano}»?`. The braces are not shown, and the game reads the word
as Spanish for screen readers. They do not count towards the length limits. In an English
question, everything in brackets is a Spanish gloss, so it must be inside braces. A Spanish
question and the options never use them.

Write every question in your own words. Sources such as XTEC are for checking facts, not for
copying text; put the page where the fact can be checked in `references`.

After editing, run `npm run build:questions`: it checks every file, prints each problem and
regenerates `js/questions.js`. The tests fail if the build was forgotten. Options are shuffled in
every game, so the position of the right answer does not matter.

## Question batches

A Claude routine called `question-batch` runs about every 3 days. It writes 10 new questions for the
pools with the fewest (each of the six cities, and the general maths, science, language, english,
catalan and citizenship), checks them, and opens a pull request that lists only the new questions
with their curriculum anchor (area and block), answer, explanation, reference and any doubts. It
also runs `npm run curriculum`, starts with the blocks that have 0 questions, does not add to a
block over 9 while any block is below 3, and breaks ties at random. Every question must apply a cicle superior saber from
`docs/curriculum/cicle-superior.md`, except the batch's one review/general-culture question. The
owner reads the table, plays the branch and merges. Nothing reaches the game without that merge, and the routine
does nothing while a `question-batch/` pull request is still open, so batches never pile up. The
minimums are 15 questions in every pool and 3 in every curriculum block; the routine does not stop
there, it keeps adding to the pools and blocks with the fewest. `npm run pools` shows where each pool
stands, and `npm run curriculum` shows the block counts and how many are missing to the floor of 3.

Its instructions are `.claude/skills/write-question-batch/SKILL.md`, so changing how it writes is
a pull request. To run it now, use "Run now" on the routine at claude.ai, or ask Claude Code to use
that skill. To pause it, turn the routine off there.

## License

[MIT](LICENSE)
