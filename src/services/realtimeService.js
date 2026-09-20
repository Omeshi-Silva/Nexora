/**
 * Simulated real-time layer. A live trip is a timeline of segments (pickup, legs,
 * transfers) played at an adjustable demo speed. Everything is derived from
 * timestamps, so state survives re-renders and page reloads.
 */
import { getVehicle } from '../data/vehicles';
import { pointAt } from '../utils/geometry';
import { MIN } from '../utils/time';
import { seeded, fleetId } from '../utils/format';
import { noun } from './accessibilityService';
import { point } from './routeEngine';

export const DEFAULT_SPEED = 20; // 1 real second = 20 simulated seconds

export function buildTimeline(route) {
  const segs = [];
  let t = 0;
  const pickupMin = route.legs[0].onDemand ? Math.max(1, route.pickupMin || 2) : 3;
  segs.push({ kind: 'pickup', start: t, dur: pickupMin * 60 });
  t += pickupMin * 60;
  route.legs.forEach((leg, i) => {
    const dur = Math.max(60, (leg.minutes + (leg.delayMin || 0)) * 60);
    segs.push({ kind: 'leg', legIdx: i, start: t, dur });
    t += dur;
    const next = route.legs[i + 1];
    if (next) {
      const gap = Math.max(60, Math.round((next.departTime - leg.arriveTime) / 1000));
      segs.push({ kind: 'transfer', legIdx: i, transferIdx: i, start: t, dur: gap });
      t += gap;
    }
  });
  return { segs, total: t, clockStart: route.legs[0].departTime - pickupMin * MIN };
}

export const simSeconds = (trip, now = Date.now()) =>
  trip.simBase + (trip.paused ? 0 : ((now - trip.startedAt) / 1000) * trip.speed);

/** Full live state of a trip at a moment in time. */
export function tripState(trip, now = Date.now()) {
  const route = trip.route;
  const tl = buildTimeline(route);
  const sim = Math.min(simSeconds(trip, now), tl.total);
  const seg = tl.segs.find((s) => sim >= s.start && sim < s.start + s.dur) || tl.segs[tl.segs.length - 1];
  const segProgress = Math.min(1, (sim - seg.start) / seg.dur);
  const done = sim >= tl.total;
  const clockMs = tl.clockStart + sim * 1000;
  const firstLeg = route.legs[0];
  const origin = point(firstLeg.fromId);

  let pos;
  let phase = seg.kind;
  let legIdx = seg.legIdx ?? 0;
  let speedKmh = 0;
  let nextStopName;
  let secondsToNext;
  let headline;
  let plainHeadline;

  if (done) {
    phase = 'arrived';
    const last = route.legs[route.legs.length - 1];
    const end = last.path[last.path.length - 1];
    pos = { x: end[0], y: end[1], angle: 0 };
    legIdx = route.legs.length - 1;
    nextStopName = last.toName;
    secondsToNext = 0;
    headline = `You have arrived at ${route.toName}.`;
    plainHeadline = `You are here. Welcome to ${route.toShort || route.toName}.`;
  } else if (seg.kind === 'pickup') {
    const approach = [[origin.x - 90, origin.y - 70], [origin.x - 90, origin.y], [origin.x, origin.y]];
    pos = pointAt(approach, segProgress);
    speedKmh = firstLeg.onDemand ? 32 : 0;
    nextStopName = firstLeg.fromPoint;
    secondsToNext = seg.dur - (sim - seg.start);
    const n = noun(firstLeg.vehicleId);
    headline = firstLeg.onDemand
      ? `Your ${n} ${firstLeg.fleetId} is on its way to ${firstLeg.fromPoint}.`
      : `Walk to ${firstLeg.fromPoint} for the ${firstLeg.name}.`;
    plainHeadline = firstLeg.onDemand
      ? `Your ${n} is coming to you. Wait at ${firstLeg.fromPoint}.`
      : `Go to ${firstLeg.fromPoint}. Your ${n} leaves soon.`;
  } else if (seg.kind === 'leg') {
    const leg = route.legs[seg.legIdx];
    pos = pointAt(leg.path, segProgress);
    const v = getVehicle(leg.vehicleId);
    const base = v.speed ? (v.speed[0] + v.speed[1]) / 2 : 70;
    const wobble = 0.82 + 0.18 * Math.sin(sim / 9);
    speedKmh = Math.round(base * (leg.family === 'ground' || leg.family === 'smart' ? 0.8 : 0.92) * wobble);
    nextStopName = leg.toName;
    secondsToNext = seg.dur - (sim - seg.start);
    headline = `On ${leg.name} ${leg.fleetId}. Next stop: ${leg.toName}.`;
    plainHeadline = `You are on the ${noun(leg.vehicleId)}. Get off at ${leg.toName}.`;
  } else {
    const leg = route.legs[seg.legIdx];
    const end = leg.path[leg.path.length - 1];
    pos = { x: end[0], y: end[1], angle: 0 };
    const tr = route.transfers[seg.transferIdx];
    nextStopName = tr?.toPoint;
    secondsToNext = seg.dur - (sim - seg.start);
    headline = `Change at ${tr?.hubName}: go to ${tr?.toPoint} for the ${route.legs[seg.legIdx + 1]?.name}.`;
    plainHeadline = tr?.plainInstruction || headline;
  }

  const current = route.legs[legIdx];
  const nextLeg = phase === 'transfer' ? route.legs[legIdx + 1] : route.legs[legIdx + 1] || null;
  const upcomingTransfer = phase === 'leg' ? route.transfers[legIdx] : phase === 'transfer' ? route.transfers[seg.transferIdx] : route.transfers[0];

  return {
    phase, done, sim, total: tl.total, segProgress,
    progress: sim / tl.total,
    clockMs,
    remainingMin: Math.max(0, Math.ceil((tl.total - sim) / 60)),
    minutesToNext: Math.max(0, Math.ceil(secondsToNext / 60)),
    etaMs: route.arriveTime,
    legIdx, current, nextLeg, upcomingTransfer,
    nextStopName, speedKmh, pos,
    headline, plainHeadline,
    energy: Math.max(20, (current?.energyPct || 80) - Math.round(sim / 240)),
    occupancy: current?.occupancy ?? 30,
    segments: tl.segs,
  };
}

/** Event triggers along the trip timeline, fired once each by the journey context. */
export function tripEvents(route, withDisruption) {
  const tl = buildTimeline(route);
  const ev = [];
  const pickup = tl.segs[0];
  const first = route.legs[0];
  if (pickup.dur >= 90) {
    ev.push({ id: 'pickup-soon', at: pickup.dur - 60, type: 'arrival', severity: 'info', title: `Your ${noun(first.vehicleId)} is 1 minute away`, body: `${first.name} ${first.fleetId} will stop at ${first.fromPoint}.` });
  }
  tl.segs.filter((s) => s.kind === 'leg').forEach((s) => {
    const leg = route.legs[s.legIdx];
    ev.push({ id: `board-${s.legIdx}-${leg.vehicleId}`, at: s.start + 2, type: 'journey', severity: 'success', title: `Boarded ${leg.name}`, body: `${leg.fleetId}. Next stop: ${leg.toName}.` });
    const tr = route.transfers[s.legIdx];
    ev.push({
      id: `arriving-${s.legIdx}-${leg.vehicleId}`,
      at: s.start + s.dur - 100,
      type: tr ? 'transfer' : 'arrival',
      severity: 'info',
      title: tr ? `Change at ${leg.toName} in 2 minutes` : `Arriving in about 2 minutes`,
      body: tr ? tr.plainInstruction : `Get ready to leave at ${leg.toPoint}.`,
    });
  });
  if (withDisruption) {
    const s = tl.segs.find((x) => x.kind === 'leg');
    ev.push({ id: 'disruption', at: s.start + s.dur * 0.35, type: 'disruption' });
  }
  ev.push({ id: 'arrived', at: tl.total, type: 'arrival', severity: 'success', title: `You have arrived`, body: `Welcome to ${route.toName}.` });
  return ev;
}

/* ---------- ambient network vehicles (for the live map) ---------- */

const LOOPS = {
  ringNorth: [[170, 130], [880, 130], [880, 250], [170, 250], [170, 130]],
  ringMid: [[300, 250], [760, 250], [760, 470], [300, 470], [300, 250]],
  south: [[170, 470], [640, 470], [640, 592], [170, 592], [170, 470]],
  east: [[640, 250], [880, 250], [880, 470], [640, 470], [640, 250]],
  rail: [[60, 360], [500, 360], [955, 372], [500, 360], [60, 360]],
  railNorth: [[500, 360], [560, 250], [620, 150], [560, 250], [500, 360]],
  air1: [[430, 130], [600, 60], [880, 108], [700, 180], [430, 130]],
  air2: [[362, 250], [420, 190], [430, 130], [380, 200], [362, 250]],
  school: [[170, 560], [170, 392], [282, 392], [282, 470], [170, 560]],
  outer: [[880, 250], [880, 470], [300, 470], [300, 250], [880, 250]],
};

export const AMBIENT = [
  { id: 'a1', vehicleId: 'micro-shuttle', loop: 'ringNorth', period: 110, offset: 0, filter: 'ground' },
  { id: 'a2', vehicleId: 'regional-bus', loop: 'south', period: 95, offset: 0.4, filter: 'ground' },
  { id: 'a3', vehicleId: 'city-pod', loop: 'east', period: 48, offset: 0.1, filter: 'ground' },
  { id: 'a4', vehicleId: 'autonomous-taxi', loop: 'south', period: 50, offset: 0.5, filter: 'ground' },
  { id: 'a5', vehicleId: 'smart-road-vehicle', loop: 'ringMid', period: 60, offset: 0.1, filter: 'smart' },
  { id: 'a6', vehicleId: 'step-free-vehicle', loop: 'school', period: 70, offset: 0.3, filter: 'smart' },
  { id: 'a7', vehicleId: 'corporate-shuttle', loop: 'outer', period: 65, offset: 0.55, filter: 'smart' },
  { id: 'a8', vehicleId: 'metro', loop: 'rail', period: 60, offset: 0.1, filter: 'rail' },
  { id: 'a9', vehicleId: 'maglev-train', loop: 'rail', period: 40, offset: 0.62, filter: 'rail' },
  { id: 'a10', vehicleId: 'metro', loop: 'railNorth', period: 45, offset: 0.3, filter: 'rail' },
  { id: 'a11', vehicleId: 'air-taxi', loop: 'air1', period: 55, offset: 0.2, filter: 'air' },
  { id: 'a12', vehicleId: 'evtol', loop: 'air1', period: 70, offset: 0.7, filter: 'air' },
  { id: 'a13', vehicleId: 'passenger-drone', loop: 'air2', period: 40, offset: 0, filter: 'air' },
  // The other eight vehicles, so all 20 NEXORA vehicles are live on the map.
  { id: 'a14', vehicleId: 'shared-pod', loop: 'east', period: 62, offset: 0.6, filter: 'ground' },
  { id: 'a15', vehicleId: 'child-safe-vehicle', loop: 'school', period: 80, offset: 0.8, filter: 'smart' },
  { id: 'a16', vehicleId: 'luxury-vehicle', loop: 'outer', period: 75, offset: 0.2, filter: 'smart' },
  { id: 'a17', vehicleId: 'maglev-express', loop: 'rail', period: 28, offset: 0.3, filter: 'rail' },
  { id: 'a18', vehicleId: 'intercity-train', loop: 'rail', period: 52, offset: 0.85, filter: 'rail' },
  { id: 'a19', vehicleId: 'vacuum-tube', loop: 'railNorth', period: 30, offset: 0.6, filter: 'rail' },
  { id: 'a20', vehicleId: 'air-shuttle', loop: 'air1', period: 80, offset: 0.9, filter: 'air' },
  { id: 'a21', vehicleId: 'private-air', loop: 'air1', period: 62, offset: 0.45, filter: 'air' },
];

const STOPS_BY_LOOP = {
  ringNorth: ['North Vertiport', 'Meridian University', 'Skyport International'],
  ringMid: ['Central Mobility Hub', 'Aurora Business District', 'Heritage Museum'],
  south: ['Nova Galleria', 'Harbourview Grand', 'Smart Mobility Hub B'],
  east: ['Horizon Arena', 'Aurora Business District', 'Harbourview Grand'],
  rail: ['Central Mobility Hub', 'East Maglev Portal', 'Westgate'],
  railNorth: ['Meridian University', 'Central Mobility Hub'],
  air1: ['North Vertiport', 'Skyport International'],
  air2: ['Serenity General Hospital', 'North Vertiport'],
  school: ['Greenfield Primary Academy', 'Lotus Residences'],
  outer: ['Horizon Arena', 'Smart Mobility Hub B'],
};

export function ambientVehicles(now = Date.now()) {
  const t = now / 1000;
  return AMBIENT.map((a) => {
    const v = getVehicle(a.vehicleId);
    const f = ((t / a.period) + a.offset) % 1;
    const p = pointAt(LOOPS[a.loop], f);
    const stops = STOPS_BY_LOOP[a.loop];
    const s = seeded(a.id);
    const idx = Math.floor(f * stops.length) % stops.length;
    return {
      ...a,
      category: v.family,
      destination: stops[(idx + 1) % stops.length],
      currentLocation: stops[(idx - 1 + stops.length) % stops.length],
      progress: f,
      altitudeM: v.family === 'air' ? Math.round(280 + s * 320 + 30 * Math.sin(t / 9 + s * 6)) : null,
      capacity: v.passengers,
      accessScore: v.accessScore,
      liveTracking: true,
      name: v.name,
      icon: v.icon,
      family: v.family,
      fleetId: fleetId(v.fleet, a.id),
      x: p.x, y: p.y, angle: p.angle,
      speedKmh: v.speed ? Math.round(((v.speed[0] + v.speed[1]) / 2) * (0.7 + 0.2 * Math.sin(t / 7 + s * 6))) : 64,
      nextStop: stops[Math.floor(f * stops.length) % stops.length],
      etaMin: Math.max(1, Math.round((1 - ((f * stops.length) % 1)) * (a.period / stops.length) / 3)),
      occupancy: Math.round(15 + s * 70),
      energy: Math.round(60 + 35 * Math.abs(Math.sin(t / 300 + s))),
      status: s > 0.85 ? 'Delayed 2 min' : 'On time',
      concept: !v.standard,
    };
  });
}

export const LOOP_PATHS = LOOPS;

/* ---------- network & service live data ---------- */

export function networkHealth(now = Date.now()) {
  return Math.round(97 + Math.sin(now / 90000) * 1.2);
}

const HOURS = { ground: '24 hours', smart: '24 hours', rail: '04:30–01:30', air: '05:00–23:30' };
const AREAS = ['Central Mobility Hub', 'North Vertiport', 'Aurora Business District', 'Lotus Residences', 'Smart Mobility Hub B', 'Meridian University'];

/** Simulated live availability for a service in the Explorer and detail views. */
export function serviceLive(vehicleId, now = Date.now()) {
  const v = getVehicle(vehicleId);
  if (!v) return null;
  const minute = Math.floor(now / 60000);
  const s = seeded(`${vehicleId}-${Math.floor(minute / 3)}`);
  if (!v.standard) {
    return { status: v.status, tone: 'concept', eta: null, location: 'Test corridor', fleetId: fleetId(v.fleet, vehicleId), hours: HOURS[v.family] || '—', cancellations: 'Not bookable', delayMin: 0 };
  }
  const busy = s > 0.82;
  const delayed = !busy && s > 0.7;
  return {
    status: busy ? 'Busy' : delayed ? 'Delayed' : 'Available',
    tone: busy ? 'warning' : delayed ? 'warning' : 'ok',
    eta: Math.max(1, Math.round(2 + s * 9)),
    location: `Near ${AREAS[Math.floor(s * AREAS.length)]}`,
    fleetId: fleetId(v.fleet, `${vehicleId}-${minute}`),
    hours: HOURS[v.family] || '24 hours',
    cancellations: 'Free cancellation up to 10 minutes before departure',
    delayMin: delayed ? 2 + Math.round(s * 4) : 0,
  };
}
