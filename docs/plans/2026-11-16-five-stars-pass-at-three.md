# Five Stars, Pass At Three Gifts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A level is passed with 3 gifts, each gift from the third on earns a star, the fifth
star needs all 6 deliveries express, and a game that is not passed shows five empty stars and
how many gifts were missing.

**Architecture:** Unchanged from the first five-stars plan: the rule lives in the pure logic
(`APN.result` in `js/game-logic.js`), driven by named constants; the screen (`js/ui.js`) only
renders the result and picks a Spanish text, it never recomputes the rule. `APN.result` gains
`missing` so the screen does not subtract either.

**Tech Stack:** Plain JavaScript with no build step, `node --test` for the logic, Playwright
(`desktop` on Chromium, `phone` on WebKit) for the screens.

**Spec:** `docs/specs/2026-11-16-five-stars-design.md` (sections "Rule", "Result
screen" and "Revision after play"). It replaces the rule built by
`docs/plans/2026-11-16-five-stars.md`.

## Global Constraints

- Code, comments, test names, commit messages and branch names in English; everything the
  player reads in Spanish, with the exact texts given below.
- No new dependencies and no build step; the game still runs from `file://`.
- A level keeps 6 cities. `APN.MAX_STARS` stays 5 and `APN.EXPRESS_FOR_FIFTH_STAR` stays 6.
- `APN.result(state)` keeps every field it has today and adds `missing`.
- The numbers in the player's texts come from the result and the constants, never from literals.
- The owner's name is never written in repository files.
- Work on branch `five-stars`, as a follow-up of PR #3. Every commit is proposed to the owner and
  waits for approval.
- Commands: `npm test` (logic), `npm run test:e2e` (screens).

## Review Focus

1. A game that is not passed, played right after a passed one, keeps the previous stars or line
   → it must show `☆☆☆☆☆` and the missing-gifts line (Task 2, test "a failed game after a passed
   one...").
2. Singular and plural of the missing line: 1 gift missing reads `¡Casi! Te ha faltado 1
   regalo.`, 3 missing reads `Te han faltado 3 regalos.` (Task 2, two tests).
3. A full run with 5 express deliveries, one short of the fifth star → 4 stars and the
   last-star line (Task 1 table row; Task 2 test with one late answer).
4. Many express deliveries without a full run (5 gifts, 5 express) → still 3 stars (Task 1,
   table row).
5. Screen readers on a game that is not passed → `aria-label` reads `0 de 5 estrellas`, and the
   stars element is no longer hidden (Task 2).

## File Map

| File | Change |
|---|---|
| `js/game-logic.js` | Constants, star calculation, `missing` in `APN.result` |
| `tests/game-logic.test.js` | Star table with `missing`, constants |
| `js/ui.js` | Stars and line always shown; the line's texts |
| `e2e/game.spec.js` | Result-screen tests for the new ladder |
| `README.md` | The rule under "How to play" |
| `docs/specs/2026-11-15-ayudante-de-papa-noel-design.md` | The rule under "End of level" and the decisions list |

---

### Task 1: The rule in the logic

**Files:**
- Modify: `js/game-logic.js` (constants at the top, `starsFor`, `APN.result`)
- Test: `tests/game-logic.test.js`

**Interfaces:**
- Produces: `APN.MIN_TO_PASS === 3`; `APN.EXPRESS_FOR_FOURTH_STAR` no longer defined;
  `APN.result(state)` returns `{ delivered, express, total, passed, stars, maxStars, missing }`,
  all numbers except `passed` (boolean). `missing` is `MIN_TO_PASS - delivered` when the level is
  not passed and `0` when it is.

**Behaviour:**
- `passed` is `delivered >= APN.MIN_TO_PASS`.
- Not passed: 0 stars.
- Passed: `delivered - APN.MIN_TO_PASS + 1` stars (3, 4, 5, 6 gifts → 1, 2, 3, 4).
- `APN.MAX_STARS` only when every question was delivered (`delivered === questions.length`) and
  `express >= APN.EXPRESS_FOR_FIFTH_STAR`.
- The comment above `starsFor` describes the new rule.

- [ ] **Step 1: Change the tests first**

  In `tests/game-logic.test.js`:

  - `result: stars depend on the gifts delivered and the express deliveries` — the table gains a
    fifth column and becomes `[gifts, express, passed, stars, missing]`, with `r.missing`
    asserted for every row:

    | gifts | express | passed | stars | missing |
    |---|---|---|---|---|
    | 0 | 0 | false | 0 | 3 |
    | 1 | 1 | false | 0 | 2 |
    | 2 | 2 | false | 0 | 1 |
    | 3 | 0 | true | 1 | 0 |
    | 3 | 3 | true | 1 | 0 |
    | 4 | 4 | true | 2 | 0 |
    | 5 | 5 | true | 3 | 0 |
    | 6 | 0 | true | 4 | 0 |
    | 6 | 5 | true | 4 | 0 |
    | 6 | 6 | true | 5 | 0 |

  - `the game constants match the design` — `APN.MIN_TO_PASS` is `3`; the
    `EXPRESS_FOR_FOURTH_STAR` assertion becomes
    `assert.equal(APN.EXPRESS_FOR_FOURTH_STAR, undefined)`.

- [ ] **Step 2: Run `npm test`** — both tests fail (first failing label `0 gifts, 0 express` on
  `missing`, and `MIN_TO_PASS` 4 instead of 3); the other 21 pass.
- [ ] **Step 3: Implement the behaviour above in `js/game-logic.js`.**
- [ ] **Step 4: Run `npm test`** — 23 pass, 0 fail.
- [ ] **Step 5: Commit** (proposal to the owner first): `js/game-logic.js`,
  `tests/game-logic.test.js`. The browser tests are red until Task 2; that is expected.

**Acceptance:** the table above holds; `grep -rn EXPRESS_FOR_FOURTH_STAR js/game-logic.js`
finds nothing.

---

### Task 2: The result screen, its tests and the documents

**Files:**
- Modify: `js/ui.js` (`nextStarText` and `showResult`, around lines 148-177)
- Modify: `README.md` (lines 21-22)
- Modify: `docs/specs/2026-11-15-ayudante-de-papa-noel-design.md` ("End of level"
  bullet around lines 75-79, and the decisions list around line 140)
- Test: `e2e/game.spec.js`

**Interfaces:**
- Consumes: `APN.result(state)` with `missing` and `APN.EXPRESS_FOR_FIFTH_STAR` from Task 1.
  `APN.EXPRESS_FOR_FOURTH_STAR` must not be referenced anywhere.

**Behaviour (`js/ui.js`):**
- `#result-stars` and `#result-next-star` are always shown: `showResult` no longer sets `hidden`
  on either. The stars text and `aria-label` are computed as today, so a game that is not passed
  shows `☆☆☆☆☆` with `aria-label="0 de 5 estrellas"`.
- The line under the stars, picked from the result `r` (rename `nextStarText` to
  `resultLineText`, since it no longer only talks about the next star):

  | Condition | Text |
  |---|---|
  | `!r.passed` and `r.missing === 1` | `¡Casi! Te ha faltado 1 regalo.` |
  | `!r.passed` otherwise | `Te han faltado N regalos.` with N = `r.missing` |
  | `r.stars === r.maxStars` | `¡Puntuación perfecta!` |
  | `r.stars === r.maxStars - 1` | `Última estrella: ¡las 6 entregas exprés ⚡!` with 6 = `APN.EXPRESS_FOR_FIFTH_STAR` |
  | any other passed result | `Siguiente estrella: entrega un regalo más.` |

  The `1` of the singular text also comes from `r.missing`.
- The title, the gifts line, the express line and the button text do not change.

**Documents:**
- `README.md`, the last bullet of "How to play" becomes: "A level has 6 cities. Delivering 3
  gifts passes it; 3, 4, 5 or 6 gifts earn 1, 2, 3 or 4 stars. The fifth star needs all 6 gifts
  delivered as express deliveries."
- Main design spec, "End of level": "passed with **3 or more** gifts delivered. Stars: 3, 4, 5
  or 6 gifts earn 1, 2, 3 or 4 stars; the fifth needs all 6 deliveries express (see
  `2026-11-16-five-stars-design.md`). With fewer than 3: ..." — the rest of the bullet keeps its
  wording. In "Decisions made by Claude", "the threshold of 4 right answers" is removed from the
  list and one sentence is added after it: "The pass mark of 3 gifts and the five stars were
  decided by the owner (see `2026-11-16-five-stars-design.md`)."

- [ ] **Step 1: Change the browser tests first** (`e2e/game.spec.js`). Final set of
  result-screen tests; `playGame`, `playWithClock` and `SIX_RIGHT` are reused as they are:

  | Test name | Game played | Asserts |
  |---|---|---|
  | `a game with six express deliveries ends with five stars and no script errors` | unchanged | unchanged |
  | `a game with three gifts ends with one star and the way to the next one` (replaces the four-gifts test) | 3 wrong, then 3 right | stars `⭐☆☆☆☆`, `aria-label` `1 de 5 estrellas`, line `Siguiente estrella: entrega un regalo más.`, title `¡Nivel superado!` |
  | `a game with two gifts shows five empty stars and that one gift was missing` (new) | 4 wrong, then 2 right | title `A Papá Noel le han faltado regalos. ¡Inténtalo otra vez!`, stars visible with text `☆☆☆☆☆`, `aria-label` `0 de 5 estrellas`, line `¡Casi! Te ha faltado 1 regalo.`, button `#button-again` reads `Reintentar` |
  | `a failed game after a passed one shows five empty stars and the gifts missing` (replaces the hidden-stars test) | six right, play again, six wrong | stars visible with text `☆☆☆☆☆`, line visible with text `Te han faltado 3 regalos.` |
  | `a full run with no express deliveries ends with four stars and the way to the fifth` (replaces the three-stars test) | six right, all late | stars `⭐⭐⭐⭐☆`, `aria-label` `4 de 5 estrellas`, line `Última estrella: ¡las 6 entregas exprés ⚡!`, express line `Entregas exprés: 0 ⚡` |
  | `a full run with five express deliveries still ends with four stars` (replaces the three-express test) | six right, only the last one late | stars `⭐⭐⭐⭐☆`, line `Última estrella: ¡las 6 entregas exprés ⚡!`, express line `Entregas exprés: 5 ⚡` |

  The layout tests, `the five stars fit on one line` included, do not change.

- [ ] **Step 2: Run `npm run test:e2e`** (with Task 1 in) — the layout tests and the
  six-express test pass, and so do both four-star tests (the old screen already has the
  last-star line for 4 stars). Three fail: three gifts on the line text (`Siguiente estrella:
  entrega más regalos.` is still shown), the two-gifts and the failed-after-passed tests because
  `#result-stars` is hidden.
- [ ] **Step 3: Implement the behaviour above in `js/ui.js`.**
- [ ] **Step 4: Run `npm test` and `npm run test:e2e`** — 23 unit tests pass; every browser
  test passes on both projects (13 expected: 12 before, plus the new two-gifts test).
- [ ] **Step 5: Update `README.md` and the main design spec** with the wording above.
- [ ] **Step 6: Commit** (proposal to the owner first): `js/ui.js`, `e2e/game.spec.js`,
  `README.md`, both design specs and both plan files.

**Acceptance:** `grep -rn "EXPRESS_FOR_FOURTH_STAR\|entrega más regalos\|3 entregas exprés" js
e2e tests README.md` finds nothing; no result test asserts `toBeHidden()` on the stars or the
line.

---

## After the tasks

- Show the result screen in the real game with Playwright at 360x640: one screenshot of a game
  that is not passed (`☆☆☆☆☆` and the missing line) and one of a four-star result.
- Push and update PR #3: title "Rate a level with up to five stars, passing with three gifts",
  and the rule table of the spec in the body.
