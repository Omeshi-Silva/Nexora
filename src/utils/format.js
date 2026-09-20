export const money = (n) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);
export const km = (n) => `${n < 10 ? n.toFixed(1) : Math.round(n)} km`;
export const range = (r, unit = '') => (r ? `${r[0].toLocaleString()}–${r[1].toLocaleString()}${unit}` : null);
export const pct = (n) => `${Math.round(n)}%`;
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const stars = (n) => (n == null ? null : `${n} out of 5`);
export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

/** Deterministic pseudo-random number in [0,1) from a string seed. */
export const seeded = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

/** Stable fleet call-sign, e.g. "NX-POD 204". */
export const fleetId = (prefix, seed) => `${prefix} ${100 + Math.floor(seeded(seed) * 899)}`;
