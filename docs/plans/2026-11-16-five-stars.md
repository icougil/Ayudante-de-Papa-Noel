# Five Stars Per Level Implementation Plan

> **Superseded in part:** the rule built by this plan (pass at 4 gifts, the fourth and fifth
> stars for express deliveries) was replaced by
> `docs/plans/2026-11-16-five-stars-pass-at-three.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A passed level is rated from 1 to 5 stars, the fourth and fifth earned with express
deliveries on a full run, and the result screen says how to earn the next star.

**Architecture:** The rule lives in the pure logic (`APN.result` in `js/game-logic.js`), driven by
named constants. The screen (`js/ui.js`) only renders `stars` and `maxStars` and picks the
Spanish next-star text by star count; it never recomputes the rule.

**Tech Stack:** Plain JavaScript with no build step, `node --test` for the logic, Playwright
(`desktop` on Chromium, `phone` on WebKit) for the screens.

**Spec:** `docs/specs/2026-11-16-five-stars-design.md`

## Global Constraints

- Code, comments, test names, commit messages and branch names in English; everything the
  player reads in Spanish, with the exact texts given below.
- No new dependencies and no build step; the game still runs from `file://`.
- Passing stays at 4 gifts (`APN.MIN_TO_PASS`); a level keeps 6 cities.
- `APN.result(state)` keeps every field it has today.
- The owner's name is never written in repository files.
- Work on branch `five-stars`. Every commit is proposed to the owner and waits for approval.
- Commands: `npm test` (logic), `npm run test:e2e` (screens).

## Review Focus

1. Five stars at `3rem` on a 360 px wide screen wrap to two lines → they must stay on one line
   (Task 2, test "the five stars fit on one line").
2. A failed game played right after a passed one still shows the previous next-star text → the
   line must be hidden when the level is not passed (Task 2, same test as the failed game).
3. Boundaries of the express thresholds: 6 gifts with 2 or 5 express deliveries → 3 and 4 stars
   (Task 1, table rows).
4. Many express deliveries without a full run (5 gifts, 5 express) → still 2 stars (Task 1,
   table row).
5. Screen readers hear the old scale → `aria-label` must read `N de 5 estrellas` (Task 2).

---

### Task 1: The star rule

**Files:**
- Modify: `js/game-logic.js` (constants at the top, `APN.result`)
- Test: `tests/game-logic.test.js` (helper `play`, tests at lines 154 and 180)

**Interfaces:**
- Produces: `APN.MAX_STARS = 5`, `APN.EXPRESS_FOR_FOURTH_STAR = 3`,
  `APN.EXPRESS_FOR_FIFTH_STAR = 6`; `APN.result(state)` returns
  `{ delivered, express, total, passed, stars, maxStars }` with `maxStars === APN.MAX_STARS`.

Rule: not passed → 0. Passed with fewer gifts than `total` → `delivered - MIN_TO_PASS + 1`.
All gifts delivered → 3, or 4 when `express >= EXPRESS_FOR_FOURTH_STAR`, or 5 when
`express >= EXPRESS_FOR_FIFTH_STAR`.

- [ ] **Step 1: Write the failing tests**
  - Change the helper to `play(rightAnswers, expressAnswers = rightAnswers)`: the first
    `rightAnswers` answers are right and the rest wrong, as today; of the right ones, the first
    `expressAnswers` are given before arrival and the others after.
  - Replace the test at line 154 with `result: stars depend on the gifts delivered and the
    express deliveries`, asserting `delivered`, `express`, `total === 6`, `passed`, `stars` and
    `maxStars === 5` for each row `[gifts, express, passed, stars]`:
    `[0,0,false,0] [3,3,false,0] [4,0,true,1] [4,4,true,1] [5,0,true,2] [5,5,true,2]
    [6,0,true,3] [6,2,true,3] [6,3,true,4] [6,5,true,4] [6,6,true,5]`.
  - In `the game constants match the design`, add the three constants with the values above.
- [ ] **Step 2: Run `npm test`.** Expected: the two tests fail (`maxStars` is `undefined`, the
  constants are `undefined`, row `[6,3]` gets 3 instead of 4); every other test passes.
- [ ] **Step 3: Implement** the constants and the rule in `js/game-logic.js`.
- [ ] **Step 4: Run `npm test`.** Expected: all pass.
- [ ] **Step 5: Commit** (`Rate a level with up to five stars, the last two for express deliveries`).

**Acceptance:** the table above holds; no other field of `APN.result` changed.

---

### Task 2: The result screen and the docs

**Files:**
- Modify: `index.html` (result section, after `#result-stars`), `js/ui.js` (`showResult`,
  lines 148-163), `css/styles.css` (`.result-stars`, line 114)
- Modify: `README.md` (line 21),
  `docs/specs/2026-11-15-ayudante-de-papa-noel-design.md` (line 75)
- Test: `e2e/game.spec.js`

**Interfaces:**
- Consumes: `APN.result(state)` → `stars`, `maxStars`, `total`, `passed`;
  `APN.EXPRESS_FOR_FOURTH_STAR`, `APN.EXPRESS_FOR_FIFTH_STAR`.
- Produces: `<p id="result-next-star" class="cover-text">` right after `#result-stars`.

Behaviour:
- `#result-stars`: `'⭐'` × `stars` then `'☆'` up to `maxStars`; `aria-label`
  `"<stars> de <maxStars> estrellas"`; hidden when not passed (as today); never wraps to a
  second line at 360 px wide.
- `#result-next-star`: hidden when not passed; otherwise, with the numbers taken from
  `total` and the constants, never literals:

| Stars | Text |
|---|---|
| 1 or 2 | `Siguiente estrella: entrega más regalos.` |
| 3 | `Siguiente estrella: 6 regalos y 3 entregas exprés ⚡.` |
| 4 | `Última estrella: ¡las 6 entregas exprés ⚡!` |
| 5 | `¡Puntuación perfecta!` |

- [ ] **Step 1: Write the failing tests** in `e2e/game.spec.js`
  - Rename the six-right-answers test to `a game with six express deliveries ends with five
    stars and no script errors` (the helper answers before arrival, so all six are express):
    `#result-stars` has text `⭐⭐⭐⭐⭐` and `aria-label` `5 de 5 estrellas`;
    `#result-next-star` has text `¡Puntuación perfecta!`; the existing assertions stay.
  - New `a game with four gifts ends with one star and the way to the next one`: two wrong
    answers, then four right. `#result-stars` is `⭐☆☆☆☆` with `aria-label`
    `1 de 5 estrellas`; `#result-next-star` is `Siguiente estrella: entrega más regalos.`
  - New `a failed game after a passed one shows no stars and no next-star text`: play six right,
    click `#button-again`, play six wrong. `#result-stars` and `#result-next-star` are hidden.
  - New, inside `on a small phone (360x640)`: `the five stars fit on one line`: six right
    answers; the height of `#result-stars` is below twice its computed `font-size`.
- [ ] **Step 2: Run `npm run test:e2e`.** Expected: the four tests fail on both projects (text
  is `⭐⭐⭐`, `#result-next-star` does not exist); the others pass.
- [ ] **Step 3: Implement** the markup, `showResult` and the style. If five stars do not fit at
  360 px, reduce `.result-stars` `font-size` with `clamp()` rather than letting it wrap.
- [ ] **Step 4: Run `npm test` and `npm run test:e2e`.** Expected: all pass on `desktop` and
  `phone`.
- [ ] **Step 5: Update the docs.** README line 21 becomes: `A level has 6 cities. Delivering 4
  gifts passes it; 4, 5 or 6 gifts earn 1, 2 or 3 stars. With all 6 delivered, 3 express
  deliveries earn the fourth star and 6 the fifth.` In the main design spec, replace the star
  sentence at line 75 with the same rule and a pointer to the five-stars spec.
- [ ] **Step 6: Commit** (`Show five stars and the way to the next one on the result screen`).

**Acceptance:** the texts above appear verbatim; the result screen fits at 360x640 without
scrolling the stars onto two lines; the README and both specs state the same rule.
