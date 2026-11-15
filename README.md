# Ayudante de Papá Noel

*Santa's Helper*: a small browser quiz game for children aged 10 to 12. Santa flies across Spain
and the player helps him deliver a gift in each city by answering a question.

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
- A level has 6 cities. Delivering 4 gifts passes it; 4, 5 or 6 gifts earn 1, 2 or 3 stars.

Level 1 is Spain: Barcelona, Zaragoza, Madrid, Sevilla, Santiago de Compostela and Bilbao.

## Run it

There is nothing to build or install: open `index.html` in a browser.

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

## Project layout

| Path | What it holds |
|---|---|
| `index.html` | The three screens: start, trip and result |
| `css/styles.css` | All the styles and animations |
| `js/data-level-1.js` | Level 1: the cities on the route and the question bank |
| `js/game-logic.js` | The rules, as pure functions that never touch the page |
| `js/ui.js` | Draws the scene, moves it and wires the rules to the page |
| `tests/` | Tests for the data and the rules |

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
