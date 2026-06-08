const KEY = 'futsal_user';

function emitAuthChange() {
  window.dispatchEvent(new Event('authchange'));
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
    localStorage.setItem(KEY, JSON.stringify(user));
    emitAuthChange();
  },
  get() {
    const raw = localStorage.getItem(KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(KEY);
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
    localStorage.removeItem(KEY);
    emitAuthChange();
  }
};
