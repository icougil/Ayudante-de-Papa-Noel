# Iteration 1: one playable level (Spain) — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Note:** this plan was written in Spanish with Spanish identifiers. It was translated after
> the code was renamed to English, so the names below are the ones in the code today.

**Goal:** One complete, playable level (Spain, 6 cities) in which Santa flies non-stop from city
to city and delivers gifts as the questions are answered correctly, published on GitHub Pages.

**Vocabulary:** on screen the word is always "ciudad" (city). In the code and the data the
internal name is `stops`.

**Architecture:** A single static page. The game logic is pure functions with no DOM
(`js/game-logic.js`), the data is kept apart (`js/data-level-1.js`) and a UI layer (`js/ui.js`)
draws the scene and connects the two. Everything hangs off a single global object, `APN`.

**Tech Stack:** HTML, CSS and JavaScript with no dependencies or build. Logic and data tests with
`node --test` (Node 18 or later). Visual check with Playwright on a real browser.

**Spec:** `docs/specs/2026-11-15-ayudante-de-papa-noel-design.md`

**Project root:** the repository root (all paths below are relative to it).

## Global Constraints

- No dependencies, no `package.json`, no build step.
- It must work by double-clicking `index.html` (`file://`) and on GitHub Pages: no ES module
  `import`/`export` and no `fetch` of local files; classic `<script src>` only.
- Each JS file adds its own members to `APN` like this: `globalThis.APN = globalThis.APN || {}`
  and, if `module` exists, `module.exports = globalThis.APN`. That way the same file works in the
  browser and in Node.
- No external images: emojis, inline SVG and CSS.
- All visible text in Spanish, with the exact wording given in this plan.
- Usable with mouse, finger and keyboard on desktop, tablet and phone (minimum width 360 px).
- Questions live only in the data file, never in the game code.
- Commits: each one needs the owner's prior approval (a proposal with files, message and purpose),
  except task commits inside a delegated execution on an isolated branch.

## Review Focus

1. **Double click or double tap** on an option or on "Seguir", and **an answer given right on
   arrival at the city**: it counts once and the game never hangs (Task 3, step 4).
2. **Opened with a double click (`file://`)**: the whole game works with no server (Task 3,
   step 4).
3. **Narrow phone (360 × 640)**: prompt and the 4 options visible with no horizontal scrolling
   (Task 3, step 4; and the length limits in the data test, Task 1).
4. **Not enough questions in the bank** for the age or the level: a clear error instead of a
   broken game (Task 2, test `pickQuestions throws when questions are missing`).
5. **Reduced motion** (`prefers-reduced-motion: reduce`): no animated flights or falls, and the
   game is still playable from start to finish (Task 3, step 4).

## File map

| File | Responsibility |
|------|----------------|
| `index.html` | The three screens (start, trip, result) and the script loading |
| `css/styles.css` | Scene, screens, animations, phone layout |
| `js/data-level-1.js` | `APN.LEVELS` (level 1) and `APN.QUESTIONS` (bank) |
| `js/game-logic.js` | Question picking, game state, scoring, mishaps. No DOM |
| `js/ui.js` | Draws, animates and connects logic and data to the page |
| `tests/data.test.js` | Validates the shape and size of the bank |
| `tests/game-logic.test.js` | Tests the logic |
| `README.md` | What it is, how to play, how to test, how to add questions |

Loading order in `index.html`: `data-level-1.js`, `game-logic.js`, `ui.js`.

---

### Task 1: Level 1 data and question bank

**Files:**
- Create: `js/data-level-1.js`
- Test: `tests/data.test.js`

**Interfaces:**
- Produces:
  - `APN.LEVELS: Level[]` with a single element:
    `{ id: 1, name: 'España', stops: Stop[6] }`.
  - `Stop = { id: string, name: string, landmark: string }`. Stops, in this order:

    | id | name | landmark (name for the drawing) |
    |----|------|---------------------------------|
    | `barcelona` | Barcelona | Sagrada Família |
    | `zaragoza` | Zaragoza | Basílica del Pilar |
    | `madrid` | Madrid | Puerta de Alcalá |
    | `sevilla` | Sevilla | La Giralda |
    | `santiago` | Santiago de Compostela | Catedral de Santiago |
    | `bilbao` | Bilbao | Museo Guggenheim |

  - `APN.QUESTIONS: Question[]`, with
    `Question = { id: string, minAge: number, maxAge: number, subject: string, place: string,
    prompt: string, options: string[4], correct: 0|1|2|3, explanation: string }`.
  - `APN.SUBJECTS = ['geography','history','sports','culture','maths','science','language','english']`.

**Bank content (written by the implementer; the owner reviews it before publishing):**
- All with `minAge: 10`, `maxAge: 12`, at the level of the last year of primary school.
- **About the place:** exactly 3 per stop (18), `place` = the stop's id, subject among
  `geography`, `history`, `sports`, `culture`, with at least 2 different subjects per stop.
- **General:** exactly 12, `place: 'general'`: 4 `maths`, 3 `science`, 2 `language`, 3 `english`
  (the English ones with the prompt in English). Include "¿Qué planeta se conoce como el planeta
  rojo?" (correct: Marte).
- A single indisputable answer per question; nothing that depends on how you count ("the longest
  river in Catalonia" is forbidden). Nothing that goes out of date (records, current champions,
  population).
- `id` in the format `<place>-<n>` (`barcelona-1`, `general-7`).
- `prompt` of 120 characters at most; each option, 40 at most; `explanation`, a single sentence
  of 160 characters at most.
- The position of the correct option varies in the file (not always `0`).

- [ ] **Step 1: Write the failing tests** in `tests/data.test.js`:

  | Test | What it proves |
  |------|----------------|
  | `level 1 has the 6 stops in order` | ids exactly `barcelona, zaragoza, madrid, sevilla, santiago, bilbao` |
  | `question ids are unique` | no duplicates |
  | `every question has the right shape` | 4 different, non-empty options, `correct` an integer 0–3, `subject` in `APN.SUBJECTS`, non-empty `explanation`, `minAge <= maxAge` |
  | `every question respects the length limits` | 120 / 40 / 160 |
  | `every place is a stop of the level or general` | no orphan places |
  | `there are 3 questions per stop and 12 general ones` | exact bank sizes |
  | `all questions suit an 11-year-old` | `minAge <= 11 <= maxAge` |

- [ ] **Step 2: Run them and see them fail**

  Run: `node --test tests/*.test.js`
  Expected: FAIL, `../js/data-level-1.js` not found.

- [ ] **Step 3: Create `js/data-level-1.js`** with `APN.LEVELS`, `APN.SUBJECTS` and the 30
  questions.

- [ ] **Step 4: Run them and see them pass**

  Run: `node --test tests/*.test.js`
  Expected: 7 tests, all PASS.

- [ ] **Step 5: Commit** — `js/data-level-1.js`, `tests/data.test.js`.
  Message: "The game has the Spain level with its 6 stops and a bank of 30 questions".

---

### Task 2: Game logic

**Files:**
- Create: `js/game-logic.js`
- Test: `tests/game-logic.test.js`

**Interfaces:**
- Consumes: `Level`, `Stop`, `Question` (Task 1).
- Produces (all on `APN`; `rng` is a function `() => number` in `[0, 1)`, like `Math.random`):
  - `APN.STOPS_PER_LEVEL = 6`, `APN.MIN_TO_PASS = 4`, `APN.TURBO_STREAK = 3`,
    `APN.FLIGHT_SECONDS = 20`, `APN.TURBO_FLIGHT_SECONDS = 14`.
  - `APN.MISHAPS`: exactly these three, in this order:

    | id | emoji | text |
    |----|-------|------|
    | `storm` | 🌨️ | `¡Tormenta de nieve! El regalo se ha perdido.` |
    | `reindeer` | 🤧 | `¡Un reno se ha resfriado! El regalo no llega a tiempo.` |
    | `drop` | 📦 | `¡El regalo se ha caído del trineo!` |

  - `APN.pickQuestions(level: Level, bank: Question[], age: number, rng): Question[6]`
    One question per stop, in the order of the stops. Alternates place and general: `rng() < 0.5`
    decides whether stops 1, 3 and 5 are "about the place" (and 2, 4, 6 general) or the other way
    round. The place question is picked at random among that stop's; the general ones, at random
    with no repeats. Only uses questions with `minAge <= age <= maxAge`. If any is missing, throws
    `Error('Not enough questions for this level and age')`. Does not modify `bank`.
  - `APN.shuffleOptions(question: Question, rng): Question`
    A copy with the options in a different order and `correct` pointing at the same option. Does
    not modify the original.
  - `APN.createGame(questions: Question[]): State`
    `State = { questions, index: 0, delivered: 0, express: 0, streak: 0, finished: false }`.
  - `APN.answer(state: State, option: number, beforeArrival: boolean): { state: State, correct: boolean, express: boolean, turbo: boolean }`
    Returns a new state (does not modify the one received). Right answer: `delivered + 1`,
    `streak + 1`. Right answer with `beforeArrival` `true`: also `express + 1` and returns
    `express: true`. Wrong answer: `streak = 0`, `express: false`. Always `index + 1`; `finished`
    is `true` when `index` reaches `questions.length`. `turbo` is `true` if the answer was right
    and the new streak is `>= 3`. If the game was already finished, throws
    `Error('The game is already over')`.
  - `APN.result(state: State): { delivered: number, express: number, total: number, passed: boolean, stars: 0|1|2|3 }`
    `passed` = `delivered >= 4`. Stars: fewer than 4 → 0, 4 → 1, 5 → 2, 6 → 3.
  - `APN.pickMishap(rng): Mishap` — `APN.MISHAPS[Math.floor(rng() * 3)]`.

- [ ] **Step 1: Write the failing tests** in `tests/game-logic.test.js` (use the real bank from
  Task 1 and a deterministic `rng` built from a list of values):

  | Test | What it proves |
  |------|----------------|
  | `pickQuestions returns 6, one per stop, alternating place and general` | with `rng` < 0.5 positions 0, 2, 4 have `place` = their stop's id and 1, 3, 5 `general`; with `rng` >= 0.5, the other way round |
  | `pickQuestions never repeats a question` | 6 different ids in 200 runs with `Math.random` |
  | `pickQuestions filters by age` | with `age = 8` and the real bank it throws the error |
  | `pickQuestions throws when questions are missing` | with an empty bank it throws `Not enough questions for this level and age` |
  | `pickQuestions does not modify the bank` | same length and same order afterwards |
  | `shuffleOptions keeps the correct answer` | `shuffled.options[shuffled.correct] === original.options[original.correct]`, same 4 options, original untouched |
  | `a right answer delivers a gift and moves on` | `delivered 1`, `streak 1`, `index 1`, `correct true`, `turbo false` |
  | `a wrong answer delivers nothing and breaks the streak` | after 2 right and 1 wrong: `delivered 2`, `streak 0`, `correct false` |
  | `a right answer before arrival is an express delivery` | `beforeArrival true` → `express true`, state `express 1`, `delivered 1` |
  | `a late right answer or a wrong answer is not express` | right with `beforeArrival false` → `express false`, `delivered 1`, state `express 0`; wrong with `beforeArrival true` → `express false`, state `express 0` |
  | `three right answers in a row give turbo, and so does the fourth` | `turbo` = false, false, true, true |
  | `answer does not modify the state it receives` | the original state keeps `index 0` |
  | `the game ends after the sixth answer` | `finished true`; a seventh throws `The game is already over` |
  | `result: stars and passed depend on the gifts delivered` | 0–3 → `passed false`, 0 stars; 4 → 1; 5 → 2; 6 → 3; `total 6` |
  | `the game constants match the design` | 6 stops, minimum 4, streak 3, flight 20 s, turbo 14 s |
  | `pickMishap covers all three` | `rng` 0, 0.34, 0.99 → `storm`, `reindeer`, `drop` |

- [ ] **Step 2: Run them and see them fail**

  Run: `node --test tests/*.test.js`
  Expected: the 16 new ones FAIL (`../js/game-logic.js` not found); the 7 data ones PASS.

- [ ] **Step 3: Implement `js/game-logic.js`** with the signatures above.

- [ ] **Step 4: Run them and see them pass**

  Run: `node --test tests/*.test.js`
  Expected: 23 tests, all PASS.

- [ ] **Step 5: Commit** — `js/game-logic.js`, `tests/game-logic.test.js`.
  Message: "The game can pick questions, count gifts, and give turbo and stars".

---

### Task 3: Screens, scene and animations

**Files:**
- Create: `index.html`, `css/styles.css`, `js/ui.js`

**Interfaces:**
- Consumes: everything Tasks 1 and 2 produce. Fixed age: `11`. `rng`: `Math.random`.
- Produces: the playable page. `ui.js` adds nothing to `APN` that other files use.

**Behaviour:**

*Start screen* (`<title>` and `<h1>`: `Ayudante de Papá Noel`)
- Text: `Ayuda a Papá Noel a repartir los regalos por España.`
- Button: `¡A repartir!` → starts a new game of level 1 and moves to the trip screen.

*Trip screen*
- **Santa never stops.** He flies at a fixed point of the screen (left third), with the sleigh
  and **one reindeer**, bobbing; what moves is the scenery, which scrolls from right to left
  without stopping at any moment of the trip screen (not even while a notice is being read).
- Scene: night sky with moon and stars (almost still), snowy hills in the background (slow) and,
  in the foreground, houses, fir trees and the cities (fast). Each city is its landmark drawn
  (emoji or simple SVG, recognisable) with a chimney and a sign with its name.
- Scoreboard, always visible: `Regalos entregados: N` (with one 🎁 per gift), `⚡ N` (express
  deliveries) and `Ciudad X/6: <city name>`.
- **Flight leg:** at the start of each leg the question appears (prompt and 4 buttons with the
  options shuffled with `APN.shuffleOptions` when the game is created, so the state and the
  screen use the same order) and the next city comes in from the right so that it sits under the
  sleigh after `APN.FLIGHT_SECONDS` seconds (`APN.TURBO_FLIGHT_SECONDS`, with a trail of stars and
  faster scenery, if the previous answer gave turbo). A thin bar `🎅 ───── 🏠` shows how far
  there is left to go.
- **Arrival with no answer:** Santa flies in circles over the city (the sky and the hills keep
  scrolling) and `Papá Noel da vueltas sobre <city>... ¡piénsalo con calma!` is shown. There is
  no time limit or penalty.
- On pressing an option the 4 buttons are disabled; the correct one is marked green and, if the
  answer was wrong, the chosen one red. `APN.answer` is called with `beforeArrival` = Santa had
  not reached the city yet.
  - **Right answer before arriving:** the scenery speeds up until the city passes under the
    sleigh (1.5 s at most), the gift drops into the chimney on the way past and
    `¡Correcto! Entrega exprés ⚡🎁` is shown.
  - **Right answer while circling:** the gift drops into the chimney and
    `¡Correcto! Regalo entregado 🎁` is shown.
  - In both, if there was turbo, also `¡Turbo! 3 aciertos seguidos ✨`. The notice stays for
    2.5 s and the next leg starts by itself, with nothing to press.
  - **Wrong answer:** the mishap's emoji and text (`APN.pickMishap`), with its animation in
    mid-flight (falling snow, a sneezing reindeer, a gift falling out of the scene),
    `La respuesta correcta era: <option>.`, the `explanation` and the `Seguir` button. The city is
    left behind with no gift. `Seguir` starts the next leg.
- After the sixth answer (once the notice is over or `Seguir` is pressed) the game moves to the
  result screen.
- Keyboard focus moves to the first option when the question appears and to `Seguir` when it is
  there. Notices are announced to screen readers (`aria-live="polite"`).

*Result screen*
- Passed: `¡Nivel superado!`, the stars earned (⭐ filled and ☆ empty, up to 3),
  `Has entregado N de 6 regalos.`, `Entregas exprés: N ⚡` and the button `Jugar otra vez`.
- Not passed: `A Papá Noel le han faltado regalos. ¡Inténtalo otra vez!`,
  `Has entregado N de 6 regalos.`, `Entregas exprés: N ⚡` and the button `Reintentar`.
- Both buttons start a new game (questions picked again).

*General*
- At 360 px wide: no horizontal scrolling; scene on top and question below, the 4 options in one
  column; from 600 px, in two columns. Buttons at least 44 px high.
- With `prefers-reduced-motion: reduce`: the scenery does not scroll and there is no circling,
  falling or trails; the next city is shown under the sleigh right away, the distance bar keeps
  advancing (express delivery still exists) and the texts appear all the same.
- If the tab goes to the background, the leg pauses and resumes on return (the express delivery
  is not lost by switching tabs).
- Colours with enough contrast to read over the dark sky (question text on a light panel).

- [ ] **Step 1: Create `index.html`, `css/styles.css` and `js/ui.js`** with the behaviour above.

- [ ] **Step 2: Check the logic is still green**

  Run: `node --test tests/*.test.js`
  Expected: 23 tests, all PASS.

- [ ] **Step 3: Play a full game in a real browser** with Playwright, opening `index.html` over
  `file://`: start → 6 answers → result. To answer right or wrong at will, find the correct
  option by comparing the button text with `APN.QUESTIONS`. Play three games: one with 6 quick
  right answers (expected: `¡Nivel superado!`, ⭐⭐⭐, `Entregas exprés: 6 ⚡`, turbo from the
  third right answer), another with 3 right answers (expected: the not-passed text and
  `Reintentar`) and another waiting more than 20 s on a question before answering it right
  (expected: Santa circles, the circling text is shown, the gift is delivered and no express is
  added). Check with two screenshots 1 s apart that the scenery moves during the question and
  during the wrong-answer notice. Screenshots of the start, a question in flight, an express
  delivery, the circling, a mishap and both results. No errors in the console.

- [ ] **Step 4: Check the Review Focus points** in the browser:
  - Quick double click on an option and on `Seguir`: the scoreboard goes up by 1 at most and the
    city advances by 1 only. Answering at the moment of arrival (at 20 s): the game goes on and
    the gift is counted once.
  - All of the above was done over `file://` (no server).
  - 360 × 640 window: `document.documentElement.scrollWidth <= 360` on the three screens;
    screenshot of the longest question in the bank.
  - With `prefers-reduced-motion: reduce` emulated: a full game from start to finish.
  - Keyboard only (Tab, Enter): a full game.

- [ ] **Step 5: Commit** — `index.html`, `css/styles.css`, `js/ui.js`.
  Message: "The Spain level can be played: Santa flies non-stop from city to city, delivers
  gifts on right answers and suffers mishaps on wrong ones".

---

### Task 4: README and publishing on GitHub Pages

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the finished game. Remote: `git@github.com:icougil/Ayudante-de-Papa-Noel.git`, branch
  `main`.
- Produces: the game at `https://icougil.github.io/Ayudante-de-Papa-Noel/`.

- [ ] **Step 1: Rewrite `README.md`** with: what it is (two sentences), a link to play
  (`https://icougil.github.io/Ayudante-de-Papa-Noel/`), how to play locally (double click on
  `index.html`), how to run the tests (`node --test tests/*.test.js`) and how to add a question
  (the fields of `Question` and the content rules of Task 1).

- [ ] **Step 2: The owner reviews the 30 questions** in `js/data-level-1.js` and the ones they point
  out are fixed. Run: `node --test tests/*.test.js` → 23 PASS.

- [ ] **Step 3: Commit and push** (with the owner's approval) — `README.md` and fixes.
  Message: "The README explains how to play, test and add questions".

- [ ] **Step 4: Enable GitHub Pages** (an action visible from outside: only with the owner's
  go-ahead) on the `main` branch, root folder:
  `gh api -X POST repos/icougil/Ayudante-de-Papa-Noel/pages -f 'source[branch]=main' -f 'source[path]=/'`
  If the repository is private and the account does not allow Pages on private repositories,
  stop and say so.

- [ ] **Step 5: Check the published site**: open
  `https://icougil.github.io/Ayudante-de-Papa-Noel/` with Playwright (it may take a couple of
  minutes to become available), play a full game, screenshot of the result, no errors in the
  console.

---

## Out of this iteration

Levels 2 and 3, level map, extra reindeer, saved progress, choosing the age, two players, sound.
They are in the design as iterations 2 to 5.
