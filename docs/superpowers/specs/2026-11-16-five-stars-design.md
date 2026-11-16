# Five stars per level — design

Date: 2026-11-16. Approved by the owner in conversation on the same day. Revised the same day,
after the owner played the first version on a phone: see "Revision after play".

## Intent

A level was rated with up to three stars, one per gift from the fourth on. The owner finds three
too few: five stars read better and leave room to tell a good game from a great one. The last
star rewards speed, which the game already measures (express deliveries) and never rewarded.

## Goals, non-goals, anti-goals

- Goal: a level is rated from 1 to 5 stars; the first four are earned with gifts, the fifth with
  express deliveries on top of a full run.
- Goal: half right is a pass, as at school.
- Goal: the result screen tells the player how to earn the next star, or how many gifts were
  missing to pass.
- Non-goal: saving stars between games (iteration 2 of the main design), sound, new questions.
- Anti-goal: a game with mistakes outranking a game with every gift delivered.
- Anti-goal: longer games. A level keeps its 6 cities.

## Rule

A level is passed with 3 or more gifts delivered (`APN.MIN_TO_PASS = 3`). Each gift from the
third on earns a star; the fifth star needs every gift delivered and every delivery express.

| Gifts delivered | Express deliveries | Result |
|---|---|---|
| 0 to 2 | any | not passed, 0 stars |
| 3 | any | 1 star |
| 4 | any | 2 stars |
| 5 | any | 3 stars |
| 6 | 0 to 5 | 4 stars |
| 6 | 6 | 5 stars |

Constants in `js/game-logic.js`: `APN.MIN_TO_PASS = 3`, `APN.MAX_STARS = 5`,
`APN.EXPRESS_FOR_FIFTH_STAR = 6`. `APN.EXPRESS_FOR_FOURTH_STAR` no longer exists. The fifth star
is hard on purpose, because turbo shortens the last flights of a full run from 20 to 14 seconds.

`APN.result(state)` keeps its fields (`delivered`, `express`, `total`, `passed`, `stars`,
`maxStars`) and adds `missing`: the gifts short of the pass mark (`MIN_TO_PASS - delivered`), 0
when the level is passed.

## Result screen

- Stars, always shown: `'⭐'` repeated `stars` times followed by `'☆'` up to `maxStars`, e.g.
  `⭐⭐⭐☆☆`; a game that is not passed shows `☆☆☆☆☆`. `aria-label`: `"<stars> de 5 estrellas"`.
- A line under the stars, always shown:

| Result | Text |
|---|---|
| not passed, 1 gift missing | `¡Casi! Te ha faltado 1 regalo.` |
| not passed, N gifts missing (2 or 3) | `Te han faltado N regalos.` |
| 1, 2 or 3 stars | `Siguiente estrella: entrega un regalo más.` |
| 4 stars | `Última estrella: ¡las 6 entregas exprés ⚡!` |
| 5 stars | `¡Puntuación perfecta!` |

The numbers in these texts come from the result and the constants, not from literals.

The title of a game that is not passed stays `A Papá Noel le han faltado regalos. ¡Inténtalo
otra vez!`.

## Approaches

1. **One star per gift from the pass mark, the fifth for an all-express full run (chosen).**
   Easy to explain ("one more gift, one more star; all of them fast for the last"), and every
   passed game is one gift away from the next star until the fourth.
2. **Stars 4 and 5 for express deliveries on a full run (first version).** Passing at 4 gifts;
   4, 5, 6 gifts earned 1, 2, 3 stars; 3 and 6 express deliveries earned the fourth and fifth.
   Replaced after play: see below.
3. **Express adds stars to any passed game.** Rejected: a game with mistakes could outrank a
   perfect one.
4. **More cities per level, one star per gift.** Rejected: every game gets longer and the bank
   of 30 questions is already short.

## Revision after play

The first version (approach 2) was built and played by the owner on a phone. Two things changed:

- The pass mark goes from 4 to 3 gifts: half right is a pass, as at school.
- A game that is not passed no longer hides the stars: it shows five empty ones and how many
  gifts were missing, so the player sees how close the pass was.

With the pass mark at 3, gifts alone fill four stars, so only the fifth depends on express
deliveries.

## What changes

- `js/game-logic.js`: the constants, the star calculation and `missing` in `APN.result`.
- `js/ui.js`: the stars and the line under them are always shown; the texts above.
- `tests/game-logic.test.js`, `e2e/game.spec.js`: the tables above.
- `README.md` and `docs/superpowers/specs/2026-11-15-ayudante-de-papa-noel-design.md`: the rule.

## Left to the builder

How the tests drive express and non-express answers.
