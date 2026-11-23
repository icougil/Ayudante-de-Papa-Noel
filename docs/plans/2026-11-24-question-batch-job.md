# Scheduled question batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every 3 days a Claude cloud routine opens a pull request that adds 10 new questions, aimed at the thinnest pools, for the owner to review.

**Architecture:** A small tested script counts the question pools; a repository skill holds the job's instructions; a routine on the owner's Claude account fires every 3 days with a one-line prompt that points to the skill. The job reuses part 1's build and tests and changes only `questions/*.json` and `js/questions.js`.

**Tech Stack:** Node (standard library only, `node:test`), a Claude Code skill (Markdown), a Claude routine (`RemoteTrigger`).

**Spec:** `docs/specs/2026-11-24-question-batch-job-design.md`

## Global Constraints

- Code, file names, comments, test names, README, commits and the PR text are in English; questions are in Spanish, Catalan or English as part 1 says.
- Node standard library only; scripts export their functions and run `main` only under `require.main === module` (as `scripts/stamp-release.js` does).
- Pool target: 15 questions. A pool is a city (`place` is a stop id of `APN.LEVELS[0].stops`) or `general:<subject>` for `place === 'general'`, with subject one of `maths`, `science`, `language`, `english`, `catalan`.
- 10 questions per batch, at most 3 per pool, so a batch covers at least 4 pools. A pool's Catalan share stays at or below a third, except `catalan`.
- Branch `question-batch/YYYY-MM-DD`; one commit "Add 10 questions: <pools>"; only `questions/*.json` and `js/questions.js` change.
- Guards: stop with no PR when a pull request with a branch starting `question-batch/` is open, or when every pool has at least 15 questions.
- The routine never merges and never pushes to `main`. The PR description has the `Play this branch` link right after its summary (`CLAUDE.md`).
- The owner's name appears in no repository file; write "the owner".
- Verification is run by Claude and shown as output (the unit tests); the routine's first run is read by Claude from its log and PR.

## Review Focus

- A bank with no question in a pool (for example no `catalan` question): the pool still appears with count 0 and is below the target.
- A general question whose subject is a place subject (`geography`): not counted in any general pool and reported as an error, not silently dropped.
- A question whose `place` is a stop id that is not in the level: reported as an error.
- A pool exactly at 15: not below the target; one at 14 is.
- The script run on the real bank prints the eleven pools in a stable order (cities in route order, then maths, science, language, english, catalan) so the job's reading of it does not vary.

## File structure

| Path | Role |
|---|---|
| `scripts/question-pools.js` | Create. Counts the pools and prints them. |
| `tests/question-pools.test.js` | Create. Tests of the counter. |
| `.claude/skills/write-question-batch/SKILL.md` | Create. The job's instructions. |
| `package.json` | Modify. Script `pools`: `node scripts/question-pools.js`. |
| `README.md`, `BACKLOG.md` | Modify. Document the job; update the backlog. |

---

### Task 1: The pool counter

**Files:**
- Create: `scripts/question-pools.js`
- Test: `tests/question-pools.test.js`
- Modify: `package.json` (script `pools`)

**Interfaces:**
- Produces: `countPools(questions, stopIds, target = TARGET) -> Pool[]` where
  `Pool = { pool: string, count: number, subjects: string[], difficulties: { 1: number, 2: number, 3: number }, belowTarget: boolean }`
  and `pool` is the stop id for a city or `general:<subject>`. Order: `stopIds` order, then `maths`, `science`, `language`, `english`, `catalan`. Pools with no question are included with count 0.
  `subjects` lists the distinct subjects present in the pool (sorted); for a general pool it is just that subject.
- Produces: constants `TARGET = 15` and `GENERAL_SUBJECTS = ['maths', 'science', 'language', 'english', 'catalan']`, exported.
- Throws `Error` with these exact messages: `question <id>: place "<place>" is not a stop of the level` and `question <id>: a general question cannot have the place subject "<subject>"`.
- Consumes: `APN.QUESTIONS` (from `js/questions.js`) and `APN.LEVELS[0].stops` (from `js/data-level-1.js`), required in `main`.
- `main` prints one line per pool: `<pool padded> <count> <below|ok>  subjects: <a, b>  difficulty: 1×<n> 2×<n> 3×<n>`, then a last line `Pools below 15: <names or "none">`.

- [ ] **Step 1: Write the failing tests** in `tests/question-pools.test.js`, each with a tiny hand-made bank (question objects with only `id`, `place`, `subject`, `difficulty`):
  - `a city question counts in its city's pool`: two `madrid` questions give `{ pool: 'madrid', count: 2 }`.
  - `a general question counts in its subject's pool`: a `general` + `maths` question gives `{ pool: 'general:maths', count: 1 }`.
  - `a pool with no question is listed with a count of 0` (Review Focus): a bank with no `catalan` question still lists `general:catalan` with count 0 and `belowTarget` true.
  - `a pool at the target is not below it and one under it is`: 15 questions in a city give `belowTarget` false; 14 give true.
  - `the pools come in route order, then the general subjects`: the `pool` list equals the stop ids followed by the five general subjects.
  - `a place question outside the level is an error`: place `paris` throws `question x-1: place "paris" is not a stop of the level`.
  - `a general question with a place subject is an error`: `general` + `geography` throws `question x-2: a general question cannot have the place subject "geography"`.
  - `the difficulties and subjects of a pool are listed`: one city pool with a geography d1 and a history d3 question gives `subjects: ['geography', 'history']` and `difficulties: { 1: 1, 2: 0, 3: 1 }`.
  - `the current bank has the eleven pools` : requiring the real `js/data-level-1.js` and `js/questions.js`, `countPools` returns 11 pools whose counts add up to `APN.QUESTIONS.length`.
- [ ] **Step 2: Run** `node --test tests/question-pools.test.js`. Expected: FAIL, `Cannot find module '../scripts/question-pools.js'`.
- [ ] **Step 3: Implement** `scripts/question-pools.js` to the interface above, and add `"pools": "node scripts/question-pools.js"` to `package.json`.
- [ ] **Step 4: Run** `node --test tests/*.test.js`. Expected: all pass (the previous 125 plus the 9 new). Then run `npm run pools` and show its output: eleven lines, cities at 5, maths 8, science 8, language 5, english 6, catalan 3, and a last line naming all eleven pools as below 15.
- [ ] **Step 5: Commit** `scripts/question-pools.js`, `tests/question-pools.test.js`, `package.json` — "Count the question pools so a batch can target the thinnest ones".

### Task 2: The job's instructions (a repository skill)

**Files:**
- Create: `.claude/skills/write-question-batch/SKILL.md`

**Interfaces:**
- Consumes: `npm run pools` (Task 1), `npm run build:questions`, `npm test`, the rules of `docs/specs/2026-11-18-question-bank-design.md` (data format, own words, language marks) and `README.md` "Adding a question".
- Produces: a skill named `write-question-batch` with front matter `name`, and a `description` that starts "Use when a scheduled routine or the owner asks for a batch of 10 new questions".

- [ ] **Step 1: Write the skill** following the design's "What one run does", steps 1 to 6, in the same order and with the same exact values: the two guards (how to check for an open `question-batch/` PR with `gh pr list --state open --search "head:question-batch/"`), the 10 slots with at most 3 per pool, the missing city subjects first (sports in Santiago, Sevilla and Zaragoza; history in Barcelona, Bilbao and Madrid) and difficulty 2 and 3 for cities, the Catalan share rule, the four self-checks (age, fact, repeat, distractors), build then test with two fixing attempts, the branch and commit and PR rules, the review table columns (id, language, pool, difficulty, prompt, the four options with the right one marked, explanation, reference link) and the ⚠️ line for doubts.
  - The skill lists the four questions replaced in the owner's review as age-check examples: the Guggenheim's architect, the sierra between Madrid and Castilla y León, the river that forms the ría de Bilbao with the Ibaizábal, the Aljafería's century.
  - It says what never to do: copy text from a source, touch any file other than `questions/*.json` and `js/questions.js`, merge, push to `main`, change the rules.
  - It says the PR text and commit are in English and never contain the owner's name.
- [ ] **Step 2: Read it as the routine would**, with nothing but the repository: every command named in it exists and runs (`npm run pools`, `npm run build:questions`, `npm test`, `gh pr list`). Show the output of `npm run pools` and `npm run build:questions` (no change to `js/questions.js`: `git status --short` shows nothing).
- [ ] **Step 3: Commit** the skill — "Add the instructions for the scheduled question-batch job".

### Task 3: Documentation

**Files:**
- Modify: `README.md`, `BACKLOG.md`

- [ ] **Step 1: README**: a section "Question batches" saying: what the routine does and how often (about every 3 days, 10 questions, a PR the owner reviews and merges); the guard (one open batch at a time); that its instructions are `.claude/skills/write-question-batch/SKILL.md`; how to run it now (the routine's "Run now" in claude.ai, or ask Claude Code to use the skill); how to pause it; `npm run pools` shows the pool counts.
- [ ] **Step 2: BACKLOG**: in "Grow the question bank" and "Get questions from an external source", say part 2 is built (the job and its instructions) and that it is done once the first batch is merged; leave part 3's remaining slices.
- [ ] **Step 3: Commit** — "Document the scheduled question batches".

### Task 4: Create and try the routine (after the pull request is merged)

The routine clones `main`, so the script and the skill must be merged first. This task changes nothing in the repository.

**Files:** none.

**Interfaces:** Consumes the skill name `write-question-batch` (Task 2).

- [ ] **Step 1: Wait for the owner's merge** of the pull request for Tasks 1 to 3, then `git switch main && git pull`.
- [ ] **Step 2: Create the routine** with `RemoteTrigger` `create`: name `question-batch`; the repository `icougil/Ayudante-de-Papa-Noel`; the prompt "Use the write-question-batch skill of this repository."; the schedule every 3 days at 07:17 Barcelona time (cron on days 1, 4, 7 … 28 of each month if only cron is accepted); disabled until step 4 if the API allows. Show the owner the returned run time and the routine's link, and wait for the owner's go-ahead before enabling (it opens PRs in the owner's repository).
- [ ] **Step 3: Run it once by hand** (`RemoteTrigger` `run`), then read `list_runs` and `get_run_log`. Expected: a PR `question-batch/<date>` with only `questions/*.json` and `js/questions.js` changed, 10 new questions in at least 4 pools, none above 3 per pool, the review table, the `Play this branch` link, CI green. Show the PR link and check its table by hand against the Review Focus and the design.
- [ ] **Step 4: Hand over** a verification list for the owner (read the table, play the branch, merge or comment), then enable the schedule. Run the guard check on the next fire: with the PR still open, the run must stop without a second PR.
- [ ] **Step 5:** After the owner merges the first batch, mark part 2 done in `BACKLOG.md` (a small follow-up commit and PR).

## Self-review

- **Spec coverage:** routine and schedule → Task 4; guards, slot choice, writing rules, self-checks, build and test, PR, review table → Task 2; pool counter and its tests → Task 1; documentation → Task 3; the manual first run → Task 4 step 3. The Catalan-share, at-most-3 and 4-pools rules are in Task 2 and in Global Constraints.
- **Placeholders:** none; the exact messages, constants and commands are given.
- **Consistency:** `countPools`, `TARGET`, `GENERAL_SUBJECTS`, the script `pools` and the skill name `write-question-batch` are used with the same names in every task.
- **Proportion:** four small tasks; the code is one script of about 60 lines plus a Markdown skill.
