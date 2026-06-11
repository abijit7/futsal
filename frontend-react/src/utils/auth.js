const KEY = 'futsal_user';

function emitAuthChange() {
  window.dispatchEvent(new Event('authchange'));
}

function removeStoredUser({ notify = true, deferNotify = false } = {}) {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore storage failures; callers still get a logged-out state.
  }
  if (notify && deferNotify) {
    queueMicrotask(emitAuthChange);
  } else if (notify) {
    emitAuthChange();
  }
}

function tokenPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function hasUsableToken(user) {
  if (!user?.authToken) return false;
  const payload = tokenPayload(user?.authToken);
  if (!payload) return true;
  if (!payload.exp) return true;
  return Date.now() < payload.exp * 1000;
}

export const Auth = {
  save(user) {
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
      removeStoredUser({ notify: false });
    }
    emitAuthChange();
  },
  get() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        removeStoredUser({ deferNotify: true });
        return null;
      }
      return parsed;
    } catch {
      removeStoredUser({ deferNotify: true });
      return null;
    }
  },
  isLoggedIn() {
    return hasUsableToken(this.get());
  },
  isAdmin() {
    const user = this.get();
    return hasUsableToken(user) && this.role(user) === 'ADMIN';
  },
  tokenRole(user = this.get()) {
    return tokenPayload(user?.authToken)?.role;
  },
  role(user = this.get()) {
    return this.tokenRole(user) || user?.role;
  },
  logout() {
    removeStoredUser();
  }
};
