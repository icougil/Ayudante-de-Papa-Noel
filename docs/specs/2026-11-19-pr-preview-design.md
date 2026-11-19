# Playable preview of each pull request — design

Date: 2026-11-19. Short design for a small change.

## Intent

Today a change can only be played from a local checkout or after merging, so a check on a real
phone (for example the sound on an iPhone) or a child trying a change both wait for the merge.
Every pull request should carry a link that plays its branch, so the owner can try it on a phone
before merging.

Points the owner did not decide are marked **(designer's call)**.

## Goals, non-goals, anti-goals

- Goal: every pull request description carries one link that plays the game from its branch, on
  any phone or computer, with nothing to install.
- Goal: the live site, its deploy job and its version stamp stay exactly as they are.
- Non-goal: a preview identical to the published site. The preview has no version stamp and
  loads the scripts differently; problems that only show on GitHub Pages are still found after
  the merge.
- Non-goal: previews of pull requests from forks.
- Anti-goal: a preview that counts as a visit in Umami or shares the live game's saved sound
  setting. (Both hold by construction: the preview runs on another address.)

## Approaches

1. **An htmlpreview.github.io link to the branch — chosen by the owner.** The service fetches the
   branch's files from GitHub and builds the page; tried on `main` on 2026-11-19 and the game
   loads and plays its first question. Nothing changes in the deploy or the Pages settings. It is
   a free service run by one person, not by GitHub; if it disappears, only previews are lost.
   GitHub's raw files can lag a push by up to about 5 minutes.
2. A `gh-pages` branch with `rossjrw/pr-preview-action`: previews identical to the site with the
   stamp and a comment updated on each push, but the live deploy moves to the new branch, the
   Pages source changes by hand, more workflow to maintain, and Umami would count preview plays.
   Rejected as more cost than the goal needs.

## Design

- Link format, with the branch name as is (slashes included):
  `https://htmlpreview.github.io/?https://github.com/icougil/Ayudante-de-Papa-Noel/blob/<branch>/index.html`
- The link points at the branch, not a commit, so one link stays valid across pushes
  **(designer's call)**. After a push, wait a few minutes or reload if the change is not there yet.
- Every pull request description has, right after its summary, the line
  `Play this branch: <link>` **(designer's call)**. The agent opening the PR adds it; no workflow
  posts it **(designer's call: no hand-written workflow, and the link never needs updating)**.
- The rule lives in the project's `CLAUDE.md`, new section `## Pull requests`:
  `- Every pull request description has, right after its summary, the line`
  `` `Play this branch: https://htmlpreview.github.io/?https://github.com/icougil/Ayudante-de-Papa-Noel/blob/<branch>/index.html` ``
  `  so the branch can be played on a phone before merging.`
- `README.md`, section `## Tests`, after the paragraph on publishing: a short paragraph saying a
  pull request can be played before merging through the `Play this branch` link in its
  description, built with htmlpreview.github.io, without the version stamp, and that GitHub may
  take a few minutes to serve a new push.
- `BACKLOG.md`: the item "Publish a playable preview of each pull request" is marked done with
  the decision (htmlpreview link in the description; `gh-pages` previews not adopted, kept as the
  fallback if the service goes away).

## Left to the builder

- The README paragraph's exact wording, within the points above.
- Its own pull request is the first to carry the link, which checks the format works.
