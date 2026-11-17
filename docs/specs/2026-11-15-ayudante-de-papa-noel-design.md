# Ayudante de Papá Noel (Santa's Helper) — design

Date: 2026-11-15 · Status: agreed

## What it is for

A web game for children aged 10 to 12 (the last years of primary school in Spain) to play and
learn at the same time: the player helps Santa deliver gifts around the world by answering
questions. Later on, children of other ages, and playing with a friend.

## Goals

- Watch Santa move non-stop across a pretty, fun scene, from city to city.
- On the way to each city a question comes up. Right answer: he delivers the gift as he flies
  over. Wrong answer: he suffers a mishap and loses that gift.
- Several levels; passing them upgrades Santa.
- Mixed questions: about the place he visits (capital, rivers, history, sports, customs) and
  general ones (maths, science, language, English), even if unrelated to the trip.
- Simple to understand, to build in iterations and to publish on GitHub Pages.

## Out of scope (for now)

- User accounts, server, database, online play between two devices.
- The player steering the sleigh (action mini-games): possible later.

## What would make the game fail even if it works

- Feeling like homework in disguise: the adventure leads, the questions are part of it.
- A wrong answer being frustrating: a wrong answer is a funny mishap that teaches the right
  answer, never a punishment or an abrupt "game over".
- Questions with a doubtful or wrong answer. Every question has a single indisputable answer
  (example to avoid: "the longest river in Catalonia" without saying whether the Ebro counts).

## Ways of building it that were considered

1. **Plain HTML, CSS and JavaScript (chosen).** No installation or build: open `index.html` and it
   works; GitHub Pages publishes it as is. Drawings with emojis, SVG and CSS animations. Limit:
   very elaborate animations cost more. It is what the owner asked for ("HTML, simple").
2. **A game engine (Phaser) on canvas.** Ideal if the player steered the sleigh; for a trip with
   stops it is more weight and complexity than needed.
3. **A framework with a build step (React + Vite).** Convenient for large apps; here it adds
   installation, a build and a more complicated deployment for nothing in return.

## How to play (version 1)

Screens: **Start** → **Level map** → **Trip** → **Level result**.

Music and sound effects: see `2026-11-17-sound-design.md`.

```
 🌙        ⭐      🎅🦌🦌 ~~~>      ⭐
 ______🏠____🏠🏠______🗼______🏠____   ← the scenery scrolls non-stop
 Regalos entregados: 🎁🎁🎁  ⚡ 2   Ciudad 4/6: París
 ┌─────────────────────────────────┐
 │ ¿Cuál es la capital de Francia? │
 │  [Lyon] [París] [Niza] [Tours]  │
 └─────────────────────────────────┘
```

- A level is **6 cities**, one question per city, **4 options**.
- **Santa never stops** (decided by the owner on 2026-11-15, instead of "stops"): the scenery scrolls
  non-stop and the question appears in mid-flight, on the way to the next city. The flight to the
  city takes 20 seconds (14 with turbo).
- **Thinking never loses the gift:** if he reaches the city with no answer, Santa circles over the
  rooftops until the player answers. There is no countdown that causes a wrong answer.
- **Right answer before arriving:** the gift drops down the chimney as he flies over, without
  slowing down, +1 gift delivered, and it counts as an **express delivery** ⚡ (the reward for
  being quick).
- **Right answer while circling:** +1 gift delivered, no express.
- **3 right answers in a row:** "turbo" (the sleigh flies faster, with a trail of stars, towards
  the next city).
- **Wrong answer:** a random mishap in mid-flight (snowstorm, a reindeer with a cold, the gift
  falls off the sleigh), that gift is not delivered, and the right answer is shown with a
  one-sentence explanation. The scenery keeps moving while the player reads.
- Later on, a possible "hard mode": answer before arriving or Santa flies past.
- **End of level:** passed with **3 or more** gifts delivered. Stars: 3, 4, 5 or 6 gifts earn 1, 2,
  3 or 4 stars; the fifth needs all 6 deliveries express (see `2026-11-16-five-stars-design.md`).
  With fewer than 3: "A Papá Noel le han faltado regalos. ¡Inténtalo otra vez!" and the level is
  repeated.
- **Upgrade:** each level passed adds a reindeer to the sleigh (visible in the scene).
- Passing a level unlocks the next one. A level already passed can be replayed to improve the
  stars.
- Progress (levels passed and stars) is saved in the browser of that device.

### Initial levels

| Level | Route | Stops |
|-------|-------|-------|
| 1 | Spain | Barcelona, Zaragoza, Madrid, Sevilla, Santiago de Compostela, Bilbao |
| 2 | Europe | Lisbon, Paris, London, Berlin, Rome, Athens |
| 3 | The world | New York, Rio de Janeiro, Cairo, Tokyo, Sydney, North Pole |

### Questions

- In each level: 3 questions about the place of the stop and 3 general ones, alternated and picked
  at random from the bank, never repeated within a game.
- Initial bank: at least **3 questions per stop** and **12 general ones per level** (maths,
  science, language, English), so that replaying a level is not the same.
- At English-speaking stops (London, New York, Sydney) the questions about the place may be in
  English.
- Each question stores: identifier, age range (minimum and maximum), subject, place (or
  "general"), prompt, 4 options, which one is correct, one-sentence explanation.
- Version 1 only has questions for the 10–12 age range. The range is in the data so that choosing
  an age later on only means adding questions.
- Language of the game: Spanish.

## Constraints

- No dependencies or build step; it must work by double-clicking `index.html` and on GitHub
  Pages.
- No external images: emojis, SVG and CSS.
- It must look and handle well on desktop, tablet and phone.
- Questions live in data files apart from the game code, so that questions can be added without
  touching the game.

## Iterations

1. **One playable level** (Spain): start, trip, questions, right answers, mishaps, result.
   Published on GitHub Pages.
2. **All three levels**, level map, stars, reindeer and saved progress.
3. **Choosing the age** at the start, and question banks for other age ranges.
4. **Two players on the same device**: taking turns, two sleighs racing.
5. Ideas for later: action mini-games, online play.

Each iteration is designed and planned separately; this document details 1 and 2.

## Left to whoever builds it

- File structure and names.
- The actual drawing of the scene, of each stop (one recognisable landmark per city) and of the
  animations.
- The text of the questions. The owner reviews them before publishing.
- Tests: the logic (question picking, scoring, stars, unlocking) with automated tests and no
  dependencies; what is visible, checked in a real browser.

## Decisions made by Claude (not explicitly agreed)

Everything under "How to play" except the general idea and the non-stop flight with no time
penalty: 6 cities, 4 options, 20 seconds of flight, the express delivery as the reward for speed,
stars, turbo at 3 in a row, one reindeer per level, the routes of the three levels, the size of
the bank, saving progress in the browser, Spanish, and the order of the iterations. The pass mark
of 3 gifts and the five stars were decided by the owner (see `2026-11-16-five-stars-design.md`).
