// Sound: the tune as data, pure helpers and the remembered sound choice.
// Nothing here touches the Web Audio API.
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APN;
  }
})();
