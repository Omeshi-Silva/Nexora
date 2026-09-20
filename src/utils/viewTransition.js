import { flushSync } from 'react-dom';

/** True when the browser supports View Transitions and the traveller has not asked for less motion. */
export function canMorph() {
  if (typeof document === 'undefined' || !document.startViewTransition) return false;
  const reduced = document.documentElement.dataset.motion === 'reduce' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return !reduced;
}

/**
 * Runs a navigation inside a View Transition so shared elements (search card, route card)
 * morph between pages. Falls back to an instant change everywhere else.
 */
export function withTransition(update) {
  if (!canMorph()) { update(); return; }
  document.startViewTransition(() => { flushSync(update); });
}
