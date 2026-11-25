---
name: write-question-batch
description: Use when a scheduled routine or the owner asks for a batch of 10 new questions for the game's question bank. Writes the questions, checks them, and opens a pull request for the owner to review.
---

# Write a batch of 10 questions

You add 10 new questions to the game's bank and open a pull request. The owner reads every
question before it reaches the game, so your job is to write good questions and make that review
fast. You never merge and never push to `main`. The job runs every 3 days and does not stop when
the targets are met: 15 questions per pool and 3 per curriculum block are **minimums**, not a
finish line. Once they are met, keep adding to the pools and blocks with the fewest questions.

The questions are for children aged 10 to 12 (5è and 6è of primary school in Catalonia, the cicle
superior). The data format and rules are in `docs/specs/2026-11-18-question-bank-design.md` and
`README.md` ("Adding a question"). The curriculum is `docs/curriculum/cicle-superior.md`: it says
which sabers of the cicle superior can become questions and which facts are out. Read all three
first. The design of this job is `docs/specs/2026-11-24-question-batch-job-design.md`.

## 1. Guards (stop here if one applies)

- An open batch: run
  `gh api 'repos/icougil/Ayudante-de-Papa-Noel/pulls?state=open&per_page=100' --jq '[.[] | select(.head.ref | startswith("question-batch/"))] | length'`.
  (Not `gh pr list`: the scheduled cloud session blocks GitHub's GraphQL API, which it uses.)
  If it prints more than 0, stop and say "a batch is still open for review".
  If the command fails (for example `gh` is missing or not signed in), stop too and say "the guard could not be checked": never go on without it.

## 2. Choose the 10 slots

- Run `npm run pools` and `npm run curriculum`. In the first, each line is
  `pool  <questions it has now>  below|ok  ...`: the number is how many questions the pool **already
  has**, so the lowest numbers are the thinnest pools (15 is the minimum, not a stop). Give the 10
  slots to the pools with the fewest questions, **at most 3 per pool**, so a batch covers at least
  4 pools. If several pools tie at the lowest count, pick among them at random (for example
  `node -e "const a=['x','y']; console.log(a[Math.floor(Math.random()*a.length)])"`), not always the
  first one. In the second, each line is `area/block  have  floor  missing  status`: use it to
  choose the curriculum block for each question.
- The job always writes 10 questions. A pool may go above 15 when a block below 3 has no other
  fitting pool: the block floor wins over the pool minimum.
- For a city, fill its missing subjects first: sports in Santiago, Sevilla and Zaragoza; history in
  Barcelona, Bilbao and Madrid. City questions are almost all difficulty 1: add difficulty 2 and 3.
- A city's sports slot is normally an Educació Física or heritage question (a traditional game, a
  local woman athlete); a club fact is at most the batch's one amber review question. A city's
  history slot is medieval, modern or contemporary; Ancient History is at most that one review
  question.
- For each slot, choose a block that fits the pool's subject and place: first a `below` block
  (fewer than 3 questions), then the block with the fewest questions. Avoid a `high` block (more
  than 9) while another block fits. If several blocks tie at the lowest count, pick one at random.
  Aim for at least 6 different blocks and never more than 2 questions from the same block.
- When every pool is at least 15 and every block at least 3, keep writing 10 questions: choose the
  lowest counts and break ties at random, so the game keeps growing in a balanced way.
- Spread the difficulties inside a pool: 1 is a direct recall, 2 applies or relates two sabers, 3
  is two steps or a less obvious application.

## 3. Write the questions

- Follow the data format and every rule of part 1: own words (never copy or adapt a source's text),
  a real, checkable `https` reference for each question, `lang`, `topics` (add a topic to its
  subject's file if one is missing), `difficulty`, `place`, the length limits, language and subject
  agreeing, Spanish words in braces inside Catalan and English texts.
- Anchor every question with the `curriculum` field: `{ "area": "...", "block": "..." }` from
  `docs/curriculum/cicle-superior.md`, and make the fact a canonical example or a direct
  application of that saber. The document's amber list is allowed only as the batch's one review
  question (see step 4).
- Add each question at the end of its subject's file in `questions/`. Never edit existing questions.
- Balance topics: before choosing a topic for a question, count how many questions of its subject use
  each topic (`questions/<subject>.json`), and prefer the least used one, so no topic (football in
  sports, for example) grows far ahead of the others. Add a new topic if none fits.
- Sports are not only football: also use basketball, tennis, athletics, cycling, swimming, handball,
  motorsport, winter sports and traditional sports. Football is at most about a third of a subject's
  sports questions; a new sport gets its own topic in `sports.json`.
  Choose the sports, events and sportspeople best known to Spanish children (for example Rafa Nadal,
  the Gasol brothers, Fernando Alonso, Miguel Induráin, Marc Márquez, Alexia Putellas, Carolina Marín,
  Mireia Belmonte, the national football team), not specialised ones.
- Maths has topics the bank barely covers. When the maths pool gets a slot, add and use these topics
  (each in `maths.json`) before the existing ones: `mcm-y-mcd` (least common multiple and greatest
  common divisor, with at least one gcd question), `estadistica-y-probabilidad` (mean, mode, charts,
  simple chance), `proporcionalidad` (rule of three, scales) and `medidas` (units, time, angles).
  Drop an item from this list once its topic has 2 questions. Negative numbers are not a cicle
  superior saber: do not add `numeros-enteros` as a target.
- A pool's Catalan share stays at or below a third, except the `catalan` pool, which is all Catalan.
- Place questions are only geography, history, sports or culture. General turns are maths, science,
  language, english, catalan and citizenship.

## 4. Check your own work

Fix or replace any question that fails, then check again:

- **Curriculum:** the question must have a valid `curriculum` area and block from
  `docs/curriculum/cicle-superior.md`, and apply that saber. Name it in the review table. "A child
  could know it from daily life" is not enough. A fact on the document's amber list (prehistory or
  Ancient History, the solar system or seasons, club sport, heraldry, artist biographies,
  irregular-verb lists) is allowed only as the batch's **one** review question, marked in the PR as
  review/general culture. The rest of the batch must be anchored, and no `high` block from
  `npm run curriculum` grows while another block fits. Too specialised inside a valid saber is also
  out, for example: the architect of the Guggenheim, the river that forms the ría de
  Bilbao with the Ibaizábal, the century of the Aljafería, a sierra named only by the provinces it
  separates. Facts like those were replaced in earlier reviews.
- **Fact:** re-read the fact against its reference. A fact you cannot confirm there is dropped.
  The scheduled cloud session usually cannot open web pages (its proxy answers 403). Then use the
  stable, well-known page you are sure of (a Wikipedia article under its exact title), and in the
  doubts say that none of the references could be opened.
- **Repeat:** read all the existing questions first. Do not ask the same fact, or nearly the same
  prompt, as one already in the bank.
  Also check the questions that were removed or rewritten in the past, which the bank no longer shows:
  run `git log -p --format= -- questions js/data-level-1.js | grep -E '^[-+] +"?prompt"?:' | sort -u` and
  read every prompt. A question the owner removed or replaced (for example for being too hard) must
  not come back, nor any question about the same fact.
- **Wrong options:** the three wrong options are plausible and clearly wrong, never a trick.

## 5. Build and test

Run `npm run build:questions`, then `npm test`. If either fails, fix it. After two failed
attempts, stop without opening a pull request and say what failed.

## 6. Open the pull request

- Branch `question-batch/YYYY-MM-DD` (today's date). One commit, "Add 10 questions: <pools>", also
  the PR title. Push the branch and open the PR with `gh pr create --base main`. Only
  `questions/*.json` and `js/questions.js` change.
- Commit messages and the PR are in English and never contain the owner's name; write "the owner".
  They never contain a Claude session link (`claude.ai/code/session_…`) or a `Claude-Session:` line: the
  repository is public.
- The description has, in this order: a one-line summary; the line
  `[Play this branch](https://htmlpreview.github.io/?https://github.com/icougil/Ayudante-de-Papa-Noel/blob/refs/pull/<number>/head/index.html)`
  added right after creating the PR, once its number is known; the pool counts before and after;
  the curriculum counts before and after for the blocks the batch touches; the review table; the
  doubts.
- **Review table:** only the 10 new questions, never the existing ones. One row each, with the columns
  id, language, pool, curriculum (`area/block`), difficulty, prompt, the four options with the right
  one marked, explanation, reference as a link. A row without a curriculum anchor is not ready.
- **Doubts:** under any question you are less sure about (an age doubt, a reference that only partly
  confirms the fact) add a line starting with ⚠️ saying why.

## Never

- Copy text from a source.
- Write a question without the `curriculum` field from `docs/curriculum/cicle-superior.md`.
- Include more than one question from the document's amber list in a batch, or include one without
  saying in the PR that it is the review/general-culture question.
- Touch any file other than `questions/*.json` and `js/questions.js`. A batch never edits a test: if
  a new question makes `npm test` fail for a reason other than the question itself being invalid,
  stop without opening a pull request and say which test failed, so the owner can fix the test first.
- Merge, push to `main`, or change these rules.
