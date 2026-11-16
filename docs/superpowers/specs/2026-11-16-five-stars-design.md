# Five stars per level — design

Date: 2026-11-16. Approved by the owner in conversation on the same day.

## Intent

A level is rated with up to three stars today, one per gift from the fourth on. The owner finds
three too few: five stars read better and leave room to tell a good game from a great one. The
two extra stars reward speed, which the game already measures (express deliveries) and never
rewards.

## Goals, non-goals, anti-goals

- Goal: a level is rated from 1 to 5 stars; the fourth and fifth are earned with express
  deliveries on top of a full run.
- Goal: the result screen tells the player how to earn the next star.
- Non-goal: saving stars between games (iteration 2 of the main design), sound, new questions.
- Anti-goal: a game with mistakes outranking a game with every gift delivered.
- Anti-goal: longer games. A level keeps its 6 cities.

## Rule

Passing is unchanged: 4 or more gifts delivered (`APN.MIN_TO_PASS`). A game that is not passed
has 0 stars and shows none.

| Stars | Gifts delivered | Express deliveries |
|---|---|---|
| 1 | 4 | any |
| 2 | 5 | any |
| 3 | 6 | 0 to 2 |
| 4 | 6 | 3 to 5 |
| 5 | 6 | 6 |

Constants in `js/game-logic.js`: `APN.MAX_STARS = 5`, `APN.EXPRESS_FOR_FOURTH_STAR = 3`,
`APN.EXPRESS_FOR_FIFTH_STAR = 6`. The thresholds are expected to be tuned after play: the fifth
star is hard on purpose, because turbo shortens the last flights of a full run from 20 to 14
seconds.

`APN.result(state)` keeps its shape and adds `maxStars` (always `APN.MAX_STARS`), so the screen
does not hard-code the number.

## Result screen

- Stars: `'⭐'` repeated `stars` times followed by `'☆'` up to `maxStars`, e.g. `⭐⭐⭐☆☆`.
  `aria-label`: `"<stars> de 5 estrellas"`.
- A new line under the stars, shown only when the level is passed, with the way to the next
  star:

| Stars | Text |
|---|---|
| 1 or 2 | `Siguiente estrella: entrega más regalos.` |
| 3 | `Siguiente estrella: 6 regalos y 3 entregas exprés ⚡.` |
| 4 | `Última estrella: ¡las 6 entregas exprés ⚡!` |
| 5 | `¡Puntuación perfecta!` |

The numbers in these texts come from the constants and the level size, not from literals.

## Approaches

1. **Express deliveries on top of a full run (chosen).** Stars 1 to 3 as today; 4 and 5 need all
   6 gifts plus 3 and 6 express deliveries. Easy to explain ("all the gifts, and fast"), rewards
   something already measured, keeps games the same length.
2. **Express adds stars to any passed game.** A 4-gift game with enough express deliveries could
   reach 3 stars. Rejected: a game with two mistakes could outrank a perfect one.
3. **More cities per level, one star per gift.** Rejected: every game gets longer and the bank
   of 30 questions is already short.

## What changes

- `js/game-logic.js`: the constants and the star calculation in `APN.result`.
- `js/ui.js`, `index.html`, `css/styles.css`: five positions and the next-star line.
- `tests/game-logic.test.js`, `e2e/game.spec.js`: the star table above, including express counts.
- `README.md` and `docs/superpowers/specs/2026-11-15-ayudante-de-papa-noel-design.md`: the rule.

## Left to the builder

The id and CSS class of the new line, its styling within the existing result screen, and how the
tests drive express and non-express answers.
