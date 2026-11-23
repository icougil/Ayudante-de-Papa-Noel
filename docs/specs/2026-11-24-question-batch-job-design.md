# A scheduled job that adds questions — design (part 2 of 3)

Date: 2026-11-24. Approved by the owner in conversation on the same day, except the points marked
**(designer's call)**.

## Intent

The bank (60 questions) repeats too soon, and the "do not repeat seen questions" feature
(part 3, first slice) makes that visible: a pool with five questions runs out after a few games.
Writing questions by hand does not scale. The owner wants a job that, every 3 days, adds 10
questions and opens a pull request, which the owner reviews and merges. Part 1
(`2026-11-18-question-bank-design.md`) built the data format, the build and the rules; this part
adds the job that uses them.

The questions are for children aged 10 to 12 and are read by the owner before they reach the
game. The job's aim is to make that review quick, not to replace it.

## Goals, non-goals, anti-goals

- Goal: every 3 days, a pull request that adds 10 new questions to `questions/*.json` (and the
  regenerated `js/questions.js`), with nothing else changed.
- Goal: each batch goes where the bank is thinnest, until every pool has at least 15 questions.
  A pool is each of the six cities (by `place`) and each general subject: maths, science,
  language, english, catalan. Today: cities 5 each, maths 8, science 8, language 5, english 6,
  catalan 3.
- Goal: the pull request lets the owner review in minutes: a table of the 10 new questions with
  their answer, explanation, reference link and difficulty, and the job's doubts flagged.
- Goal: the job's instructions live in the repository, versioned and reviewed like code.
- Non-goal: merging by itself, ever. Nothing reaches the game without the owner's merge.
- Non-goal: part 3 beyond what is done, general Catalonia questions (a separate backlog item,
  needs its own design), translating the game's screens.
- Anti-goal: text copied from a source (own-words rule of part 1).
- Anti-goal: a pile of unreviewed pull requests, or two open batches that conflict.
- Anti-goal: a question that a 10-year-old cannot answer from class or daily life, or whose fact
  the job could not confirm in its reference.

## Approaches

1. **A Claude routine in the cloud — chosen by the owner.** A scheduled cloud session clones the
   repository, writes the batch, builds, tests and opens the pull request. No API key, runs on the
   owner's Claude account, can be created and tested from a Claude Code session, and its runs
   are readable in the routines list.
2. A scheduled GitHub Actions workflow calling the Claude API. Everything is in the repository,
   but it needs an API key secret and separate billing, GitHub's cron cannot say "every 3 days"
   exactly, and pull requests opened with the built-in token do not start CI.
3. A scheduled session on the owner's machine. Lives only while Claude Code is open and expires
   after 30 days: not realistic.

## Design

### The routine

- A routine named `question-batch` on the owner's Claude account, with the repository
  `icougil/Ayudante-de-Papa-Noel`, running about every 3 days at 07:17 Barcelona time
  (06:17 UTC in winter, 05:17 UTC in summer; an off-minute on purpose) **(designer's call)**. If the scheduler offers only cron, it fires on
  days 1, 4, 7 … 28 of each month (a gap of up to 4 days at month end is fine).
- Its prompt is one line: follow the repository skill `write-question-batch`. The rules are not
  in the routine, so changing them is a pull request. The skill is `.claude/skills/write-question-batch/SKILL.md`
  in the repository, because a cloud session never sees the owner's own `~/.claude`.
- The routine opens a pull request and stops. It never pushes to `main` and never merges.

### What one run does (the skill)

1. **Guards.** If a pull request whose branch starts with `question-batch/` is still open, stop
   without doing anything (the owner has not reviewed the last batch; two open batches would also
   conflict, since they edit the same files). If every pool already has at least 15 questions,
   stop too. Either way the run's log says why.
2. **Choose the slots.** Run `node scripts/question-pools.js`, which prints each pool with its
   count and the subjects and difficulties already in it. Give the 10 slots to the pools furthest
   below 15, at most 3 per pool, so a batch covers at least 4 pools **(designer's call)**. Within
   a city, fill the missing subjects first (sports in Santiago, Sevilla and Zaragoza; history in
   Barcelona, Bilbao and Madrid) and add difficulty 2 and 3, since city questions are almost all
   difficulty 1 (backlog).
3. **Write the questions** following part 1's data format and rules: own words, a real checkable
   `https` reference for each, labels (`lang`, `topics`, `difficulty`), the length limits, the
   language and subject agreement, and the Spanish marks in braces. A pool's Catalan share stays
   at or below a third, except the `catalan` pool, which is all Catalan **(designer's call)**. A
   topic that does not exist yet is added to its subject's file.
4. **Check its own work**, and drop and replace any question that fails:
   - *Age:* "would a child in 5è or 6è know this from class or daily life?" The four questions
     replaced in the owner's review (too specialised) are the examples of a failure; the skill
     lists them.
   - *Fact:* the fact is re-read against its reference; a fact the job cannot confirm is dropped.
   - *Repeat:* the new question does not ask the same fact, or nearly the same prompt, as one
     already in the bank (the job reads all questions first).
   - *Distractors:* the three wrong options are plausible and clearly wrong, not a trick.
5. **Build and test.** `npm run build:questions` then `npm test`.
   If either fails after two fixing attempts, no pull request is opened and the log says what failed.
6. **Open the pull request** from a branch `question-batch/YYYY-MM-DD`, with one commit
   "Add 10 questions: <pools>" and a title the same. Only `questions/*.json` and `js/questions.js`
   change. The description (in English, rule of `CLAUDE.md`) has, in this order: a one-line summary;
   the `Play this branch` link (added once the number is known); the pool counts before and after;
   the review table; the doubts.

### The review table

Only the 10 new questions, never the existing ones. One row each: id, language, pool, difficulty,
prompt, the four options with the right one marked, the explanation, the reference as a link. The
job adds a ⚠️ line under any question it is less sure about (an age doubt, a reference that only
partly confirms the fact) saying why. The owner reads the table, plays the branch if wanted, and
merges or comments; a comment on a question is fixed by hand or by a session, not by the routine.

### The pool counter

`scripts/question-pools.js` exports `countPools(questions)` and prints, for each pool, its count,
the subjects and the difficulties present, and whether it is below 15. A pool is the question's
`place` when it is a city and `general:<subject>` otherwise. The job calls it so it does not count
by hand, and a test fixes the rule. The target 15 is a constant in that script.

## Tests

`tests/question-pools.test.js`:

- `a city question counts in its city's pool`.
- `a general question counts in its subject's pool`.
- `a pool below 15 is reported as below the target and one at 15 is not`.
- `the pools of the current bank are the six cities and the five general subjects`.

The routine itself cannot be tested in CI. Checked by hand once, before relying on the schedule:
run the routine now with `run`, read its log and its pull request, then review the table.

## Documentation

- README: a short "Question batches" section: what the routine does, the guard (one open batch at a
  time), where its instructions are, how to run it now, how to pause it.
- BACKLOG: "Grow the question bank" and "Get questions from an external source" say part 2 is done
  once the first batch is merged.

## Left to the builder

- The exact wording of the skill, within the steps above.
- The layout of the review table, within its columns.
- Whether the scheduler keeps 07:17 Barcelona time across the daylight-saving change or stays on a fixed UTC time
  (then it moves to 08:17 in summer); either is fine.
