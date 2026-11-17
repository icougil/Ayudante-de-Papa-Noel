// Sound: the tune as data, pure helpers, the remembered sound choice and the Web Audio engine
// (APN.sound), which js/ui.js notifies of each event.
(function () {
  const APN = (globalThis.APN = globalThis.APN || {});

  APN.SOUND_KEY = 'apn.sound';
  APN.MUSIC_BEAT_SECONDS = 0.24;
  APN.MUSIC_TURBO_BEAT_SECONDS = 0.2;
  APN.TAKE_OFF_SECONDS = 1.1;
  APN.TURBO_SOUND_DELAY_SECONDS = 0.5;

  APN.SOUND_NAMES = [
    'tap',
    'takeOff',
    'deliver',
    'express',
    'turbo',
    'arrive',
    'storm',
    'reindeer',
    'drop',
    'pass',
    'notPassed',
  ];

  // Notes as [name, beats]; 16 bars of 4 beats.
  APN.FLIGHT_TUNE = {
    beatsPerBar: 4,
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
  };

  const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  // Equal temperament, A4 = 440 Hz.
  APN.noteFrequency = function (name) {
    const match = /^([A-G])(\d)$/.exec(String(name));
    if (!match) throw new Error(`Unknown note: ${name}`);
    const midi = 12 * (Number(match[2]) + 1) + SEMITONES[match[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  // Flattens a tune into events sorted by beat: melody notes, bass notes (twice per bar, the
  // second a fifth higher) and one bell tick per beat.
  APN.tuneEvents = function (tune) {
    const events = [];
    let beat = 0;
    for (const [name, beats] of tune.melody) {
      events.push({ beat, voice: 'melody', frequency: APN.noteFrequency(name), beats, accent: false });
      beat += beats;
    }
    tune.bass.forEach((name, bar) => {
      const start = bar * tune.beatsPerBar;
      const frequency = APN.noteFrequency(name);
      events.push({ beat: start, voice: 'bass', frequency, beats: 1.6, accent: false });
      events.push({ beat: start + 2, voice: 'bass', frequency: frequency * 1.5, beats: 1.6, accent: false });
    });
    const totalBeats = tune.bass.length * tune.beatsPerBar;
    for (let i = 0; i < totalBeats; i += 1) {
      events.push({ beat: i, voice: 'bell', frequency: 0, beats: 0, accent: i % 2 === 0 });
    }
    events.sort((a, b) => a.beat - b.beat);
    return { totalBeats, events };
  };

  APN.loadSoundChoice = function (storage) {
    try {
      return storage.getItem(APN.SOUND_KEY) !== 'off';
    } catch (error) {
      return true;
    }
  };

  APN.saveSoundChoice = function (storage, on) {
    try {
      storage.setItem(APN.SOUND_KEY, on ? 'on' : 'off');
    } catch (error) {
      // A blocked storage only means the choice is not remembered.
    }
  };

  // ---- The sound engine: Web Audio, created on the first tap that needs it. ----

  const SCHEDULE_AHEAD_SECONDS = 0.2;
  // A note whose time passed more than this long ago (after a stall) is skipped, not played late.
  const LATE_NOTE_SECONDS = 0.05;
  const SCHEDULER_INTERVAL_MS = 25;
  const ATTACK_SECONDS = 0.015;
  const MELODY_SOUNDING = 0.92;
  const STOP_FADE_SECONDS = 0.01;
  const DISCONNECT_AFTER_MS = 80;
  const MUSIC_LEVEL = 0.25;
  const EFFECTS_LEVEL = 0.7;
  const BELL_TICK_HERTZ = 6500;
  const BELL_PARTIAL = 2.76;

  const tune = APN.tuneEvents(APN.FLIGHT_TUNE);
  const note = APN.noteFrequency;

  let on = true;
  let turbo = false;
  let context = null;
  let chain = null; // { master, effects, music }: gains of the current sound path
  let noiseBuffer = null;
  let run = null; // the music that plays or waits to start

  function storage() {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch (error) {
      return null;
    }
  }

  function pageHidden() {
    return typeof document !== 'undefined' && document.hidden === true;
  }

  function resume() {
    try {
      const promise = context.resume();
      if (promise && promise.catch) promise.catch(() => {});
    } catch (error) {
      // The browser keeps the sound blocked until a tap.
    }
  }

  function buildChain() {
    const master = context.createGain();
    const effects = context.createGain();
    const music = context.createGain();
    effects.gain.value = EFFECTS_LEVEL;
    music.gain.value = MUSIC_LEVEL;
    effects.connect(master);
    music.connect(master);
    master.connect(context.destination);
    return { master, effects, music };
  }

  // Creates the AudioContext and the sound path on first use; resumes the context if suspended.
  function ensureContext() {
    if (!context) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return false;
      context = new Context();
    }
    if (!chain) chain = buildChain();
    if (context.state !== 'running' && !pageHidden()) resume();
    return true;
  }

  // Fades a gain node to silence at once and cuts it off a moment later.
  function silence(gainNode) {
    try {
      const now = context.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setTargetAtTime(0, now, STOP_FADE_SECONDS);
      setTimeout(() => {
        try {
          gainNode.disconnect();
        } catch (error) {
          // Already disconnected.
        }
      }, DISCONNECT_AFTER_MS);
    } catch (error) {
      // Nothing to silence.
    }
  }

  // Reports a bug of the engine as a console warning; never throws, and says nothing without a console.
  function report(error) {
    try {
      globalThis.console.warn('APN.sound:', error);
    } catch (ignored) {
      // Nowhere to report to.
    }
  }

  function tone(out, { type, from, to = from, start, length, peak }) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const attack = Math.min(ATTACK_SECONDS, length / 3);
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + length);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(gain);
    gain.connect(out);
    osc.start(start);
    osc.stop(start + length + 0.02);
  }

  function noise(out, { filter, from, to = from, q = 1, start, length, peak }) {
    if (!noiseBuffer) {
      noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource();
    const band = context.createBiquadFilter();
    const gain = context.createGain();
    const attack = Math.min(ATTACK_SECONDS, length / 3);
    source.buffer = noiseBuffer;
    band.type = filter;
    band.Q.value = q;
    band.frequency.setValueAtTime(from, start);
    if (to !== from) band.frequency.exponentialRampToValueAtTime(to, start + length);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.linearRampToValueAtTime(0, start + length);
    source.connect(band);
    band.connect(gain);
    gain.connect(out);
    source.start(start);
    source.stop(start + length + 0.02);
  }

  // A sine note plus a quieter sine 2.76 times higher that lasts half as long.
  function bell(out, frequency, start, length, peak = 0.3) {
    tone(out, { type: 'sine', from: frequency, start, length, peak });
    tone(out, { type: 'sine', from: frequency * BELL_PARTIAL, start, length: length / 2, peak: peak / 2 });
  }

  // Notes one after another, `step` seconds apart, each `length` long.
  function playNotes(out, type, names, step, length, peak, start) {
    names.forEach((name, i) => {
      tone(out, { type, from: note(name), start: start + i * step, length, peak });
    });
  }

  const EFFECTS = {
    tap(out, t) {
      tone(out, { type: 'sine', from: note('G5'), start: t, length: 0.07, peak: 0.15 });
    },
    takeOff(out, t) {
      playNotes(out, 'square', ['G4', 'C5', 'E5', 'G5'], 0.1, 0.16, 0.12, t);
      noise(out, { filter: 'bandpass', from: 400, to: 4000, q: 2, start: t + 0.25, length: 0.7, peak: 0.3 });
      bell(out, note('C6'), t + 0.45, 0.8);
      bell(out, note('E6'), t + 0.45, 0.8);
    },
    deliver(out, t) {
      ['E5', 'G5', 'C6'].forEach((name, i) => bell(out, note(name), t + i * 0.09, 0.5));
    },
    express(out, t) {
      ['C6', 'E6', 'G6', 'C7'].forEach((name, i) => bell(out, note(name), t + i * 0.06, 0.45, 0.25));
      noise(out, { filter: 'highpass', from: 5000, to: 9000, start: t, length: 0.35, peak: 0.12 });
      bell(out, note('G6'), t + 0.34, 0.7, 0.25);
      bell(out, note('C7'), t + 0.34, 0.7, 0.25);
    },
    turbo(out, t) {
      tone(out, { type: 'sawtooth', from: 180, to: 1400, start: t, length: 0.7, peak: 0.15 });
      noise(out, { filter: 'bandpass', from: 400, to: 4000, q: 2, start: t, length: 0.8, peak: 0.3 });
    },
    arrive(out, t) {
      bell(out, note('G5'), t, 0.6);
      bell(out, note('C6'), t + 0.18, 0.9);
    },
    storm(out, t) {
      noise(out, { filter: 'bandpass', from: 300, to: 1400, q: 1.5, start: t, length: 1.6, peak: 0.45 });
      noise(out, { filter: 'bandpass', from: 1200, to: 350, q: 1.5, start: t + 0.5, length: 1.3, peak: 0.35 });
    },
    reindeer(out, t) {
      tone(out, { type: 'sawtooth', from: 233, to: 220, start: t, length: 0.2, peak: 0.18 });
      noise(out, { filter: 'bandpass', from: 466, to: 440, q: 8, start: t, length: 0.2, peak: 0.3 });
      tone(out, { type: 'sawtooth', from: 208, to: 165, start: t + 0.26, length: 0.42, peak: 0.18 });
      noise(out, { filter: 'bandpass', from: 416, to: 330, q: 8, start: t + 0.26, length: 0.42, peak: 0.3 });
    },
    drop(out, t) {
      tone(out, { type: 'sine', from: 1000, to: 160, start: t, length: 0.6, peak: 0.3 });
      tone(out, { type: 'sine', from: 90, to: 45, start: t + 0.62, length: 0.25, peak: 0.6 });
      noise(out, { filter: 'lowpass', from: 400, start: t + 0.62, length: 0.08, peak: 0.4 });
    },
    pass(out, t) {
      playNotes(out, 'square', ['C5', 'E5', 'G5'], 0.13, 0.2, 0.12, t);
      ['C5', 'E5', 'G5', 'C6'].forEach((name) => bell(out, note(name), t + 0.42, 1.2, 0.2));
    },
    notPassed(out, t) {
      playNotes(out, 'triangle', ['G4', 'E4', 'D4'], 0.28, 0.3, 0.25, t);
      tone(out, { type: 'triangle', from: note('G4'), start: t + 0.9, length: 0.7, peak: 0.25 });
    },
  };

  // ---- The music: a timer schedules the notes that start within the next 0.2 s. ----

  function beatSeconds() {
    return turbo ? APN.MUSIC_TURBO_BEAT_SECONDS : APN.MUSIC_BEAT_SECONDS;
  }

  function eventTime(music, event) {
    return music.anchorTime + (event.beat - music.anchorBeat) * music.beatSeconds;
  }

  function scheduleEvent(music, event, start) {
    const seconds = music.beatSeconds;
    if (event.voice === 'melody') {
      tone(music.gain, {
        type: 'triangle', from: event.frequency, start,
        length: event.beats * seconds * MELODY_SOUNDING, peak: 0.5,
      });
    } else if (event.voice === 'bass') {
      tone(music.gain, {
        type: 'sine', from: event.frequency, start, length: event.beats * seconds, peak: 0.6,
      });
    } else {
      tone(music.gain, {
        type: 'square', from: BELL_TICK_HERTZ, start, length: 0.02, peak: event.accent ? 0.12 : 0.06,
      });
    }
  }

  function tick(music) {
    try {
      const horizon = context.currentTime + SCHEDULE_AHEAD_SECONDS;
      for (;;) {
        const event = tune.events[music.next];
        const start = eventTime(music, event);
        if (start > horizon) break;
        try {
          if (start >= context.currentTime - LATE_NOTE_SECONDS) {
            scheduleEvent(music, event, Math.max(start, context.currentTime));
          }
        } catch (error) {
          // A failed note is skipped; the music goes on.
          report(error);
        }
        music.next += 1;
        if (music.next === tune.events.length) {
          music.next = 0;
          music.anchorBeat -= tune.totalBeats;
        }
      }
    } catch (error) {
      // The scheduler waits for the next tick.
      report(error);
    }
  }

  function stopRun() {
    if (!run) return;
    clearInterval(run.timer);
    if (context) silence(run.gain);
    run = null;
  }

  APN.sound = {
    isOn() {
      return on;
    },

    toggle() {
      try {
        on = !on;
        const store = storage();
        if (store) APN.saveSoundChoice(store, on);
        if (on) {
          ensureContext();
        } else {
          stopRun();
          if (chain) {
            silence(chain.master);
            chain = null;
          }
        }
      } catch (error) {
        // The switch still flips for the visit.
        report(error);
      }
      return on;
    },

    play(name, delaySeconds = 0) {
      try {
        if (!on || !APN.SOUND_NAMES.includes(name) || !ensureContext()) return;
        EFFECTS[name](chain.effects, context.currentTime + delaySeconds);
      } catch (error) {
        // No sound is better than a broken game.
        report(error);
      }
    },

    startMusic(delaySeconds = 0) {
      try {
        stopRun();
        if (!on || !ensureContext()) return;
        const gain = context.createGain();
        gain.connect(chain.music);
        const music = {
          gain,
          next: 0,
          anchorBeat: 0,
          anchorTime: context.currentTime + delaySeconds,
          beatSeconds: beatSeconds(),
          timer: null,
        };
        run = music;
        music.timer = setInterval(() => tick(music), SCHEDULER_INTERVAL_MS);
        tick(music);
      } catch (error) {
        run = null;
        report(error);
      }
    },

    stopMusic() {
      try {
        stopRun();
      } catch (error) {
        run = null;
        report(error);
      }
    },

    setTurbo(value) {
      try {
        turbo = Boolean(value);
        if (run && run.beatSeconds !== beatSeconds()) {
          // The notes already scheduled stay where they are: the next unscheduled event keeps
          // its time and the new speed counts from there.
          const next = tune.events[run.next];
          run.anchorTime = eventTime(run, next);
          run.anchorBeat = next.beat;
          run.beatSeconds = beatSeconds();
        }
      } catch (error) {
        // The speed is still remembered.
        report(error);
      }
    },

    state() {
      let contextState = 'none';
      if (context) contextState = context.state === 'interrupted' ? 'suspended' : context.state;
      return { on, music: run !== null, turbo, context: contextState };
    },
  };

  const savedStore = storage();
  if (savedStore) on = APN.loadSoundChoice(savedStore);

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (!context) return;
      try {
        if (pageHidden()) {
          const promise = context.suspend();
          if (promise && promise.catch) promise.catch(() => {});
        } else if (on) {
          resume();
        }
      } catch (error) {
        // Nothing to suspend or resume.
      }
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APN;
  }
})();
