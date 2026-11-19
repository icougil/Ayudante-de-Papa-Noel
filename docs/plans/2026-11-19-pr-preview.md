# Playable preview of each pull request Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every pull request description carries a link that plays the game from its branch.

**Architecture:** documentation only. The link is built by htmlpreview.github.io from the branch's
files on GitHub; a rule in the project `CLAUDE.md` makes the agent opening a PR add it. No game
code, workflow or Pages setting changes.

**Tech Stack:** Markdown.

**Spec:** `docs/specs/2026-11-19-pr-preview-design.md`

## Global Constraints

- Everything written to the repository is in English.
- Link format, verbatim:
  `https://htmlpreview.github.io/?https://github.com/icougil/Ayudante-de-Papa-Noel/blob/refs/pull/<number>/head/index.html`
- PR line, verbatim: `[Play this branch](<link>)` (a Markdown link: only the words show), right after the PR summary.
- `.github/workflows/ci.yml`, `index.html`, `js/`, `css/` and the Pages settings are not touched.

## Review Focus

- A merged pull request whose branch was deleted: its link still plays its last push (tried on
  PR #7).
- A push followed by an immediate reload: may show the previous version for a few minutes; the
  README says so.
- Existing tests stay green (no code changed): `node --test tests/*.test.js`.

---

### Task 1: The preview rule, its README paragraph and the backlog entry

**Files:**
- Modify: `CLAUDE.md` (new section `## Pull requests` at the end)
- Modify: `README.md` (section `## Tests`, after the paragraph on publishing to GitHub Pages)
- Modify: `BACKLOG.md` (item "Publish a playable preview of each pull request.")

- [ ] **Step 1: Add the rule to `CLAUDE.md`**, exactly:

```markdown
## Pull requests

- Every pull request description has, right after its summary, the Markdown link
  `[Play this branch](https://htmlpreview.github.io/?https://github.com/icougil/Ayudante-de-Papa-Noel/blob/refs/pull/<number>/head/index.html)`
  so the branch can be played on a phone before merging, and its last version stays playable
  after the merge; only the words show, not the address. Add it right after creating the PR,
  once its number is known.
```

- [ ] **Step 2: Add the README paragraph.** It says: a pull request can be played before merging
  through the `Play this branch` link in its description; the link uses htmlpreview.github.io,
  which loads the branch's files from GitHub; that copy has no version stamp; after a push,
  GitHub may take a few minutes to serve the new files.

- [ ] **Step 3: Mark the backlog item done** (`- [x]`) and replace its "Needs deciding" part with
  the decision: an htmlpreview.github.io link to the branch in each PR description (rule in
  `CLAUDE.md`); previews from a `gh-pages` branch with `rossjrw/pr-preview-action` not adopted,
  kept as the fallback if the service goes away.

- [ ] **Step 4: Run the unit tests.** Run: `node --test tests/*.test.js` — Expected: all pass.

- [ ] **Step 5: Commit** (after the owner approves the commit proposal):
  `CLAUDE.md`, `README.md`, `BACKLOG.md`, the spec and this plan.

- [ ] **Step 6: Open the PR with its own `Play this branch` line** and load that link in a browser:
  the cover shows `¡A repartir!` and pressing it shows the first city's question.
