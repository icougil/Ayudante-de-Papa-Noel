## Language

- Code is in English: identifiers, file names, CSS classes, HTML ids, comments, test names,
  developer-facing error messages and the README.
- Spanish is the game's main language: everything the player reads is in Spanish (screen text,
  questions, explanations, city names), except the questions written in Catalan or English, whose
  prompt, options and explanation are in their own language.
  An English question's explanation glosses each key English word with its Spanish meaning in
  brackets, e.g. «Hot» ({caliente}). Braces mark Spanish words inside a Catalan or English
  prompt or explanation, so they are read as Spanish.
  Keep it in data and markup, apart from the logic, so other languages can be added later.
- Everything written to the repository is in English: commit messages, branch names, pull
  requests and issues.

## Documents

- Design specs go in `docs/specs/` and implementation plans in `docs/plans/` (not
  `docs/superpowers/`).

## Pull requests

- Every pull request description has, right after its summary, the Markdown link
  `[Play this branch](https://htmlpreview.github.io/?https://github.com/icougil/Ayudante-de-Papa-Noel/blob/refs/pull/<number>/head/index.html)`
  so the branch can be played on a phone before merging, and its last version stays playable
  after the merge; only the words show, not the address. Add it right after creating the PR,
  once its number is known.
