export const MIN = 60e3;

/** 24-hour clock, e.g. "08:30". */
export const clock = (ms) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Human duration, e.g. "1 h 12 min" or "42 min". */
export const duration = (minutes) => {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};

/** Relative countdown text, e.g. "in 4 min", "now", "2 min ago". */
export const relative = (targetMs, now = Date.now()) => {
  const diff = Math.round((targetMs - now) / MIN);
  if (diff === 0) return 'now';
  if (diff > 0) return `in ${duration(diff)}`;
  return `${duration(-diff)} ago`;
};

/** mm:ss countdown. */
export const countdown = (targetMs, now = Date.now()) => {
  const s = Math.max(0, Math.round((targetMs - now) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** Round a timestamp up to the next multiple of `stepMin` minutes. */
export const ceilTo = (ms, stepMin) => {
  const step = stepMin * MIN;
  return Math.ceil(ms / step) * step;
};

/** Today's date shown in the fictional year 2100. */
export const futureDate = (ms = Date.now()) => {
  const d = new Date(ms);
  const day = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${day} ${d.getDate()} ${month} 2100`;
};

/** Parse "HH:MM" into a timestamp today (or tomorrow if already passed). */
export const timeToday = (hhmm, now = Date.now()) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return now;
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() < now - 5 * MIN) d.setDate(d.getDate() + 1);
  return d.getTime();
};

export const hhmmNow = (offsetMin = 0) => clock(Date.now() + offsetMin * MIN);
