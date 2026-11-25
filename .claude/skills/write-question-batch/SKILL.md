---
name: write-question-batch
description: Use when a scheduled routine or the owner asks for a batch of 10 new questions for the game's question bank. Writes the questions, checks them, and opens a pull request for the owner to review.
---

# Write a batch of 10 questions

You add 10 new questions to the game's bank and open a pull request. The owner reads every
question before it reaches the game, so your job is to write good questions and make that review
fast. You never merge and never push to `main`.

The questions are for children aged 10 to 12 (5è and 6è of primary school in Catalonia). The data
format and rules are in `docs/specs/2026-11-18-question-bank-design.md` and `README.md` ("Adding a
question"). Read both first. The design of this job is `docs/specs/2026-11-24-question-batch-job-design.md`.

## 1. Guards (stop here if one applies)

- An open batch: run
  `gh api 'repos/icougil/Ayudante-de-Papa-Noel/pulls?state=open&per_page=100' --jq '[.[] | select(.head.ref | startswith("question-batch/"))] | length'`.
  (Not `gh pr list`: the scheduled cloud session blocks GitHub's GraphQL API, which it uses.)
  If it prints more than 0, stop and say "a batch is still open for review".
  If the command fails (for example `gh` is missing or not signed in), stop too and say "the guard could not be checked": never go on without it.
- Nothing to add: run `npm run pools`. If its last line says `Pools below 15: none`, stop and say so.

## 2. Choose the 10 slots

- Read the output of `npm run pools`. Each line is `pool  <questions it has now>  below|ok  ...`:
  the number is how many questions the pool **already has**, so the lowest numbers are the thinnest
  pools (15 is the target). Give the 10 slots to the pools furthest below 15, **at most 3
  per pool**, so a batch covers at least 4 pools.
- Near the end, fewer than 10 questions may be needed to bring every pool to 15. Then write only
  that many (N), never push a pool above 15, and use "Add N questions: <pools>" in step 6. The
  4-pool rule applies only when you write 10.
- For a city, fill its missing subjects first: sports in Santiago, Sevilla and Zaragoza; history in
  Barcelona, Bilbao and Madrid. City questions are almost all difficulty 1: add difficulty 2 and 3.
- Spread the difficulties inside a pool; look at what `npm run pools` shows for it.

## 3. Write the questions

- Follow the data format and every rule of part 1: own words (never copy or adapt a source's text),
  a real, checkable `https` reference for each question, `lang`, `topics` (add a topic to its
  subject's file if one is missing), `difficulty`, `place`, the length limits, language and subject
  agreeing, Spanish words in braces inside Catalan and English texts.
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
- A pool's Catalan share stays at or below a third, except the `catalan` pool, which is all Catalan.
- Place questions are only geography, history, sports or culture. General turns are maths, science,
  language, english and catalan.

## 4. Check your own work

Fix or replace any question that fails, then check again:

- **Age:** would a child in 5è or 6è know this from class or daily life? Too specialised, for
  example: the architect of the Guggenheim, the sierra between Madrid and Castilla y León, the river
  that forms the ría de Bilbao with the Ibaizábal, the century of the Aljafería. Those four were
  replaced in an earlier review.
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
  the PR title (N instead of 10 when fewer are needed). Push the branch and open the PR with
  `gh pr create --base main`. Only `questions/*.json` and `js/questions.js` change.
- Commit messages and the PR are in English and never contain the owner's name; write "the owner".
- The description has, in this order: a one-line summary; the line
  `[Play this branch](https://htmlpreview.github.io/?https://github.com/icougil/Ayudante-de-Papa-Noel/blob/refs/pull/<number>/head/index.html)`
  added right after creating the PR, once its number is known; the pool counts before and after;
  the review table; the doubts.
- **Review table:** only the 10 new questions, never the existing ones. One row each, with the columns
  id, language, pool, difficulty, prompt, the four options with the right one marked, explanation,
  reference as a link.
- **Doubts:** under any question you are less sure about (an age doubt, a reference that only partly
  confirms the fact) add a line starting with ⚠️ saying why.

## Never

- Copy text from a source.
- Touch any file other than `questions/*.json` and `js/questions.js`. A batch never edits a test: if
  a new question makes `npm test` fail for a reason other than the question itself being invalid,
  stop without opening a pull request and say which test failed, so the owner can fix the test first.
- Merge, push to `main`, or change these rules.
