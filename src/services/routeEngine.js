/**
 * NEXORA route engine (simulated).
 * Generates multimodal candidates, schedules them, prices them, scores them
 * against the traveller's purpose and needs, and explains the result.
 * Everything returned is plain serialisable data so a real API can replace this later.
 */
import { getVehicle } from '../data/vehicles';
import { HUBS, PLACE_BY_ID } from '../data/places';
import { NETWORK_STATUS } from '../data/network';
import { vehicleAccess, legInstruction, transferInstruction, matchRoute } from './accessibilityService';
import { MIN, ceilTo, timeToday } from '../utils/time';
import { roadPath, arcPath } from '../utils/geometry';
import { fleetId, seeded } from '../utils/format';

const KM_PER_UNIT = 0.03;
const HEADWAY = {
  metro: 3, 'smart-bus': 6, 'maglev-train': 10, 'maglev-express': 15, 'vacuum-tube': 12,
  'intercity-train': 20, 'air-shuttle': 15, 'regional-bus': 20, 'corporate-shuttle': 10,
};
const ROADISH = ['ground', 'smart'];
const OVERHEAD = { ground: 1, smart: 1, rail: 2, air: 4 };
const SPEED_FACTOR = { ground: 0.75, smart: 0.8, rail: 0.8, air: 0.85 };
// Estimated base fares for vehicles whose catalogue price is not published (shown as "estimated" in the UI).
const ESTIMATED_BASE = { ground: 5, smart: 8, rail: 20, air: 30 };
const KWH_PER_KM = { ground: 0.12, smart: 0.13, rail: 0.05, air: 0.34 };

// Purposes never add vehicles: they only tilt the choice between the 20 approved ones.
const PURPOSE_VEHICLES = {
  school: ['child-safe-vehicle'],
  hospital: ['step-free-vehicle', 'autonomous-taxi'],
  accessibility: ['step-free-vehicle', 'micro-shuttle', 'metro'],
  business: ['corporate-shuttle', 'smart-road-vehicle', 'maglev-express'],
  work: ['corporate-shuttle', 'metro'],
  special: ['luxury-vehicle', 'private-air'],
  airport: ['air-shuttle', 'air-taxi', 'autonomous-taxi'],
  family: ['shared-pod', 'step-free-vehicle', 'air-shuttle'],
  tourism: ['evtol', 'shared-pod'],
  wellness: ['city-pod', 'shared-pod'],
  shopping: ['shared-pod', 'autonomous-taxi'],
  event: ['metro', 'micro-shuttle'],
};

const PURPOSE_REASON = {
  school: 'Child-safe locking, guardian confirmation and arrival alerts',
  hospital: 'Easy boarding with a hospital-entrance drop-off',
  accessibility: 'Chosen for easy, step-free boarding',
  business: 'Reliable, work-friendly vehicles',
  work: 'Dependable commuter service',
  special: 'Private cabin and premium service',
  airport: 'Luggage-friendly and timed for your flight',
  family: 'Room for the whole family',
  tourism: 'Scenic, comfortable route',
  wellness: 'Simple door-to-door ride',
  shopping: 'Space for your shopping',
  event: 'Frequent service that avoids event traffic',
};

const STRONG_PURPOSE = ['school', 'hospital', 'accessibility', 'special', 'business', 'airport'];

const PURPOSE_CLAUSE = {
  school: 'adds child-safe locking and guardian alerts',
  hospital: 'drops you at the hospital entrance with easy boarding',
  accessibility: 'has easy, step-free boarding',
  business: 'uses reliable, work-friendly vehicles',
  work: 'uses a dependable commuter service',
  special: 'gives you a private cabin and premium service',
  airport: 'is luggage-friendly and timed for your flight',
  family: 'has room for the whole family',
  tourism: 'follows a scenic, comfortable route',
  wellness: 'takes you door to door',
  shopping: 'has space for your shopping',
  event: 'avoids event traffic',
};

const WEIGHTS = {
  everyday: { time: 3, cost: 2, transfers: 1.5, access: 1, comfort: 0.5, eco: 0.5 },
  work: { time: 3.5, cost: 1.5, transfers: 1.5, access: 0.8, comfort: 0.8, eco: 0.5 },
  business: { time: 4, cost: 0.5, transfers: 1.5, access: 0.5, comfort: 2, eco: 0.3 },
  special: { time: 1, cost: 0, transfers: 1.5, access: 0.5, comfort: 4, eco: 0.3 },
  school: { time: 1.5, cost: 1, transfers: 3, access: 1, comfort: 1, eco: 0.5 },
  hospital: { time: 2, cost: 1, transfers: 2.5, access: 3, comfort: 1, eco: 0.2 },
  accessibility: { time: 1.5, cost: 1, transfers: 2.5, access: 4, comfort: 1, eco: 0.3 },
  family: { time: 1.5, cost: 1.5, transfers: 2, access: 3, comfort: 1, eco: 0.5 },
  tourism: { time: 1, cost: 1.5, transfers: 1, access: 1, comfort: 2, eco: 1.5 },
  airport: { time: 3, cost: 1, transfers: 1.5, access: 1, comfort: 1.5, eco: 0.5 },
};

const SWAP_TO_ACCESSIBLE = ['city-pod', 'shared-pod', 'autonomous-taxi', 'smart-road-vehicle', 'luxury-vehicle', 'child-safe-vehicle', 'corporate-shuttle'];

const roadsHeavy = () => NETWORK_STATUS.find((n) => n.id === 'roads')?.state === 'heavy';

/* ---------- points & distance ---------- */

export function point(id) {
  if (HUBS[id]) return { ...HUBS[id], isHub: true, farKm: 0 };
  if (id?.startsWith('term:')) {
    const p = PLACE_BY_ID[id.slice(5)];
    const offset = p.lastMile === 'air' ? 40 : 12;
    return { id, name: p.terminal, short: p.terminal, x: 972, y: p.y + 30, farKm: p.farKm - offset, isHub: true, movement: 4, elevators: 4, stepFree: true, points: { rail: 'Arrival Platform 3', road: 'Arrivals Court', air: 'Air Gate L-2' } };
  }
  const p = PLACE_BY_ID[id];
  return p ? { ...p, short: p.name, farKm: p.farKm || 0 } : null;
}

export const kmBetween = (a, b) =>
  Math.hypot(b.x - a.x, b.y - a.y) * KM_PER_UNIT + Math.abs((a.farKm || 0) - (b.farKm || 0));

const pointLabel = (pt, family, vehicleId, end) => {
  if (pt.isHub && pt.points) {
    const key = vehicleId === 'metro' ? 'metro' : ROADISH.includes(family) ? 'road' : family;
    return pt.points[key] || pt.points.road || 'Main entrance';
  }
  if (family === 'rail' || vehicleId === 'metro') return `${pt.short || pt.name} Station`;
  if (family === 'air') return `${pt.short || pt.name} rooftop pad`;
  if (family === 'water') return `${pt.short || pt.name} jetty`;
  return end ? 'Main entrance drop-off' : 'Pickup point at your door';
};

const legPath = (a, b, family) => {
  const A = [a.x, a.y];
  const B = [b.x, b.y];
  if (family === 'air') return arcPath(A, B, 0.2);
  if (family === 'rail') return [A, [(A[0] + B[0]) / 2, A[1] + (B[1] - A[1]) * 0.35], B];
  return roadPath(A, B);
};

/* ---------- building a route ---------- */

function buildLeg([vehicleId, fromId, toId], idx, key) {
  const v = getVehicle(vehicleId);
  const a = point(fromId);
  const b = point(toId);
  if (!v || !a || !b) return null;
  const km = kmBetween(a, b);
  let cruise = v.speed ? ((v.speed[0] + v.speed[1]) / 2) * SPEED_FACTOR[v.family] : 70;
  const inCity = !a.farKm && !b.farKm && !(a.id || '').startsWith('term:') && !(b.id || '').startsWith('term:');
  if (ROADISH.includes(v.family) && inCity) cruise = Math.min(cruise, 48);
  const minutes = Math.max(3, Math.round((km / cruise) * 60 + (OVERHEAD[v.family] || 1)));
  const seed = `${key}-${idx}-${vehicleId}`;
  const priceEstimated = v.price == null;
  const basePrice = v.price ?? ESTIMATED_BASE[v.family] ?? 5;
  const price = Math.round(basePrice * (1 + Math.min(km / v.distance[1], 1) * 0.9) * 10) / 10;
  const congested = roadsHeavy() && ROADISH.includes(v.family) && inCity && km > 12;
  const leg = {
    idx, vehicleId, name: v.name, icon: v.icon, family: v.family,
    fleetId: fleetId(v.fleet, seed),
    fromId, toId, fromName: a.name, toName: b.name,
    fromPoint: pointLabel(a, v.family, vehicleId, false),
    toPoint: pointLabel(b, v.family, vehicleId, true),
    km: Math.round(km * 10) / 10, minutes, delayMin: congested ? (v.id === 'smart-road-vehicle' ? 2 : 4) : 0, price, priceEstimated,
    delayReason: congested ? (v.id === 'smart-road-vehicle' ? 'Predictive routing around Ring Road 2 traffic' : 'Heavy traffic on Ring Road 2') : null,
    onDemand: !HEADWAY[vehicleId],
    headway: HEADWAY[vehicleId] || 0,
    occupancy: Math.round(20 + seeded(seed) * 60),
    energyPct: Math.round(55 + seeded(`${seed}e`) * 43),
    path: legPath(a, b, v.family),
    access: vehicleAccess(v),
  };
  const words = legInstruction(leg);
  leg.instruction = words.detailed;
  leg.plainInstruction = words.plain;
  return leg;
}

/** Assigns departure/arrival times and builds transfer objects. Mutates copies only. */
export function schedule(route, startMs, needs = {}) {
  const legs = route.legs.map((l) => ({ ...l }));
  const transfers = [];
  let t = startMs;
  legs.forEach((leg, i) => {
    let dep;
    if (i === 0) {
      dep = startMs;
    } else {
      const hub = point(leg.fromId) || {};
      const movementMin = (hub.movement || 3) + (needs.wheelchair ? 2 : 0);
      const bufferMin = needs.extraTime ? 4 : 0;
      const ready = t + (movementMin + bufferMin) * MIN;
      dep = leg.headway ? ceilTo(ready + MIN, leg.headway) : ready + 2 * MIN;
      const windowMin = Math.round((dep - t) / MIN);
      const prev = legs[i - 1];
      const tr = {
        idx: i - 1,
        hubId: leg.fromId,
        hubName: leg.fromName,
        fromPoint: prev.toPoint,
        toPoint: leg.fromPoint,
        arriveTime: t,
        nextDepartTime: dep,
        windowMin,
        movementMin,
        bufferMin,
        spareMin: windowMin - movementMin,
        elevators: hub.elevators || 2,
        accessiblePath: `Step-free: lifts and moving walkway from ${prev.toPoint} to ${leg.fromPoint}`,
        missed: leg.plannedDepart ? dep > leg.plannedDepart + 30e3 : false,
        fromVehicle: prev.name,
        toVehicle: leg.name,
      };
      tr.status = tr.missed ? 'rebooked' : tr.spareMin >= 4 ? 'safe' : tr.spareMin >= 2 ? 'tight' : 'at-risk';
      const words = transferInstruction(tr);
      tr.instruction = words.detailed;
      tr.plainInstruction = words.plain;
      transfers.push(tr);
    }
    leg.departTime = dep;
    if (!leg.plannedDepart) leg.plannedDepart = dep;
    leg.boardTime = dep - (leg.family === 'rail' || leg.family === 'air' ? 6 : 1) * MIN;
    leg.arriveTime = dep + (leg.minutes + (leg.delayMin || 0)) * MIN;
    t = leg.arriveTime;
  });
  const departTime = legs[0].departTime;
  const arriveTime = legs[legs.length - 1].arriveTime;
  return {
    ...route,
    legs,
    transfers,
    transferCount: transfers.length,
    departTime,
    arriveTime,
    durationMin: Math.round((arriveTime - departTime) / MIN),
    delayMin: legs.reduce((s, l) => s + (l.delayMin || 0), 0),
  };
}

function fareFor(legs, purpose) {
  const items = legs.map((l) => ({ label: l.name, amount: l.price, estimated: l.priceEstimated }));
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  if (purpose === 'emergency') {
    return { items, fees: [], subtotal: 0, tax: 0, total: 0, note: 'Emergency service. No charge at the point of use.' };
  }
  const fees = [{ label: 'Network access fee', amount: 0.4 }];
  if (legs.some((l) => ROADISH.includes(l.family) && l.km > 5)) fees.push({ label: 'Smart-road usage', amount: 0.6 });
  fees.push({ label: 'Accessibility assistance', amount: 0, note: 'Always free' });
  const feeTotal = fees.reduce((s, f) => s + f.amount, 0);
  const tax = Math.round((subtotal + feeTotal) * 0.05 * 100) / 100;
  const total = Math.round((subtotal + feeTotal + tax) * 100) / 100;
  const passSaving = Math.round(subtotal * 0.1 * 100) / 100;
  return { items, fees, subtotal, tax, total, passSaving };
}

const ECO = { 'Very Low': 95, Low: 82 };

function assemble(specs, query, opts = {}) {
  const cleaned = specs.filter(([, f, t]) => f !== t);
  if (!cleaned.length) return null;
  const key = cleaned.map((s) => s.join('>')).join('|');
  const legs = cleaned.map((s, i) => buildLeg(s, i, key));
  if (legs.some((l) => !l)) return null;
  if (opts.delays) Object.entries(opts.delays).forEach(([i, d]) => { if (legs[i]) legs[i].delayMin = d; });

  let route = schedule({ id: `r-${key}`, legs }, opts.startMs ?? query.startMs, query.needs);

  if (query.whenMode === 'arrive' && !opts.startMs) {
    const target = query.targetMs;
    let start = target - (route.durationMin + 5) * MIN;
    for (let i = 0; i < 3; i += 1) {
      route = schedule({ id: route.id, legs }, start, query.needs);
      if (route.arriveTime <= target) break;
      start -= (route.arriveTime - target) + 2 * MIN;
    }
  }

  const totalKm = route.legs.reduce((s, l) => s + l.km, 0);
  const fam = route.legs.map((l) => l.family);
  const ecoScores = route.legs.map((l) => ECO[getVehicle(l.vehicleId).eco] ?? (l.family === 'air' ? 62 : 72));
  const ecoScore = Math.round(ecoScores.reduce((s, x) => s + x * 1, 0) / ecoScores.length);
  const comfortVals = route.legs.map((l) => getVehicle(l.vehicleId).comfort ?? 3.5);
  const comfort = Math.round((comfortVals.reduce((s, x) => s + x, 0) / comfortVals.length) * 10) / 10;
  const purposeMatch = route.legs.some((l) => (PURPOSE_VEHICLES[query.purpose] || []).includes(l.vehicleId));
  const heavy = roadsHeavy();
  const smartRoad = route.legs.some((l) => ROADISH.includes(l.family) && l.km > 12 && l.vehicleId !== 'smart-road-vehicle');

  route = {
    ...route,
    fromId: query.fromId,
    toId: query.toId,
    fromName: query.fromId === 'here' ? point('here').name : point(query.fromId).label || point(query.fromId).name,
    toName: point(query.toId).label || point(query.toId).name,
    toShort: point(query.toId).name,
    purpose: query.purpose,
    totalKm: Math.round(totalKm * 10) / 10,
    fare: fareFor(route.legs, query.purpose),
    ecoScore,
    comfort,
    energyKwh: Math.round(route.legs.reduce((s, l) => s + l.km * (KWH_PER_KM[l.family] || 0.15), 0) * 10) / 10,
    co2SavedKg: Math.round(totalKm * 0.19 * 10) / 10,
    purposeMatch,
    families: [...new Set(fam)],
    congestionRisk: heavy && smartRoad,
    pickupMin: route.legs[0].onDemand ? 2 + Math.round(seeded(`${key}p`) * 3) : 0,
    emergency: query.purpose === 'emergency',
  };
  route.price = route.fare.total;
  route.status = route.delayMin > 0 ? 'delayed' : 'on-time';
  route.hasEstimate = route.legs.some((l) => l.priceEstimated);
  route.access = matchRoute(route, query.needs);
  route.safety = safetyFor(route);
  return route;
}

function safetyFor(route) {
  const items = [
    { label: 'Weather', value: 'Stable, light breeze', ok: true },
    { label: 'Vehicle health', value: 'All systems normal', ok: true },
    { label: 'Traffic ahead', value: route.congestionRisk ? 'Heavy on Ring Road 2' : 'Light', ok: !route.congestionRisk },
    { label: 'Stations on route', value: 'Staffed and monitored', ok: true },
  ];
  if (route.families.includes('air')) items.push({ label: 'Air corridor', value: 'Clear, low wind', ok: true });
  if (route.emergency) items.unshift({ label: 'Priority corridor', value: 'Traffic cleared ahead', ok: true });
  return {
    status: route.congestionRisk ? 'Caution' : 'Clear',
    summary: route.congestionRisk
      ? 'Safe to travel. Expect slower traffic on Ring Road 2.'
      : 'Safe to travel. No incidents reported on your route.',
    items,
  };
}

/* ---------- candidate generation ---------- */

function nearCandidates(from, to, q) {
  const P = q.purpose;
  const n = q.needs;
  const d = kmBetween(from, to);
  const list = [];
  const add = (...legs) => list.push(legs);
  const F = from.id;
  const T = to.id;
  const viaHub = F !== 'hub-central' && T !== 'station' && T !== 'hub-central';

  if (d <= 15) add(['city-pod', F, T]);
  if (d >= 2 && d <= 20) add(['shared-pod', F, T]);
  add(['autonomous-taxi', F, T]);
  if (d >= 5) add(['smart-road-vehicle', F, T]);
  if (d >= 4 && viaHub) { add(['city-pod', F, 'hub-central'], ['metro', 'hub-central', T]); add(['micro-shuttle', F, 'hub-central'], ['metro', 'hub-central', T]); }
  if (d >= 8 && T !== 'hub-north') { add(['city-pod', F, 'hub-north'], ['air-taxi', 'hub-north', T]); add(['city-pod', F, 'hub-north'], ['passenger-drone', 'hub-north', T]); }

  if (P === 'school' || P === 'family') add(['child-safe-vehicle', F, T]);
  if ((P === 'business' || P === 'work') && d >= 5) add(['corporate-shuttle', F, T]);
  if (P === 'special' || P === 'business') add(['luxury-vehicle', F, T]);
  if (P === 'hospital' || P === 'accessibility' || P === 'family' || n.stepFree || n.wheelchair || n.lessWalking) add(['step-free-vehicle', F, T]);
  if ((n.stepFree || n.wheelchair || P === 'accessibility' || P === 'hospital') && viaHub && d >= 4) add(['step-free-vehicle', F, 'hub-central'], ['metro', 'hub-central', T]);
  if (P === 'airport' || T === 'airport') add(['autonomous-taxi', F, 'hub-north'], ['air-taxi', 'hub-north', T]);
  if (n.quiet) add(['luxury-vehicle', F, T]);
  return list;
}

function farCandidates(near, far, q) {
  const P = q.purpose;
  const N = near.id;
  const Fp = far.id;
  const T = `term:${far.id}`;
  const last = far.lastMile === 'air' ? 'air-shuttle' : 'autonomous-taxi';
  const list = [];
  const add = (...legs) => list.push(legs);
  const d = kmBetween(near, far);

  add(['city-pod', N, 'hub-central'], ['maglev-train', 'hub-central', T], [last, T, Fp]);
  add(['micro-shuttle', N, 'hub-central'], ['maglev-train', 'hub-central', T], ['autonomous-taxi', T, Fp]);
  add(['smart-road-vehicle', N, 'hub-central'], ['maglev-express', 'hub-central', T], ['autonomous-taxi', T, Fp]);
  add(['city-pod', N, 'hub-central'], ['vacuum-tube', 'hub-central', T], ['autonomous-taxi', T, Fp]);
  add(['micro-shuttle', N, 'hub-central'], ['intercity-train', 'hub-central', T], ['autonomous-taxi', T, Fp]);
  add(['city-pod', N, 'hub-north'], ['evtol', 'hub-north', Fp]);
  if (d <= 200) add(['smart-road-vehicle', N, Fp]);
  if (d <= 150) add(['regional-bus', N, Fp]);

  if (P === 'special') { add(['luxury-vehicle', N, 'skyport'], ['private-air', 'skyport', Fp]); }
  if (P === 'business') add(['luxury-vehicle', N, 'hub-central'], ['maglev-express', 'hub-central', T], ['autonomous-taxi', T, Fp]);
  if (P === 'airport' || P === 'family' || P === 'tourism') add(['autonomous-taxi', N, 'skyport'], ['air-shuttle', 'skyport', Fp]);
  if (q.needs.stepFree || q.needs.wheelchair || P === 'accessibility') {
    add(['step-free-vehicle', N, 'hub-central'], ['maglev-express', 'hub-central', T], ['step-free-vehicle', T, Fp]);
    add(['step-free-vehicle', N, 'hub-central'], ['intercity-train', 'hub-central', T], ['step-free-vehicle', T, Fp]);
  }
  return list;
}

/** Applies accessibility substitutions and removes unsuitable candidates. */
function adaptForNeeds(list, needs) {
  if (!needs.wheelchair && !needs.stepFree) return list;
  const min = needs.wheelchair ? 82 : 80;
  return list
    .map((legs) => legs.map(([vid, f, t]) => {
      const a = vehicleAccess(vid);
      if (a.score < 90 && SWAP_TO_ACCESSIBLE.includes(vid)) return ['step-free-vehicle', f, t];
      return [vid, f, t];
    }))
    .filter((legs) => legs.every(([vid]) => vehicleAccess(vid).score >= min));
}

function withinRange(legs) {
  return legs.every(([vid, f, t]) => {
    const v = getVehicle(vid);
    if (!v || !v.standard || v.hiddenFromJourneys) return false;
    if (f === t) return true;
    const k = kmBetween(point(f), point(t));
    return k <= v.distance[1] * 1.05 && k >= Math.min(v.distance[0] * 0.55, 1.5);
  });
}

/* ---------- query, scoring and explanation ---------- */

export function normalizeQuery(q = {}) {
  const needs = q.needs && !Array.isArray(q.needs) ? { ...q.needs } : Object.fromEntries((q.needs || []).map((k) => [k, true]));
  const now = q.now || Date.now();
  const whenMode = q.whenMode || 'now';
  const base = whenMode === 'now' ? now + 60e3 : timeToday(q.time, now);
  const startMs = ceilTo(base, 1);
  return {
    fromId: q.fromId || 'here',
    toId: q.toId,
    purpose: q.purpose || 'everyday',
    needs,
    whenMode,
    time: q.time || null,
    startMs: whenMode === 'arrive' ? ceilTo(now + 60e3, 1) : startMs,
    targetMs: whenMode === 'arrive' ? timeToday(q.time, now) : null,
    excludeVehicle: q.excludeVehicle || null,
    preferVehicle: q.preferVehicle || null,
    modes: Array.isArray(q.modes) ? q.modes : [],
  };
}

function weightsFor(q) {
  const w = { ...(WEIGHTS[q.purpose] || WEIGHTS.everyday) };
  const n = q.needs;
  if (n.budget) w.cost += 4;
  if (n.fewerChanges || n.lessWalking) w.transfers += 4;
  if (n.wheelchair || n.stepFree) w.access += 6;
  if (n.extraTime || n.assist) { w.transfers += 1; w.access += 1; }
  if (n.quiet) w.comfort += 2;
  if (n.luggage) w.comfort += 1;
  return w;
}

const norm = (x, lo, hi) => (hi - lo < 0.001 ? 0 : (x - lo) / (hi - lo));

function scoreAll(routes, q) {
  const w = weightsFor(q);
  const sumW = Object.values(w).reduce((s, x) => s + x, 0) || 1;
  const ds = routes.map((r) => r.durationMin);
  const ps = routes.map((r) => r.price);
  const [dLo, dHi, pLo, pHi] = [Math.min(...ds), Math.max(...ds), Math.min(...ps), Math.max(...ps)];
  routes.forEach((r) => {
    let penalty = 0;
    if (q.needs.luggage && r.legs.some((l) => /small/i.test(getVehicle(l.vehicleId).luggage || ''))) penalty += 6;
    if (r.congestionRisk) penalty += 3;
    const loss =
      w.time * norm(r.durationMin, dLo, dHi) +
      w.cost * norm(r.price, pLo, pHi) +
      w.transfers * (r.transferCount / 3) +
      w.access * (1 - r.access.score / 100) +
      w.comfort * (1 - r.comfort / 5) +
      w.eco * (1 - r.ecoScore / 100);
    r.utility = Math.round(100 - (100 * loss) / sumW + (r.purposeMatch ? (STRONG_PURPOSE.includes(q.purpose) ? 28 : 18) : 0) - penalty);
  });
}

const TAGS = [
  { id: 'fastest', label: 'Fastest', pick: (a, b) => a.durationMin - b.durationMin },
  { id: 'cheapest', label: 'Lowest cost', pick: (a, b) => a.price - b.price },
  { id: 'accessible', label: 'Most accessible', pick: (a, b) => b.access.score - a.access.score },
  { id: 'fewest', label: 'Fewest changes', pick: (a, b) => a.transferCount - b.transferCount || a.durationMin - b.durationMin },
  { id: 'comfort', label: 'Most comfortable', pick: (a, b) => b.comfort - a.comfort || a.durationMin - b.durationMin },
  { id: 'green', label: 'Greenest', pick: (a, b) => b.ecoScore - a.ecoScore || a.energyKwh - b.energyKwh },
];

function tag(routes) {
  routes.forEach((r) => { r.tags = []; });
  if (routes.length < 2) return;
  TAGS.forEach((t) => {
    const best = [...routes].sort(t.pick)[0];
    best.tags.push(t.label);
  });
}

/** Builds plain-language reasons: each has full text and a short clause for a summary sentence. */
function explain(r, all, q) {
  const others = all.filter((x) => x.id !== r.id);
  const reasons = [];
  const push = (text, clause) => reasons.push({ text, clause });
  if (others.length) {
    const nextFast = Math.min(...others.map((o) => o.durationMin));
    if (r.durationMin < nextFast) push(`${nextFast - r.durationMin} min faster than the next option`, `is ${nextFast - r.durationMin} min faster than the next option`);
    const cheapest = Math.min(...others.map((o) => o.price));
    if (r.price <= cheapest) push('Lowest price of all options', 'costs the least');
  }
  if (r.transferCount === 0) push('No changes: one vehicle from start to finish', 'needs no changes');
  else if (r.transferCount === 1) push(`Only one change, with ${r.transfers[0].windowMin} minutes to make it`, 'has only one change');
  if ((q.needs.wheelchair || q.needs.stepFree) && r.access.score >= 85) push('Step-free from start to finish', 'is step-free the whole way');
  if (r.purposeMatch && PURPOSE_REASON[q.purpose]) push(PURPOSE_REASON[q.purpose], PURPOSE_CLAUSE[q.purpose]);
  if (r.legs[0].onDemand) push(`Vehicle available now: pickup in ${r.pickupMin} min`, 'has a vehicle ready now');
  else if (!r.delayMin) push(`Next ${r.legs[0].name} is running on time`, 'is running on time');
  if (r.delayMin) push(`Includes ${r.delayMin} min of expected traffic delay`, `already allows for ${r.delayMin} min of expected traffic`);
  if (roadsHeavy() && !r.congestionRisk && r.families.some((f) => !ROADISH.includes(f))) push('Avoids heavy traffic on Ring Road 2', 'avoids the traffic on Ring Road 2');
  if (others.length && r.ecoScore >= Math.max(...others.map((o) => o.ecoScore))) push('Lowest environmental impact', 'has the lowest environmental impact');
  return reasons.slice(0, 5);
}

export const summarySentence = (reasons, limit = 4) => {
  const clauses = reasons.slice(0, limit).map((r) => r.clause);
  if (!clauses.length) return 'NEXORA picked the best balance of time, cost and comfort for you.';
  const body = clauses.length > 1 ? `${clauses.slice(0, -1).join(', ')} and ${clauses[clauses.length - 1]}` : clauses[0];
  return `NEXORA chose this route because it ${body}.`;
};

/**
 * Plans a journey. Returns { query, routes, recommendedId, considered } or { error }.
 */
export function planJourney(input) {
  const q = normalizeQuery(input);
  const from = point(q.fromId);
  const to = point(q.toId);
  if (!to) return { query: q, routes: [], error: 'no-destination' };
  if (!from) return { query: q, routes: [], error: 'no-origin' };
  if (from.id === to.id || (kmBetween(from, to) < 0.4)) return { query: q, routes: [], error: 'same-place' };

  let specs;
  if (to.farKm) specs = farCandidates(from, to, q);
  else if (from.farKm) specs = farCandidates(to, from, q).map((legs) => legs.reverse().map(([v, f, t]) => [v, t, f]));
  else specs = nearCandidates(from, to, q);
  if (q.preferVehicle) {
    // The traveller picked a vehicle: offer it directly, and from the north hub when it flies.
    specs.push([[q.preferVehicle, from.id, to.id]]);
    if (getVehicle(q.preferVehicle)?.family === 'air' && from.id !== 'hub-north' && to.id !== 'hub-north') specs.push([['city-pod', from.id, 'hub-north'], [q.preferVehicle, 'hub-north', to.id]]);
  }
  specs = adaptForNeeds(specs.filter(withinRange), q.needs);
  if (q.excludeVehicle) specs = specs.filter((legs) => !legs.some(([v], i) => i > 0 && v === q.excludeVehicle));

  const seen = new Set();
  let routes = specs
    .map((s) => assemble(s, q))
    .filter(Boolean)
    .filter((r) => {
      const sig = r.legs.map((l) => `${l.vehicleId}@${l.toId}`).join('|');
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });

  if (!routes.length) return { query: q, routes: [], error: 'no-routes' };

  // "Travel by" is a preference: keep routes that use a chosen category. If none can, show everything and say so.
  let modeFallback = false;
  if (q.modes.length) {
    const wanted = routes.filter((r) => r.families.some((f) => q.modes.includes(f)));
    if (wanted.length) routes = wanted;
    else modeFallback = true;
  }

  scoreAll(routes, q);
  routes.sort((a, b) => b.utility - a.utility);
  if (q.preferVehicle) {
    const uses = (r) => r.legs.some((l) => l.vehicleId === q.preferVehicle);
    routes = [...routes.filter(uses), ...routes.filter((r) => !uses(r))];
  }
  routes = routes.slice(0, 6);
  tag(routes);
  routes.forEach((r) => {
    r.reasons = explain(r, routes, q);
    r.summary = summarySentence(r.reasons);
  });
  return {
    query: q,
    routes,
    recommendedId: routes[0].id,
    considered: specs.length,
    modesChecked: new Set(specs.flat().map((l) => l[0])).size,
    modeFallback,
    generatedAt: Date.now(),
  };
}

/* ---------- live disruption and smart rebooking ---------- */

const DELAY_REASON = {
  ground: 'Heavy traffic near Central Mobility Hub',
  smart: 'A lane closure on Ring Road 2',
  rail: 'A short signal check on the Central line',
  air: 'Air-traffic hold over North Vertiport',
};

/** Re-schedules a route with a delay on one leg (the "keep current route" outcome). */
export function applyDelay(route, legIdx, delayMin, needs = {}) {
  const legs = route.legs.map((l, i) => ({ ...l, delayMin: i === legIdx ? (l.delayMin || 0) + delayMin : l.delayMin }));
  const next = schedule({ ...route, legs }, route.departTime, needs);
  return { ...next, status: 'delayed', price: route.price };
}

/**
 * Simulates a disruption on the first leg and asks the engine for a smarter alternative.
 * Returns everything the Smart Rebooking UI needs to explain the change.
 */
export function disrupt(route, needs = {}) {
  const legIdx = 0;
  const leg = route.legs[legIdx];
  const tr = route.transfers[0];
  const delayMin = tr ? Math.max(5, tr.spareMin + 3) : 6;
  const reason = DELAY_REASON[leg.family] || 'Unexpected congestion';
  const kept = applyDelay(route, legIdx, delayMin, needs);

  let alternative = null;
  if (tr && route.legs.length > 1) {
    const altPlan = planJourney({
      fromId: tr.hubId, toId: route.toId, purpose: route.purpose, needs,
      whenMode: 'now', now: kept.legs[0].arriveTime - 60e3, excludeVehicle: null,
    });
    const nextVehicle = route.legs[1].vehicleId;
    const pick = altPlan.routes
      .filter((r) => r.legs[0].vehicleId !== nextVehicle)
      .sort((a, b) => a.arriveTime - b.arriveTime)[0];
    if (pick) {
      const specs = [[leg.vehicleId, leg.fromId, leg.toId], ...pick.legs.map((l) => [l.vehicleId, l.fromId, l.toId])];
      const q = normalizeQuery({ fromId: route.fromId, toId: route.toId, purpose: route.purpose, needs });
      const built = assemble(specs, q, { startMs: route.departTime, delays: { 0: delayMin } });
      if (built && built.arriveTime < kept.arriveTime) {
        built.reasons = [{ text: `Skips the missed connection at ${tr.hubName}`, clause: 'skips the missed connection' }];
        built.summary = `This route ${built.reasons[0].clause} and gets you there sooner.`;
        alternative = built;
      }
    }
  } else {
    const legs = route.legs.map((l, i) => (i === 0 ? { ...l, delayMin: Math.max(0, delayMin - 4), fromPoint: l.fromPoint } : l));
    alternative = { ...schedule({ ...route, id: `${route.id}-detour`, legs }, route.departTime, needs) };
    alternative.detour = 'Switches to Ring Road 3 to avoid the congestion';
    alternative.reasons = [{ text: 'Uses Ring Road 3 instead of the congested road', clause: 'uses Ring Road 3' }];
    alternative.summary = 'Same vehicle, clearer road: NEXORA reroutes you via Ring Road 3.';
  }

  const spareBefore = tr ? tr.spareMin : null;
  return {
    legIdx,
    delayMin,
    reason,
    vehicleName: leg.name,
    fleetId: leg.fleetId,
    original: route,
    kept,
    alternative,
    impact: {
      originalArrive: route.arriveTime,
      keptArrive: kept.arriveTime,
      altArrive: alternative?.arriveTime ?? null,
      spareBefore,
      spareAfter: spareBefore == null ? null : spareBefore - delayMin,
      missedConnection: Boolean(kept.transfers[0]?.missed),
      priceDiff: alternative ? Math.round((alternative.price - route.price) * 100) / 100 : 0,
      accessOk: alternative ? alternative.access.score >= route.access.score - 8 : true,
      timeSaved: alternative ? Math.round((kept.arriveTime - alternative.arriveTime) / MIN) : 0,
    },
  };
}
