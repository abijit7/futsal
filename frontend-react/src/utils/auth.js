const KEY = 'futsal_user';

function emitAuthChange() {
  window.dispatchEvent(new Event('authchange'));
}

export const Auth = {
  save(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
    emitAuthChange();
  },
  get() {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  },
  isLoggedIn() {
    return !!this.get();
  },
  isAdmin() {
    return this.get()?.role === 'ADMIN';
  },
  logout() {
    localStorage.removeItem(KEY);
    emitAuthChange();
  }
};

