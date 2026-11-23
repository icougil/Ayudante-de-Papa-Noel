# Do not repeat seen questions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A game prefers questions the player has not seen on this browser, and degrades in a fixed order when a pool runs out.

**Architecture:** `APN.pickQuestions` gains an optional fifth parameter `seenIds`; two small pure helpers in `js/game-logic.js` read and record the seen list through an injected storage object (same pattern as `APN.loadSoundChoice` / `APN.saveSoundChoice` in `js/sound.js`); `js/ui.js` passes the list in and records each question when it is shown.

**Tech Stack:** Plain browser JavaScript (global `APN`), `node --test` unit tests, Playwright e2e.

**Spec:** `docs/specs/2026-11-23-seen-questions-design.md` (also `docs/specs/2026-11-18-question-bank-design.md`, *The picker*).

## Global Constraints

- Code, test names, comments, commit messages and branch names in English; nothing the player reads changes.
- No personal name in any file (say "the owner").
- localStorage key: `apn.seenQuestions`, a JSON array of question ids, oldest first.
- Every storage read and write is in `try/catch`; blocked or corrupt storage means an empty list and no error on screen.
- `pickQuestions(level, bank, age, rng)` called without `seenIds` behaves exactly as today.
- Rule order inside the picker: (1) at most two `ca`, (2) not seen, (3) subject not yet used, (4) no shared topic; relax from the last. Cap on `ca` wins over "not seen".
- `Not enough questions for this level and age` is still thrown only for an empty pool.
- No new script file (so `index.html` and `tests/stamp-release.test.js` stay unchanged).
- Work in a worktree under `.claude/worktrees/seen-questions/`; commits only after the owner approves a proposal (per-unit commits inside a delegated run excepted).

## Review Focus

- Stored value is not JSON, or JSON but not an array, or an array holding non-strings: read as an empty list (Task 2).
- `localStorage` throws on access, read or write: the game still starts and plays (Tasks 2 and 3).
- The whole bank is already seen: a game still starts, with 6 questions (Task 1).
- The same question recorded twice (reload on the same question): no duplicate in the list (Task 2).
- Only unseen candidates are `ca` and two `ca` are already picked: the cap holds, a seen question is repeated (Task 1).

---

### Task 1: Picker uses `seenIds`

**Files:**
- Modify: `js/game-logic.js` (`APN.pickQuestions`, around lines 44-83)
- Test: `tests/game-logic.test.js`

**Interfaces:**
- Produces: `APN.pickQuestions(level, bank, age, rng, seenIds = [])` where `seenIds` is `string[]`, oldest first.

- [ ] **Step 1: Write the failing tests** in `tests/game-logic.test.js`. All use `rngOf(0.1)` (place turn on even stops: stop 0 is a place turn, stop 1 general) and `age` 11. Real bank unless said.
  - `pickQuestions without seenIds behaves as with an empty list`: same ids for `rngOf(0.1)` with no fifth argument and with `[]`. Passes from the start; guards the default.
  - `pickQuestions prefers an unseen question of the city`: `seenIds` = the ids of the first four questions of `place === stopIds[0]`; `result[0]` is the fifth. Fails (random pick), then passes.
  - `pickQuestions takes an unseen general question at a place stop when the city has none unseen`: `seenIds` = all ids of `place === stopIds[0]`; `result[0].place === 'general'` and its id is not in `seenIds`. Fails, then passes.
  - `pickQuestions repeats the least recently seen city question when city and general are all seen`: `seenIds` = all general ids, then the city's ids in the order `[c3, c1, c4, c0, c2]` (c0..c4 are the five questions of `stopIds[0]` in bank order); `result[0].id === c3`. Fails, then passes.
  - `pickQuestions never uses another city's question`: `seenIds` = every id in the bank; for every `i`, `result[i].place` is `stopIds[i]` on place turns and `'general'` on general turns (`i` odd). Passes after.
  - `pickQuestions keeps at most two Catalan questions even when the only unseen candidate is Catalan`: synthetic bank (fields `id, lang, subject, topics, place, minAge: 10, maxAge: 12` plus prompt/options/correct/explanation copied from any real question): for `stopIds[0]` and `stopIds[2]` one `ca` question each (only that one in their pool); for `stopIds[4]` two questions, `A` (`ca`, unseen) and `B` (`es`, in `seenIds`); for `stopIds[1]`, `[3]`, `[5]` and the general pool: three `es` questions in `seenIds` (general pool), and one city question for each of the remaining stops is not needed (those stops are general turns). Assert `result[4].id === 'B'`. Fails (A is unseen, so it is picked), then passes.
  - `pickQuestions picks the least recently seen general question when all are seen`: `seenIds` = every id of the bank in reverse bank order; `result[1]` is the general question with the smallest index in `seenIds` among those that share no topic with `result[0]`. Fails, then passes.
  - `pickQuestions still returns six questions when every question was seen`: `seenIds` = whole bank; length 6, no throw. Passes after (guards the "never a hard filter" rule).
- [ ] **Step 2: Run** `node --test tests/game-logic.test.js`. Expected: the five tests marked "Fails, then passes" or "Fails (...)" fail; the other three pass.
- [ ] **Step 3: Implement** the `seenIds` parameter in `APN.pickQuestions`, following *Design → Picker* of the spec: (1) choose the pool (place turn: city pool, unless no city question is both unseen and rule-1-compatible, then the not-yet-picked general questions if any is unseen and rule-1-compatible, else the city pool; general turn: the general pool); (2) `narrow` gets "not in `seenIds`" as a new rule between the Catalan cap and the subject rule; (3) when every remaining candidate is seen, pick the one earliest in `seenIds` instead of a random one. The general pool shrinks as today when a general question is used, also at a place stop answered from it. Use a `Set` for lookups and `indexOf` only for the tie-break.
- [ ] **Step 4: Run** `npm test`. Expected: all unit tests pass (105 before plus the new ones).

### Task 2: Seen list in storage

**Files:**
- Modify: `js/game-logic.js` (add after `pickQuestions`)
- Create: `tests/seen-store.test.js` (requires `../js/data-level-1.js`, `../js/questions.js`, `../js/game-logic.js` like `tests/game-logic.test.js`)

**Interfaces:**
- Produces: `APN.SEEN_KEY = 'apn.seenQuestions'`; `APN.loadSeen(storage, bank) -> string[]` (oldest first, ids not in `bank` dropped, `[]` on any problem); `APN.recordSeen(storage, id) -> void` (moves `id` to the end, no duplicates, never throws).
- `storage` is any object with `getItem(key)` / `setItem(key, value)`; may be `null`.

- [ ] **Step 1: Write the failing tests** in `tests/seen-store.test.js` with a fake storage object (`{ data: {}, getItem, setItem }`):
  - `loadSeen reads an empty list when nothing is stored`, `... when the stored value is not JSON`, `... when it is JSON but not an array`, `... when storage is null`: all `[]`.
  - `loadSeen keeps only strings and drops ids that are not in the bank`: stored `["real-id", 3, "gone-id"]` with `real-id` in the bank gives `["real-id"]`.
  - `recordSeen moves a recorded id to the end` (stored `["a","b"]`, record `"a"` gives `["b","a"]`) and `recordSeen does not duplicate an id`.
  - `recordSeen and loadSeen do not throw when storage throws` (getItem and setItem throw): load returns `[]`, record returns normally.
- [ ] **Step 2: Run** `node --test tests/seen-store.test.js`. Expected: FAIL, `APN.loadSeen is not a function`.
- [ ] **Step 3: Implement** `APN.SEEN_KEY`, `APN.loadSeen`, `APN.recordSeen` in `js/game-logic.js`. `recordSeen` reads the raw stored list without pruning (a failed or corrupt read counts as `[]`), removes `id`, appends it, writes JSON.
- [ ] **Step 4: Run** `npm test`. Expected: all pass.

### Task 3: Wire into the game, e2e, docs

**Files:**
- Modify: `js/ui.js` (`startGame`, `startLeg`), `README.md` (line "The game keeps one thing in the browser…"), `BACKLOG.md` (remove the "Do not repeat questions" item), `docs/specs/2026-11-18-question-bank-design.md` (part 3 line)
- Create: `e2e/seen-questions.spec.js`

**Interfaces:**
- Consumes: `APN.pickQuestions(..., seenIds)`, `APN.loadSeen`, `APN.recordSeen` (Tasks 1-2).

- [ ] **Step 1: Write the failing e2e tests** in `e2e/seen-questions.spec.js` using `openGame` / `startGame` from `e2e/helpers.js`; each test runs on desktop and phone. Both stub `Math.random` with `page.addInitScript(() => { Math.random = () => 0.5; })` before opening.
  - `a second game on the same browser does not start with the same question`: start a game, read `#prompt` text, reload the page, start again; the prompt text differs. Fails today (identical), passes after.
  - `the game still starts when storage is blocked`: `addInitScript` makes `window.localStorage` getter throw; `startGame` reaches 4 options and `#prompt` is not empty. Passes before and after (guards the anti-goal).
- [ ] **Step 2: Run** `npx playwright test e2e/seen-questions.spec.js`. Expected: first test FAILS (same prompt), second passes.
- [ ] **Step 3: Implement in `js/ui.js`:** in `startGame`, load the list with `APN.loadSeen(storage, APN.QUESTIONS)` and pass it as the fifth argument of `APN.pickQuestions`; in `startLeg`, right after `question = state.questions[leg]`, call `APN.recordSeen(storage, question.id)` (check that `APN.shuffleOptions` keeps `id` on its copy). `storage` is `localStorage` read in `try/catch`, `null` when unavailable, like the private `storage()` in `js/sound.js`; reuse an existing helper in `js/ui.js` if there is one.
- [ ] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: all pass (46 e2e before plus the 2 new tests on each project).
- [ ] **Step 5: Docs.** `README.md`: the game keeps two things in the browser: whether sound is on or off (`apn.sound`) and the ids of the questions already seen (`apn.seenQuestions`), used to avoid repeats; it keeps no answers. `BACKLOG.md`: delete the "Do not repeat questions a player has already seen" item. Question-bank spec, part 3 line: say the seen-questions slice is done, link `docs/specs/2026-11-23-seen-questions-design.md`.
- [ ] **Step 6: Screenshot** the running game with Playwright after playing two games on one browser context (the second game's first question differs), for the verification list.
- [ ] **Step 7: Commit proposal** to the owner (files, message, purpose, branch); no commit before approval.

## Self-review

- Spec coverage: storage and prune (Task 2), when recorded (Task 3 Step 3), picker pool choice, rule order, tie-break (Task 1), blocked storage (Tasks 2, 3), tests listed in the spec (Tasks 1-3), docs (Task 3 Step 5).
- Signatures: `loadSeen(storage, bank)`, `recordSeen(storage, id)`, `pickQuestions(..., seenIds)` are the same in every task.
- Differences from the spec: the helpers live in `js/game-logic.js`, not a new file, to avoid touching `index.html` and the release-stamp test; the e2e "two games" test compares only the first question, because the test stubs `Math.random` and a full second game would need playing six questions. The README line is added because its current text ("keeps nothing about the questions") would become false.
