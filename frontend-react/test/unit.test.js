import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, compactTimeRange, calculateDuration, statusClass } from '../src/utils/format.js';
import { toDateInputValue } from '../src/utils/date.js';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const storage = new MemoryStorage();
let authEvents = 0;

globalThis.localStorage = storage;
globalThis.window = {
  dispatchEvent(event) {
    if (event.type === 'authchange') authEvents += 1;
  }
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};
globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');

const { Auth } = await import('../src/utils/auth.js');
const { FutsalStore } = await import('../src/utils/futsalStore.js');

test('format helpers handle time, ranges, durations, and statuses', () => {
  assert.equal(formatTime('00:00:00'), '12:00 AM');
  assert.equal(formatTime('12:15:00'), '12:15 PM');
  assert.equal(formatTime('23:30:00'), '11:30 PM');
  assert.equal(compactTimeRange('18:00:00', '19:00:00'), '06:00-07:00 PM');
  assert.equal(compactTimeRange('11:30:00', '12:30:00'), '11:30 AM-12:30 PM');
  assert.equal(calculateDuration('18:00:00', '19:30:00'), '1h 30m');
  assert.equal(statusClass('APPROVED'), 'badge-approved');
  assert.equal(statusClass('UNKNOWN'), '');
});

test('date helper formats using local date fields without UTC shifting', () => {
  assert.equal(toDateInputValue(new Date(2026, 5, 14, 23, 30)), '2026-06-14');
});

test('Auth saves users, reads token roles, and rejects expired tokens', () => {
  storage.clear();
  authEvents = 0;

  const liveToken = token({ role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 60 });
  Auth.save({ userId: 1, role: 'USER', authToken: liveToken });

  assert.equal(Auth.isLoggedIn(), true);
  assert.equal(Auth.isAdmin(), true);
  assert.equal(Auth.role(), 'ADMIN');
  assert.equal(authEvents, 1);

  Auth.save({ userId: 1, role: 'ADMIN', authToken: token({ role: 'ADMIN', exp: 1 }) });
  assert.equal(Auth.isLoggedIn(), false);
  assert.equal(Auth.isAdmin(), false);
});

test('Auth clears malformed stored user data instead of throwing', async () => {
  storage.clear();
  storage.setItem('futsal_user', '{bad-json');

  assert.equal(Auth.get(), null);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(storage.getItem('futsal_user'), null);
});

test('FutsalStore persists and clears the selected venue', () => {
  storage.clear();

  FutsalStore.save({ futsalId: 7, name: 'Prime Arena' });
  assert.deepEqual(FutsalStore.get(), { futsalId: 7, name: 'Prime Arena' });

  FutsalStore.clear();
  assert.equal(FutsalStore.get(), null);
});

function token(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `header.${encodedPayload}.signature`;
}
