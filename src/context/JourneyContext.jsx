import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './AppContext';
import { planJourney, disrupt } from '../services/routeEngine';
import { tripState, tripEvents, simSeconds, buildTimeline, DEFAULT_SPEED } from '../services/realtimeService';
import { clock } from '../utils/time';

const JourneyContext = createContext(null);
const LiveContext = createContext(null);
const JKEY = 'nexora:journey';

const DEFAULT_QUERY = { fromId: 'home', toId: 'work', purpose: 'everyday', needs: [], whenMode: 'now', time: null };

function loadJourney() {
  try {
    const raw = window.localStorage.getItem(JKEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveJourney(s) {
  try { window.localStorage.setItem(JKEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function JourneyProvider({ children }) {
  const { prefs, notify, upsertJourney } = useApp();
  const stored = useRef(loadJourney()).current;

  const [query, setQuery] = useState(stored?.query || DEFAULT_QUERY);
  const prefNeeds = useMemo(() => ({
    ...(prefs.stepFree ? { stepFree: true } : {}),
    ...(prefs.wheelchair ? { wheelchair: true, stepFree: true } : {}),
    ...(prefs.extraTime ? { extraTime: true } : {}),
    ...(prefs.lessWalking ? { lessWalking: true } : {}),
    ...(prefs.quiet ? { quiet: true } : {}),
  }), [prefs.stepFree, prefs.wheelchair, prefs.extraTime, prefs.lessWalking, prefs.quiet]);

  const needs = useMemo(() => ({ ...Object.fromEntries((query.needs || []).map((k) => [k, true])), ...prefNeeds }), [query.needs, prefNeeds]);

  const [results, setResults] = useState(() => planJourney({ ...(stored?.query || DEFAULT_QUERY), needs: { ...Object.fromEntries(((stored?.query || DEFAULT_QUERY).needs || []).map((k) => [k, true])) } }));
  // selectedId is the route being viewed (the AI suggestion until the traveller picks another).
  // chosenId is set only by an explicit "Select this route", and gates payment.
  const [selectedId, setSelectedId] = useState(stored?.selectedId || null);
  const [chosenId, setChosenId] = useState(stored?.chosenId || null);
  const [trip, setTrip] = useState(stored?.trip || null);
  const [pendingRebook, setPendingRebook] = useState(null);
  const [lastCompleted, setLastCompleted] = useState(stored?.lastCompleted || null);
  const [offline, setOffline] = useState(false);
  const [savedIds, setSavedIds] = useState(stored?.savedIds || []);

  useEffect(() => {
    saveJourney({ query, selectedId, chosenId, trip, lastCompleted, savedIds });
  }, [query, selectedId, chosenId, trip, lastCompleted, savedIds]);

  // Re-plan whenever the traveller's accessibility needs change anywhere in the app.
  const needsKey = JSON.stringify(needs);
  const firstRun = useRef(true);
  useEffect(() => {
    const next = planJourney({ ...query, needs });
    setResults(next);
    setSelectedId((cur) => (next.routes.some((r) => r.id === cur) ? cur : next.recommendedId));
    setChosenId((cur) => (next.routes.some((r) => r.id === cur) ? cur : null));
    if (!firstRun.current && Object.keys(prefNeeds).length) {
      notify({ type: 'journey', severity: 'info', title: 'Routes updated for your needs', body: 'NEXORA re-checked every option using your accessibility settings.', silent: false });
    }
    firstRun.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsKey]);

  const routes = results?.routes || [];
  const selected = routes.find((r) => r.id === selectedId) || routes[0] || null;
  /** The route the traveller explicitly selected, or null. Only this one can be paid for. */
  const chosen = routes.find((r) => r.id === chosenId) || null;

  /** Plans a journey from Home or a scenario. */
  const plan = useCallback((input) => {
    const q = { ...DEFAULT_QUERY, ...query, ...input, modes: input.modes || [], preferVehicle: input.preferVehicle || null };
    if (input.needs) q.needs = Array.isArray(input.needs) ? input.needs : Object.keys(input.needs).filter((k) => input.needs[k]);
    setQuery(q);
    const combined = { ...Object.fromEntries((q.needs || []).map((k) => [k, true])), ...prefNeeds };
    const res = planJourney({ ...q, needs: combined });
    setResults(res);
    setSelectedId(res.recommendedId || null);
    setChosenId(null);
    return res;
  }, [query, prefNeeds]);

  /** Explicit choice by the traveller: makes this the selected route. */
  const selectRoute = useCallback((id) => { setSelectedId(id); setChosenId(id); }, []);
  /** Shows a route without selecting it. */
  const previewRoute = useCallback((id) => { setSelectedId(id); setChosenId((cur) => (cur === id ? cur : null)); }, []);

  /** Replaces the selected route (used by smart rebooking before a trip starts). */
  const replaceSelected = useCallback((route) => {
    setResults((res) => ({ ...res, routes: [route, ...res.routes.filter((r) => r.id !== route.id && r.id !== selectedId)] }));
    setSelectedId(route.id);
    setChosenId(route.id);
  }, [selectedId]);

  const toggleSaved = useCallback((route) => {
    setSavedIds((ids) => (ids.includes(route.id) ? ids.filter((x) => x !== route.id) : [...ids, route.id]));
    upsertJourney({ id: `saved-${route.id}`, status: 'saved', title: `${route.fromName} to ${route.toShort}`, fromId: route.fromId, toId: route.toId, purpose: route.purpose, depart: null, modes: route.legs.map((l) => l.vehicleId), price: route.price, durationMin: route.durationMin });
  }, [upsertJourney]);

  /* ---------- live trip ---------- */

  const startTrip = useCallback((route = chosen, opts = {}) => {
    if (!route) return;
    const id = `trip-${Date.now()}`;
    setPendingRebook(null);
    setTrip({ id, route, startedAt: Date.now(), simBase: 0, speed: DEFAULT_SPEED, paused: false, fired: [], autoDisrupt: !route.emergency && opts.autoDisrupt !== false, rebooked: false });
    upsertJourney({ id, status: 'active', title: `${route.fromName} to ${route.toShort}`, fromId: route.fromId, toId: route.toId, purpose: route.purpose, depart: route.departTime, modes: route.legs.map((l) => l.vehicleId), price: opts.paid ?? route.price, durationMin: route.durationMin });
    notify({ type: 'journey', severity: 'success', title: 'Journey started. You’re on your way.', body: route.legs[0].plainInstruction });
  }, [chosen, upsertJourney, notify]);

  const rebase = (t, patch) => ({ ...t, simBase: simSeconds(t), startedAt: Date.now(), ...patch });

  const setSpeed = useCallback((speed) => setTrip((t) => (t ? rebase(t, { speed }) : t)), []);
  const togglePause = useCallback(() => setTrip((t) => (t ? rebase(t, { paused: !t.paused }) : t)), []);
  const skipAhead = useCallback(() => setTrip((t) => {
    if (!t) return t;
    const tl = buildTimeline(t.route);
    const sim = simSeconds(t);
    const next = tl.segs.find((s) => s.start > sim + 1);
    return { ...t, simBase: next ? next.start + 1 : tl.total, startedAt: Date.now() };
  }), []);

  const tripRef = useRef(trip);
  tripRef.current = trip;
  const rebookRef = useRef(pendingRebook);
  rebookRef.current = pendingRebook;

  const endTrip = useCallback((reason = 'cancelled') => {
    const t = tripRef.current;
    if (t && !t.completed) upsertJourney({ id: t.id, status: reason === 'completed' ? 'completed' : 'cancelled' });
    setTrip(null);
    setPendingRebook(null);
  }, [upsertJourney]);

  const triggerDisruption = useCallback(() => {
    const t = tripRef.current;
    if (!t || t.rebooked || t.completed) return;
    const d = disrupt(t.route, needs);
    setPendingRebook(d);
    notify({ type: 'disruption', severity: 'warning', title: `${d.delayMin}-minute delay on ${d.vehicleName}`, body: `${d.reason}. ${d.alternative ? `NEXORA found a better route that saves ${d.impact.timeSaved || 'a few'} minutes.` : 'Your arrival time has been updated.'}`, action: { label: 'Review options', to: '/live' } });
    setTrip((cur) => (cur ? { ...cur, fired: [...new Set([...cur.fired, 'disruption'])], rebooked: true } : cur));
  }, [needs, notify]);

  const resolveRebook = useCallback((choice) => {
    const d = rebookRef.current;
    if (!d) return;
    const next = choice === 'switch' && d.alternative ? d.alternative : d.kept;
    setTrip((t) => (t ? { ...t, route: next } : t));
    setPendingRebook(null);
    notify({
      type: 'journey',
      severity: 'success',
      title: choice === 'switch' ? 'Route changed' : 'Keeping your route',
      body: choice === 'switch'
        ? `New arrival ${clock(next.arriveTime)}. ${next.detour || `You now take ${next.legs.slice(1).map((l) => l.name).join(' then ')}.`}`
        : `New arrival ${clock(next.arriveTime)}.${d.impact.missedConnection ? ' You are booked on the next departure automatically.' : ''}`,
    });
  }, [notify]);

  // Clock: ticks only while a trip is running.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!trip || trip.completed) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [trip]);

  // Fire timeline events (arrivals, boarding, disruption, completion).
  useEffect(() => {
    if (!trip || trip.completed) return;
    const sim = simSeconds(trip, now);
    const events = tripEvents(trip.route, trip.autoDisrupt && !trip.rebooked);
    const due = events.filter((e) => e.at <= sim && !trip.fired.includes(e.id));
    if (!due.length) return;
    let completed = false;
    due.forEach((e) => {
      if (e.id === 'disruption') { triggerDisruption(); return; }
      if (e.id === 'arrived') completed = true;
      notify({ type: e.type, severity: e.severity, title: e.title, body: e.body });
    });
    setTrip((t) => (t ? { ...t, fired: [...new Set([...t.fired, ...due.map((e) => e.id)])] } : t));
    if (completed) {
      setLastCompleted({ route: trip.route, startedAt: trip.startedAt, completedAt: Date.now() });
      upsertJourney({ id: trip.id, status: 'completed' });
      setTrip((t) => (t ? { ...t, completed: true } : t));
    }
  }, [now, trip, notify, triggerDisruption, upsertJourney]);

  // Real connectivity changes also switch the map into offline mode.
  useEffect(() => {
    const off = () => setOffline(true);
    const on = () => setOffline(false);
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on); };
  }, []);

  const liveRaw = useMemo(() => (trip ? tripState(trip, now) : null), [trip, now]);
  const frozen = useRef(null);
  if (!offline) frozen.current = liveRaw ? { ...liveRaw, at: now } : null;
  const live = offline && frozen.current ? { ...frozen.current, stale: true } : liveRaw;

  const journeyValue = useMemo(() => ({
    query, needs, prefNeeds, results, routes, selected, selectedId, chosen, chosenId, previewRoute,
    plan, selectRoute, replaceSelected, toggleSaved, savedIds,
    trip, startTrip, endTrip, setSpeed, togglePause, skipAhead,
    pendingRebook, triggerDisruption, resolveRebook,
    lastCompleted, setLastCompleted,
    offline, setOffline,
  }), [query, needs, prefNeeds, results, routes, selected, selectedId, chosen, chosenId, previewRoute, plan, selectRoute, replaceSelected, toggleSaved, savedIds, trip, startTrip, endTrip, setSpeed, togglePause, skipAhead, pendingRebook, triggerDisruption, resolveRebook, lastCompleted, offline]);

  const liveValue = useMemo(() => ({ live, now, activeRoute: trip?.route || null }), [live, now, trip]);

  return (
    <JourneyContext.Provider value={journeyValue}>
      <LiveContext.Provider value={liveValue}>{children}</LiveContext.Provider>
    </JourneyContext.Provider>
  );
}

export const useJourney = () => useContext(JourneyContext);
export const useLive = () => useContext(LiveContext);
