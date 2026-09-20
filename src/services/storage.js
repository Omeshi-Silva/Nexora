/** Safe localStorage wrapper: the app always works when storage is unavailable. */
const KEY = 'nexora:v1';

export function loadState() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
