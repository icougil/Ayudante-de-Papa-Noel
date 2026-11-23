# Do not repeat questions a player has already seen — design

Part 3 of the question-bank plan (`2026-11-18-question-bank-design.md`), first slice: the browser
remembers which questions the player has seen and the picker prefers the others. Raising the
difficulty and bringing back wrongly answered topics stay out (later slices).

## Intent

A game picks 6 questions from a bank of 60, so a player who plays twice meets repeats. The owner
wants a game to ask questions the player has not seen, until the bank runs out of them.

## Goals

- A game prefers questions the player has not seen before, on the same browser.
- When a pool has no unseen question left, the game degrades in a fixed order (below) instead of
  failing.
- No server, no account: the memory is the browser's `localStorage`.

## Non-goals and anti-goals

- No change to the questions' data format, the build step or the screens.
- Not a hard filter: a game must always start, whatever is stored (anti-goal: a player stuck on
  "Not enough questions" because every question was seen).
- A question about another city is never used at a stop: the stop's theme matters more than
  avoiding a repeat.
- The two-`ca` cap still wins over the seen preference: a game never gets three Catalan questions
  just to avoid a repeat.

## Approaches

1. **Seen list in `localStorage`, picker takes it as an input** (chosen by the owner's direction:
   `localStorage` is enough). The picker stays a pure function; storage lives in `js/ui.js`.
2. A server-side record per player. Needs accounts and a backend: out of proportion for a static
   game. Rejected.
3. Remember whole past games instead of question ids. Larger to store and still needs the ids to
   decide. Rejected.

Fallback when a city has no unseen question (owner's choice of order): the city's own unseen
questions, then unseen general questions, then repeat the city's least recently seen. Rejected: a
question about another city (breaks "about the place").

## Design

### Storage (`js/ui.js`)

- Key `apn.seenQuestions`: a JSON array of question ids, oldest first.
- Read once when a game starts; ids not in the current bank are dropped (a removed or renamed
  question must not accumulate). Invalid JSON or a non-array reads as an empty list.
- A question is recorded when it is shown to the player at its stop, not when the game is picked:
  a game abandoned halfway does not burn the questions never seen. Recording moves the id to the
  end of the list (most recent), so the list order is "least to most recently seen".
- Every `localStorage` read and write is in `try/catch`. If storage is unavailable (private mode,
  blocked), the game plays exactly as today, with an empty list and no error on screen.

### Picker (`js/game-logic.js`)

`APN.pickQuestions(level, bank, age, rng, seenIds)`: `seenIds` is a new optional fifth parameter,
an array of ids, oldest first, default `[]`. With `[]` the behaviour is today's, so existing tests
and callers hold.

For each stop:

1. **Choose the pool.** A general turn uses the general questions not yet picked in this game. A
   place turn uses the stop's city questions, unless the city has no unseen question that keeps
   rule 1 below true, in which case it uses the unseen general questions (not yet picked in this
   game) if any keeps rule 1 true; if neither has one, it uses the city's questions.
2. **Narrow the pool** with the rules in this order of importance, relaxing from the last, as
   today: (1) no more than two `ca` questions in the game; (2) a question not in `seenIds`;
   (3) a subject not yet used in this game; (4) no topic shared with a question already picked.
3. **Pick** at random among what remains, except that when every remaining candidate is in
   `seenIds` (rule 2 had to give way), it picks the least recently seen one (the earliest in
   `seenIds`).

The "general question never twice in a game" and the "alternating place / general" shape do not
change. A place stop answered from the general pool still counts as a general question for that
rule. `Not enough questions for this level and age` is still thrown only for an empty pool.

## What is left to the builder

- Where in `js/ui.js` the "question is shown" event is, and the exact function names for load,
  record and prune (suggestion: `APN.seenStore` in a small file, so it is unit-testable with a
  fake storage object).
- Whether `README.md` needs a line (see Docs).

## Tests

`tests/game-logic.test.js` (picker; the fake `rng` and bank helpers already there):

- `Should ignore seenIds when it is empty`: same picks as without the parameter for the same
  rng. Passes from the start; it guards the default.
- `Should not pick a seen question while an unseen one fits`: bank with 2 questions for a city, one
  seen; the picked one is the unseen. Fails today (random pick), passes after.
- `Should use an unseen general question at a place stop when the city has none unseen`: all the
  city's questions seen, general has unseen; the stop gets a general question. Fails, then passes.
- `Should repeat the city's least recently seen question when city and general are all seen`: the
  stop gets the city question that is earliest in `seenIds`. Fails, then passes.
- `Should never use another city's question at a stop`: every city seen, all general seen; the
  picked question's `place` equals the stop id. Passes after.
- `Should keep at most two Catalan questions even if the only unseen ones are Catalan`: two `ca`
  already picked, the only unseen candidate is `ca`; a seen non-`ca` is picked. Fails, then passes.
- `Should pick the least recently seen general question when all are seen`. Fails, then passes.
- `Should not throw when every question was seen`: `seenIds` holds the whole bank; 6 questions
  returned.

`tests/seen-store.test.js` (new, fake storage object):

- `Should read an empty list when nothing is stored`, `... when the stored value is not JSON`,
  `... when it is not an array`.
- `Should drop ids that are not in the bank`.
- `Should move a recorded id to the end` and `Should not duplicate a recorded id`.
- `Should not throw when storage throws on read or write`: returns `[]`, record is a no-op.

`e2e/game.spec.js`:

- `Should not repeat questions across two games`: play a game, reload, play another, with
  `localStorage` kept; `Math.random` is stubbed to the same value in both games; the 6
  prompts of the second game all differ from the first game's. Fails today (identical games),
  passes after.
- `Should still start a game when storage is blocked`: `localStorage` throws on access; the game
  reaches the first question.

## Docs

- `BACKLOG.md`: the "Do not repeat" item is done (remove it); the bank-growth item gains the
  coverage targets agreed after this design.
- `docs/specs/2026-11-18-question-bank-design.md`: part 3 line says the seen-questions slice is
  done and points here.
- `README.md`: one line if it describes how questions are picked.

## Acceptance

- Two games in a row on the same browser share no question while the pools have unseen ones.
- With the whole bank seen, a game still starts.
- With storage blocked, the game plays as before.
- All tests pass.
