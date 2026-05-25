const KEY = 'selected_futsal';

export const FutsalStore = {
  save(futsal) {
    localStorage.setItem(KEY, JSON.stringify(futsal));
  },
  get() {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    localStorage.removeItem(KEY);
  }
};

