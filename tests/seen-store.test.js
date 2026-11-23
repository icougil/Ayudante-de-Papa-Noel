const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/data-level-1.js');
require('../js/questions.js');
const APN = require('../js/game-logic.js');

const bank = [{ id: 'a' }, { id: 'b' }, { id: 'real-id' }];

function fakeStorage(initial) {
  const data = initial === undefined ? {} : { [APN.SEEN_KEY]: initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = value; },
  };
}

const throwing = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
};

test('the seen list is stored under apn.seenQuestions', () => {
  assert.equal(APN.SEEN_KEY, 'apn.seenQuestions');
});

test('loadSeen reads an empty list when nothing is stored', () => {
  assert.deepEqual(APN.loadSeen(fakeStorage(), bank), []);
});

test('loadSeen reads an empty list when the stored value is not JSON', () => {
  assert.deepEqual(APN.loadSeen(fakeStorage('{oops'), bank), []);
});

test('loadSeen reads an empty list when the stored value is JSON but not an array', () => {
  assert.deepEqual(APN.loadSeen(fakeStorage('{"a":1}'), bank), []);
});

test('loadSeen reads an empty list when storage is null', () => {
  assert.deepEqual(APN.loadSeen(null, bank), []);
});

test('loadSeen keeps only strings and drops ids that are not in the bank', () => {
  const stored = JSON.stringify(['real-id', 3, 'gone-id']);
  assert.deepEqual(APN.loadSeen(fakeStorage(stored), bank), ['real-id']);
});

test('recordSeen adds an id at the end', () => {
  const storage = fakeStorage(JSON.stringify(['a']));
  APN.recordSeen(storage, 'b');
  assert.deepEqual(JSON.parse(storage.data[APN.SEEN_KEY]), ['a', 'b']);
});

test('recordSeen moves a recorded id to the end', () => {
  const storage = fakeStorage(JSON.stringify(['a', 'b']));
  APN.recordSeen(storage, 'a');
  assert.deepEqual(JSON.parse(storage.data[APN.SEEN_KEY]), ['b', 'a']);
});

test('recordSeen does not duplicate an id', () => {
  const storage = fakeStorage();
  APN.recordSeen(storage, 'a');
  APN.recordSeen(storage, 'a');
  assert.deepEqual(JSON.parse(storage.data[APN.SEEN_KEY]), ['a']);
});

test('recordSeen starts a new list when the stored value is corrupt', () => {
  const storage = fakeStorage('{oops');
  APN.recordSeen(storage, 'a');
  assert.deepEqual(JSON.parse(storage.data[APN.SEEN_KEY]), ['a']);
});

test('loadSeen and recordSeen do not throw when storage throws', () => {
  assert.deepEqual(APN.loadSeen(throwing, bank), []);
  assert.doesNotThrow(() => APN.recordSeen(throwing, 'a'));
  assert.doesNotThrow(() => APN.recordSeen(null, 'a'));
});
