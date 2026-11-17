const test = require('node:test');
const assert = require('node:assert/strict');
const APN = require('../js/sound.js');

test('noteFrequency gives 440 for A4, 261.63 for C4 and 659.26 for E5', () => {
  assert.ok(Math.abs(APN.noteFrequency('A4') - 440) < 0.01);
  assert.ok(Math.abs(APN.noteFrequency('C4') - 261.63) < 0.01);
  assert.ok(Math.abs(APN.noteFrequency('E5') - 659.26) < 0.01);
});

test('noteFrequency rejects a name that is not a note', () => {
  for (const name of ['H4', 'E', '']) {
    assert.throws(() => APN.noteFrequency(name), { message: `Unknown note: ${name}` });
  }
});

test('the flight melody fills its 16 bars exactly', () => {
  const tune = APN.FLIGHT_TUNE;
  const sum = tune.melody.reduce((total, note) => total + note[1], 0);
  assert.equal(tune.bass.length, 16);
  assert.equal(sum, tune.bass.length * tune.beatsPerBar);
  assert.equal(sum, 64);
});

test('every note of the flight tune has a valid name', () => {
  for (const [name] of APN.FLIGHT_TUNE.melody) assert.doesNotThrow(() => APN.noteFrequency(name));
  for (const name of APN.FLIGHT_TUNE.bass) assert.doesNotThrow(() => APN.noteFrequency(name));
});

test('tuneEvents lists 51 melody notes, 32 bass notes and 64 bells in beat order', () => {
  const { totalBeats, events } = APN.tuneEvents(APN.FLIGHT_TUNE);
  const count = (voice) => events.filter((e) => e.voice === voice).length;
  assert.equal(totalBeats, 64);
  assert.equal(count('melody'), 51);
  assert.equal(count('bass'), 32);
  assert.equal(count('bell'), 64);
  for (let i = 1; i < events.length; i += 1) {
    assert.ok(events[i].beat >= events[i - 1].beat);
  }
  const bells = events.filter((e) => e.voice === 'bell');
  assert.ok(bells.every((e) => e.beats === 0));
  assert.ok(bells.every((e) => e.accent === (e.beat % 2 === 0)));
});

test('tuneEvents places the bass on beats 1 and 3 of each bar, the second a fifth higher', () => {
  const { events } = APN.tuneEvents(APN.FLIGHT_TUNE);
  const bass = events.filter((e) => e.voice === 'bass' && e.beat < 4);
  assert.equal(bass.length, 2);
  assert.equal(bass[0].beat, 0);
  assert.equal(bass[0].frequency, APN.noteFrequency('C3'));
  assert.equal(bass[0].beats, 1.6);
  assert.equal(bass[1].beat, 2);
  assert.equal(bass[1].frequency, APN.noteFrequency('C3') * 1.5);
  assert.equal(bass[1].beats, 1.6);
});

test('the sound choice is on unless the stored value is off', () => {
  const store = (value) => ({ getItem: () => value });
  assert.equal(APN.loadSoundChoice(store(null)), true);
  assert.equal(APN.loadSoundChoice(store('on')), true);
  assert.equal(APN.loadSoundChoice(store('banana')), true);
  assert.equal(
    APN.loadSoundChoice({
      getItem: () => {
        throw new Error('blocked');
      },
    }),
    true,
  );
  assert.equal(APN.loadSoundChoice(store('off')), false);
});

test('saving the sound choice writes on or off under apn.sound', () => {
  const written = [];
  const storage = { setItem: (key, value) => written.push([key, value]) };
  APN.saveSoundChoice(storage, true);
  APN.saveSoundChoice(storage, false);
  assert.deepEqual(written, [
    ['apn.sound', 'on'],
    ['apn.sound', 'off'],
  ]);
});

test('under Node the sound object reports sound on, no music and no context', () => {
  assert.deepEqual(APN.sound.state(), { on: true, music: false, turbo: false, context: 'none' });
});

test('under Node every method of the sound object can be called without throwing', () => {
  assert.doesNotThrow(() => {
    for (const name of APN.SOUND_NAMES) APN.sound.play(name);
    APN.sound.play('nope');
    APN.sound.startMusic(0);
    APN.sound.setTurbo(true);
    APN.sound.stopMusic();
    APN.sound.toggle();
    APN.sound.toggle();
  });
  APN.sound.setTurbo(false);
  assert.equal(APN.sound.isOn(), true);
});

test('setTurbo is remembered while no music plays', () => {
  APN.sound.setTurbo(true);
  assert.equal(APN.sound.state().turbo, true);
  APN.sound.setTurbo(false);
  assert.equal(APN.sound.state().turbo, false);
});

test('saving the sound choice ignores a storage that throws', () => {
  const storage = {
    setItem: () => {
      throw new Error('blocked');
    },
  };
  assert.doesNotThrow(() => APN.saveSoundChoice(storage, true));
});
