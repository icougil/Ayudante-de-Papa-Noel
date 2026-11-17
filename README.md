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
- The game has music and sound effects. The 🔊 button in the top-left corner switches them off,
  and the choice is remembered. The music is the chorus of Jingle Bells (James Pierpont, 1857),
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

The game logic and the question bank are covered by tests that run on Node.js (18 or later),
with no dependencies:

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
when every test passes.

## Privacy

The published game counts visits with [Umami](https://umami.is). It sets no cookies, so the game
shows no cookie banner. To tell one visit from another, Umami's servers use the visitor's IP
address and browser details to work out an anonymous visit identifier, and use the IP address to
derive an approximate location. The IP address itself is not kept in the statistics, but Umami
may record it in its operational and security logs. See
[Umami's privacy policy](https://umami.is/privacy).

Only visits on `icougil.github.io` are counted. A local run still downloads Umami's script, but
sends no visit. The browser tests never contact Umami: they replace its script with an empty one.

The game keeps one thing in the browser: whether sound is on or off (the `localStorage` key
`apn.sound`). It keeps nothing about the questions or the answers.

## Project layout

| Path | What it holds |
|---|---|
| `index.html` | The three screens: start, trip and result |
| `css/styles.css` | All the styles and animations |
| `js/data-level-1.js` | Level 1: the cities on the route and the question bank |
| `js/game-logic.js` | The rules, as pure functions that never touch the page |
| `js/sound.js` | The music and the sound effects, generated in the browser, and the sound switch |
| `js/ui.js` | Draws the scene, moves it and wires the rules to the page |
| `tests/` | Unit tests for the data, the rules, the tune and the sound choice |
| `e2e/` | Browser tests for the screens |
| `BACKLOG.md` | Work agreed but not started |

## Adding a question

Questions live in `APN.QUESTIONS` in `js/data-level-1.js`. Copy an existing one and change its
fields, in this order:

| Field | Meaning |
|---|---|
| `id` | Unique, e.g. `madrid-4` or `general-13` |
| `subject` | One of `geography`, `history`, `sports`, `culture`, `maths`, `science`, `language`, `english` |
| `place` | The id of a city on the route, or `general` |
| `prompt` | The question, 120 characters at most |
| `options` | Exactly 4 different answers, 40 characters each at most |
| `correct` | Position of the right answer in `options`, from 0 to 3 |
| `explanation` | Shown after a wrong answer, 160 characters at most |

Options are shuffled in every game, so the position of the right answer does not matter. Run the
tests afterwards: they check the shape and length limits of every question, and how many
questions each city and subject has.

## License

[MIT](LICENSE)
