import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PREFS, DEFAULT_PROFILE, DEFAULT_PASS } from '../data/profile';
import { seedJourneys, seedNotifications } from '../data/journeys';
import { loadState, saveState, clearState } from '../services/storage';
import { speak, vibrate } from '../services/speechService';
import { PERSONA_KEYS } from '../data/personas';

const AppContext = createContext(null);

const TYPE_TO_SETTING = { delay: 'delays', disruption: 'delays', arrival: 'arrivals', transfer: 'transfers', offer: 'offers', safety: 'safety', booking: 'booking' };

export function AppProvider({ children }) {
  const stored = useRef(loadState()).current;
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS, ...(stored?.prefs || {}) });
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE, ...(stored?.profile || {}) });
  const [pass, setPass] = useState(() => {
    const merged = { ...DEFAULT_PASS, ...(stored?.pass || {}) };
    // One-time refill for saved demo state created with the old, smaller starting balance.
    if (stored?.pass && stored.pass.balanceSeed !== DEFAULT_PASS.balanceSeed) {
      merged.balance = Math.max(merged.balance, DEFAULT_PASS.balance);
      merged.balanceSeed = DEFAULT_PASS.balanceSeed;
    }
    return merged;
  });
  const [notifications, setNotifications] = useState(stored?.notifications || seedNotifications());
  const [journeys, setJourneys] = useState(stored?.journeys || seedJourneys());
  const [onboarded, setOnboarded] = useState(Boolean(stored?.onboarded));
  const [toasts, setToasts] = useState([]);
  const [flash, setFlash] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const [panel, setPanel] = useState(null);
  const [persona, setPersona] = useState(stored?.persona || null);

  /** Applies a demo persona, remembering the traveller's own settings so they can be restored. */
  const applyPersona = useCallback((p) => {
    setPersona((cur) => {
      const saved = cur ? cur.saved : prefsRef.current;
      const base = { ...saved, ...Object.fromEntries(PERSONA_KEYS.map((k) => [k, DEFAULT_PREFS[k]])) };
      setPrefs({ ...base, ...p.prefs });
      return { id: p.id, saved };
    });
  }, []);
  const clearPersona = useCallback(() => {
    setPersona((cur) => {
      if (cur?.saved) setPrefs(cur.saved);
      return null;
    });
  }, []);
  const openPanel = useCallback((type, data = null) => setPanel({ type, data }), []);
  const closePanel = useCallback(() => setPanel(null), []);

  useEffect(() => {
    saveState({ prefs, profile, pass, notifications: notifications.slice(0, 40), journeys, onboarded, persona });
  }, [prefs, profile, pass, notifications, journeys, onboarded, persona]);

  // Reflect preferences on <html> so every page adapts, not just a settings screen.
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.largeText = String(prefs.largeText);
    el.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
    el.dataset.simple = String(prefs.simplified);
    el.dataset.motion = prefs.reducedMotion ? 'reduce' : 'normal';
    el.lang = profile.language === 'si' ? 'si' : profile.language === 'ta' ? 'ta' : 'en';
  }, [prefs, profile.language]);

  const setPref = useCallback((key, value) => {
    setPrefs((p) => ({ ...p, [key]: typeof value === 'function' ? value(p[key]) : value }));
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  /** Sends a notification: text always, plus voice, vibration and a visual flash when enabled. */
  const notify = useCallback((n) => {
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item = { id, at: Date.now(), read: false, severity: 'info', type: 'info', ...n };
    setNotifications((list) => [item, ...list].slice(0, 60));
    const setting = TYPE_TO_SETTING[item.type];
    const allowed = !setting || profileRef.current.notifications?.[setting] !== false || item.severity === 'critical';
    if (!allowed || item.silent) return id;
    setToasts((t) => [...t.slice(-2), item]);
    const p = prefsRef.current;
    if (p.voiceGuidance) speak(`${item.title}. ${item.body || ''}`, profileRef.current.language);
    if (p.vibration && (item.severity === 'warning' || item.severity === 'critical')) vibrate();
    if (p.visualAlerts && (item.severity === 'warning' || item.severity === 'critical')) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    }
    if (item.severity !== 'critical' && !item.sticky) setTimeout(() => dismissToast(id), 6500);
    return id;
  }, [dismissToast]);

  const markRead = useCallback((id) => setNotifications((l) => l.map((n) => (id === 'all' || n.id === id ? { ...n, read: true } : n))), []);
  const removeNotification = useCallback((id) => setNotifications((l) => l.filter((n) => n.id !== id)), []);

  const upsertJourney = useCallback((j) => {
    setJourneys((list) => {
      const exists = list.some((x) => x.id === j.id);
      return exists ? list.map((x) => (x.id === j.id ? { ...x, ...j } : x)) : [j, ...list];
    });
  }, []);

  const resetAll = useCallback(() => {
    clearState();
    setPrefs(DEFAULT_PREFS);
    setProfile(DEFAULT_PROFILE);
    setPass(DEFAULT_PASS);
    setNotifications(seedNotifications());
    setJourneys(seedJourneys());
    setOnboarded(false);
    setPersona(null);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const value = useMemo(() => ({
    prefs, setPref, setPrefs,
    profile, setProfile,
    pass, setPass,
    notifications, notify, markRead, removeNotification, unread,
    toasts, dismissToast, flash,
    journeys, upsertJourney, setJourneys,
    onboarded, setOnboarded,
    a11yOpen, setA11yOpen,
    panel, openPanel, closePanel,
    persona, applyPersona, clearPersona,
    resetAll,
  }), [panel, openPanel, closePanel, persona, applyPersona, clearPersona, prefs, setPref, profile, pass, notifications, notify, markRead, removeNotification, unread, toasts, dismissToast, flash, journeys, upsertJourney, onboarded, a11yOpen, resetAll]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
export const useSimple = () => useContext(AppContext).prefs.simplified;
