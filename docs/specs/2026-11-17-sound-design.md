# Music and sound effects — design

Date: 2026-11-17. Approved by the owner in conversation on the same day.

## Intent

The game is silent and feels flat. It gets background music while Santa flies and a sound for
each event of a game, so the trip feels like an adventure. The player can silence everything with
one tap, and the choice is remembered.

The owner listened to a throwaway test page during the design conversation and decided by ear:
sounds generated in the browser, the Jingle Bells chorus as flight music, its speed, and a silent
cover with a take-off sound. Points the owner did not decide are marked **(designer's call)**.

## Goals, non-goals, anti-goals

- Goal: music during the trip, and a distinct sound for: starting a game, a tap on an answer, a
  delivery, an express delivery, turbo, arriving at a city, each of the three mishaps, and the
  result (passed and not passed).
- Goal: the music speeds up while Santa flies in turbo **(designer's call)**.
- Goal: one switch silences music and effects together **(designer's call)**; its state is
  remembered between visits; sound is on the first time **(designer's call)**.
- Goal: no sound files and no dependency: everything is generated with the Web Audio API, so the
  game still works offline and by opening `index.html` from disk.
- Non-goal: music on the cover (the owner tried a "tap to enter" cover and a cover tune and chose
  the silent cover), a volume control, separate switches for music and effects, recorded sounds,
  a different tune per level.
- Anti-goal: a sound that scolds. A wrong answer is a funny mishap, and a level that is not
  passed sounds gentle and hopeful, never like a "game over".
- Anti-goal: the game failing or showing an error where sound is unavailable or blocked. Without
  sound the game plays exactly as it does today.
- Anti-goal: music that keeps playing when the player has left the page (tab in the background,
  phone locked).

## Ways of building it that were considered

1. **A separate file, `js/sound.js`, that the screen code only notifies (chosen).** It holds the
   tunes as data, the effects, the switch state and the remembered choice. `js/ui.js` says what
   happened ("delivered", "turbo leg started") and never touches the Web Audio API. The pure
   parts (note frequencies, tune lengths, the remembered choice) are unit-tested.
2. **Everything inside `js/ui.js`.** Quicker to start, but that file is 470 lines and would grow
   by about half with code that cannot be tested apart from the page.
3. **A sound library from a CDN (Tone.js, Howler).** Breaks playing offline and from `file://`,
   and adds a dependency to a game that has none.

The owner left the choice of how to build it to the designer; option 1 is the designer's call.

Recorded files were set aside earlier in the conversation, by the owner: they sound richer but
each needs a usable licence and they add megabytes to a repository that has no assets.

## What the player hears

| Moment (where in `js/ui.js`) | Sound |
|---|---|
| Tap on "¡A repartir!" or on the result screen's button (`startGame`) | `takeOff`, and the flight music comes in 1.1 s later |
| Tap on an answer (`onAnswer`) or on "Seguir" (`onNext`) | `tap` **(designer's call)** |
| A leg starts (`startLeg`) | the music plays at the turbo speed if the leg is a turbo leg (`turboNext`), at the normal speed otherwise |
| Santa reaches the city before an answer (`advance`, `flying` → `circling`) | `arrive` |
| A gift is delivered (`deliver`) | `express` if the delivery is express, `deliver` otherwise |
| The delivery earns turbo (`deliver`, `r.turbo`) | `turbo`, 0.5 s after the delivery sound |
| A mishap (`fail`) | `storm`, `reindeer` or `drop`, matching the mishap's `id` |
| The result screen (`showResult`) | the music stops; `pass` if the level is passed, `notPassed` otherwise |

- The flight music is the chorus of Jingle Bells (James Pierpont, 1857, public domain), looping.
  It keeps playing while the player reads the explanation of a wrong answer.
- Normal speed: one beat every 0.24 s (the owner's choice, "Más rápida" on the test page). Turbo
  speed: one beat every 0.20 s. A change of speed applies from the next note, without restarting
  the tune.
- The music is quieter than the effects, so an effect is always heard over it.
- `reindeer` is a comic nose-blow (two honks), not a sneeze. The owner was not convinced by any
  of the four sneezes tried; this one is a placeholder to be revisited after playing the game.
- When the page is hidden (`visibilitychange`), all sound is suspended; it resumes where it was
  when the page is visible again.

## The switch

```
 Regalos entregados: 3 🎁🎁🎁   ⚡ 2    Ciudad 4/6: Sevilla   [🔊]
 ┌───────────────────────────────────────────────────────┐
 │                                                  🌙   │
 │            🎅🦌🦌 ~~~>                                 │
```

- A button showing `🔊` when sound is on and `🔇` when it is off, with a tappable area of at
  least 44 by 44 CSS pixels. It is on all three screens: on the trip at the right end of the
  scoreboard, shaped like a score pill and as tall as one (its tappable area is extended with a
  transparent pseudo-element); on the cover and the result screen a round 44 by 44 button in
  the top-right corner of the screen, 8 pixels from the top and from the right.
- It is a real `<button>` outside the `aria-hidden` scene, with `aria-pressed` (`true` when sound
  is on) and a fixed `aria-label` `Sonido`: the state is told by `aria-pressed` only, so a
  screen reader never hears a name that contradicts the state.
- Tapping it while sound is on silences music and effects within 0.1 s. Tapping it while sound
  is off turns sound on; on the trip screen the music starts again from the beginning of the
  tune, at the speed of the current leg. On the cover and the result screen nothing plays.
- The choice is kept in `localStorage` under the key `apn.sound` with the value `on` or `off`. A
  missing or unreadable value means on. If `localStorage` cannot be used (private browsing, some
  browsers on `file://`), the switch still works for the visit and nothing is reported.
- The button must not make the page scroll or make the scoreboard taller on a 360-pixel-wide
  phone, and must not cover the scoreboard pills, the scene's sleigh, the question or the
  answers.

## How it is built

`js/sound.js`, loaded after `js/game-logic.js` and before `js/ui.js`, adds to `APN`:

- Pure data and helpers, usable under Node for the unit tests:
  - `APN.SOUND_KEY = 'apn.sound'`, `APN.MUSIC_BEAT_SECONDS = 0.24`,
    `APN.MUSIC_TURBO_BEAT_SECONDS = 0.20`.
  - `APN.FLIGHT_TUNE = { beatsPerBar, melody, bass }` (below).
  - `APN.noteFrequency(name)`: the frequency in Hz of a note such as `'E5'` in equal temperament
    with `A4` = 440 Hz (`'C4'` is 261.63 Hz).
  - `APN.loadSoundChoice(storage)` returns `true` or `false`; `APN.saveSoundChoice(storage, on)`.
    Both swallow any error thrown by `storage`.
- `APN.sound`, the object `js/ui.js` talks to:
  - `isOn()`, `toggle()` (returns the new state and saves it).
  - `play(name)` with `name` one of `tap`, `takeOff`, `deliver`, `express`, `turbo`, `arrive`,
    `storm`, `reindeer`, `drop`, `pass`, `notPassed`. An optional second argument delays it by
    that many seconds.
  - `startMusic(delaySeconds)`, `stopMusic()`, `setTurbo(on)`.
  - Every method is safe to call at any time: it does nothing when sound is off, when the browser
    has no `AudioContext`, or before the first tap. None of them throws.

`js/ui.js` always calls these as `APN.sound.<method>(...)` at the moment of the event, never
through a stored reference to a method, so a browser test can replace them to record the calls.

The `AudioContext` is created, and resumed if suspended, inside the first tap that needs it (the
start button or the switch); browsers refuse sound before a tap.

The music is scheduled a little ahead, note by note: a timer every 25 ms schedules the notes that
start within the next 0.2 s. That is what lets the speed change from the next note and the music
stop at once. The test page scheduled a whole loop at a time, which can do neither.

### The tune

Notes as `[name, beats]`; 16 bars of 4 beats. The bass plays one note per bar on beat 1 (1.6
beats long) and the same note a fifth higher (frequency × 1.5) on beat 3. A quiet, very short
high tick on every beat, louder on the odd beats, stands for the sleigh bells.

```js
melody: [
  ['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['E5', 1], ['E5', 2],
  ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', 0.5], ['E5', 4],
  ['F5', 1], ['F5', 1], ['F5', 1.5], ['F5', 0.5], ['F5', 1], ['E5', 1], ['E5', 1], ['E5', 0.5], ['E5', 0.5],
  ['E5', 1], ['D5', 1], ['D5', 1], ['E5', 1], ['D5', 2], ['G5', 2],
  ['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['E5', 1], ['E5', 2],
  ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', 0.5], ['E5', 4],
  ['F5', 1], ['F5', 1], ['F5', 1.5], ['F5', 0.5], ['F5', 1], ['E5', 1], ['E5', 1], ['E5', 0.5], ['E5', 0.5],
  ['G5', 1], ['G5', 1], ['F5', 1], ['D5', 1], ['C5', 4],
],
bass: ['C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'D3', 'G3', 'C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'G3', 'C3'],
```

Melody: triangle wave. Bass: sine wave. Each note has a 15 ms attack and fades to silence over
its length; a melody note sounds for 92 % of its length so repeated notes stay separate.

### The effects

These are the recipes the owner heard. "Bell" is a sine note plus a quieter sine 2.76 times
higher that lasts half as long. "Noise" is filtered white noise. Times are seconds from the start
of the effect; `a → b` is a glide in pitch.

| Name | Recipe |
|---|---|
| `tap` | sine G5, 0.07 s, quiet |
| `takeOff` | square notes G4, C5, E5, G5, one every 0.1 s (0.16 s each); band-pass noise rising 400 → 4000 Hz from 0.25 s for 0.7 s; bells C6 and E6 at 0.45 s for 0.8 s |
| `deliver` | bells E5, G5, C6, one every 0.09 s, 0.5 s each |
| `express` | bells C6, E6, G6, C7, one every 0.06 s, 0.45 s each; high-pass noise 5000 → 9000 Hz for 0.35 s; bells G6 and C7 together at 0.34 s for 0.7 s |
| `turbo` | sawtooth 180 → 1400 Hz over 0.7 s; band-pass noise 400 → 4000 Hz over 0.8 s |
| `arrive` | bell G5 for 0.6 s; bell C6 at 0.18 s for 0.9 s |
| `storm` | band-pass noise 300 → 1400 Hz over 1.6 s; a second one 1200 → 350 Hz from 0.5 s for 1.3 s |
| `reindeer` | sawtooth 233 → 220 Hz for 0.2 s; sawtooth 208 → 165 Hz at 0.26 s for 0.42 s; each with narrow band-pass noise at about twice its pitch |
| `drop` | sine 1000 → 160 Hz over 0.6 s; at 0.62 s a thud: sine 90 → 45 Hz for 0.25 s with a short burst of low-pass noise |
| `pass` | square notes C5, E5, G5, one every 0.13 s (0.2 s each); at 0.42 s bells C5, E5, G5, C6 together for 1.2 s |
| `notPassed` | soft triangle notes G4, E4, D4, one every 0.28 s (0.3 s each); G4 at 0.9 s for 0.7 s |

## Tests

- Unit (`tests/sound.test.js`, Node): `noteFrequency` for `A4`, `C4` and `E5`; the melody of
  `APN.FLIGHT_TUNE` adds up to exactly `bass.length × beatsPerBar` beats and every note name is
  valid; `loadSoundChoice` returns on for a missing, an unknown and a throwing storage, and off
  only for `off`; `saveSoundChoice` writes `on` or `off` and swallows a throwing storage;
  requiring `js/sound.js` under Node (no `AudioContext`, no `window`) does not throw, and every
  method of `APN.sound` can be called there without throwing.
- Browser (Playwright, desktop and phone): the switch is on every screen, toggles `🔊` and `🔇`
  and `aria-pressed` while `aria-label` stays `Sonido`; the choice survives a reload; a whole game with the calls to
  `APN.sound` recorded shows the sounds of the table above for a right answer, an express
  delivery, a wrong answer, an arrival without an answer, turbo and both results; a whole game
  with sound on and one with sound off raise no page error; the page does not scroll and the
  scoreboard is no taller because of the switch, at 360 and at 1280 pixels wide.
- By ear, by the owner, on a computer and on a real phone: no test can tell whether it sounds
  good.

## Known limits

- On an iPhone the ring/silent switch on the side silences the game. That is the phone's
  behaviour for web pages and is left as it is.
- A browser may keep sound blocked until the first tap even when the switch shows `🔊`; the
  first sound is the take-off, which follows a tap, so the player does not notice.

## Documents that change with this

- `BACKLOG.md`: the "Sound" item is ticked, and a new item is added under "Noted during
  development" to revisit the `reindeer` sound.
- `README.md` and the main design (`docs/specs/2026-11-15-ayudante-de-papa-noel-design.md`, which
  lists sound as out of scope): updated wherever they describe the game as silent.

## Left to the builder

- What happens if the switch is tapped during the 1.1 s between the take-off and the music: any
  behaviour is fine as long as off means silence and on, during the trip, means music.

- The exact loudness of each sound, within "effects are heard over the music".
- The look of the switch (colours, border), in the style of the existing buttons.
- How the browser tests record the calls to `APN.sound`.
