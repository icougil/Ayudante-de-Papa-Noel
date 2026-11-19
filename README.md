# Ayudante de Papá Noel

*Santa's Helper*: a small browser quiz game for children aged 10 to 12. Santa flies across Spain
and the player helps him deliver a gift in each city by answering a question.

**Play it:** <https://icougil.github.io/Ayudante-de-Papa-Noel/>

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
the console. Opened from disk, no version is shown.

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

The game keeps one thing in the browser: whether sound is on or off (the `localStorage` key
`apn.sound`). It keeps nothing about the questions or the answers.

## Project layout

| Path | What it holds |
|---|---|
| `index.html` | The three screens: start, trip and result |
| `css/styles.css` | All the styles and animations |
| `js/data-level-1.js` | Level 1: the subjects and the cities on the route |
| `questions/` | The question bank, one JSON file per subject: its topics and its questions |
| `js/questions.js` | The questions and topics the game loads. Generated, do not edit |
| `scripts/build-questions.js` | Checks `questions/*.json` and generates `js/questions.js` |
| `js/game-logic.js` | The rules, as pure functions that never touch the page |
| `js/sound.js` | The music and the sound effects, generated in the browser, and the sound switch |
| `js/ui.js` | Draws the scene, moves it and wires the rules to the page |
| `tests/` | Unit tests for the data, the rules, the tune, the sound choice and the version stamp |
| `scripts/` | Release tooling run by CI (the version stamp) |
| `e2e/` | Browser tests for the screens |
| `BACKLOG.md` | Work agreed but not started |

## Adding a question

Questions live in the file of their subject, `questions/<subject>.json` (`geography`, `history`,
`sports`, `culture`, `maths`, `science`, `language`, `english`, `catalan`). Each file has a `topics`
list (`id` in kebab-case, `name` in Spanish) and a `questions` list. Copy an existing question and
change its fields, in this order:

| Field | Meaning |
|---|---|
| `id` | Unique across all files, `<subject>-<lang>-<nnn>`, e.g. `geography-es-007` or `catalan-ca-004` |
| `lang` | `es`, `ca` or `en`: `english` is `en`, `catalan` is `ca`, `language` is `es`, the others `es` or `ca` |
| `topics` | 1 to 3 different topic ids from the `topics` list of the same file |
| `difficulty` | 1 (taught in 5è), 2 (a 6è topic) or 3 (a 6è topic with a harder twist: two steps or a less obvious fact) |
| `place` | The id of a city on the route, or `general`. A city only for geography, history, sports and culture |
| `minAge` | 10 |
| `maxAge` | 12 |
| `prompt` | The question, 120 characters at most |
| `options` | Exactly 4 different answers, 40 characters each at most |
| `correct` | Position of the right answer in `options`, from 0 to 3 |
| `explanation` | Shown after a wrong answer, 160 characters at most. In an English question it glosses each key English word in Spanish in brackets, e.g. «Hot» ({caliente}) |
| `references` | At least one `https://` page where the fact can be checked |

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

## License

[MIT](LICENSE)
