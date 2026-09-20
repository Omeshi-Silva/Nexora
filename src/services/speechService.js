/** Voice output and input with graceful fallbacks. Nothing in the app depends on voice alone. */
const LANG = { en: 'en-GB', si: 'si-LK', ta: 'ta-LK' };

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, lang = 'en') {
  if (!canSpeak() || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG[lang] || 'en-GB';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export const canListen = () =>
  typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * Listens once. Resolves with { text, simulated }.
 * When the browser has no speech recognition, a clearly-labelled simulated phrase is returned.
 */
export function listenOnce({ lang = 'en', fallback = 'Take me to the airport' } = {}) {
  return new Promise((resolve) => {
    if (!canListen()) {
      setTimeout(() => resolve({ text: fallback, simulated: true }), 1400);
      return;
    }
    try {
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new Rec();
      rec.lang = LANG[lang] || 'en-GB';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let done = false;
      const finish = (payload) => { if (!done) { done = true; resolve(payload); } };
      rec.onresult = (e) => finish({ text: e.results[0][0].transcript, simulated: false });
      rec.onerror = () => finish({ text: fallback, simulated: true });
      rec.onend = () => finish({ text: fallback, simulated: true });
      rec.start();
      setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } }, 6000);
    } catch {
      resolve({ text: fallback, simulated: true });
    }
  });
}

export function vibrate(pattern = [120, 60, 120]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}
