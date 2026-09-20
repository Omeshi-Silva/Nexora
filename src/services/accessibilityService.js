import { getVehicle } from '../data/vehicles';

const FULL_ACCESS = ['step-free-vehicle'];

/** Derives an accessibility profile from the vehicle's published accessibility text. */
export function vehicleAccess(vehicleOrId) {
  const v = typeof vehicleOrId === 'string' ? getVehicle(vehicleOrId) : vehicleOrId;
  if (!v) return { score: 50, stepFree: false, wheelchair: false, assisted: false, label: 'Unknown' };
  const t = (v.accessibility || '').toLowerCase();
  let score = 50;
  if (v.accessScore != null) {
    const assisted = /assist|ramp|priority/.test(t);
    return { score: v.accessScore, stepFree: v.accessScore >= 90, wheelchair: v.accessScore >= 82, assisted, label: v.accessibility || 'No accessibility details published' };
  }
  if (FULL_ACCESS.includes(v.id)) score = 99;
  else if (/fully accessible|step-free|wheelchair ramp|wheelchair accessible|wheelchair \+/.test(t)) score = 95;
  else if (/wheelchair.compatible|accessible (vehicle|versions|cabin|configuration|capsules|boarding)|^yes/.test(t)) score = 82;
  else if (/assisted boarding/.test(t)) score = 78;
  else if (/custom/.test(t)) score = 76;
  else if (v.id === 'sensory-pod' || v.id === 'school-shuttle') score = 82;
  const assisted = /assist/.test(t) || (v.features || []).some((f) => /assist|ramp/i.test(f)) || score >= 95;
  return {
    score,
    stepFree: score >= 90,
    wheelchair: score >= 82,
    assisted,
    label: v.accessibility || 'No accessibility details published for this vehicle',
  };
}

/** Everyday noun for a vehicle, used in plain-language instructions. */
export function noun(vehicleId) {
  const v = getVehicle(vehicleId);
  if (!v) return 'vehicle';
  const map = { shield: 'child-safe vehicle', crown: 'car', briefcase: 'shuttle', pod: 'pod', car: 'car', bus: 'bus', maglev: 'train', train: 'train', tube: 'capsule', airtaxi: 'air taxi', drone: 'drone', plane: 'flight', stairs: 'step-free vehicle' };
  if (v.id === 'metro') return 'metro';
  return map[v.icon] || 'vehicle';
}

/** Standard and simplified wording for boarding a leg. */
export function legInstruction(leg) {
  const n = noun(leg.vehicleId);
  const at = leg.fromPoint;
  const detailed = `Board ${leg.name} ${leg.fleetId} at ${at}, ${leg.fromName}.`;
  const plain = leg.onDemand
    ? `Your ${n} will meet you at ${at}. Get in and it takes you to ${leg.toName}.`
    : `Go to ${at} for your ${n} to ${leg.toName}.`;
  return { detailed, plain };
}

/** Standard and simplified wording for a change between vehicles. */
export function transferInstruction(tr) {
  const detailed = `Transfer at ${tr.hubName}: ${tr.fromPoint} to ${tr.toPoint} (${tr.movementMin} min, step-free).`;
  const plain = `Get off at ${tr.hubName}. Follow the glowing floor line to ${tr.toPoint}. It takes about ${tr.movementMin} minutes.`;
  return { detailed, plain };
}

/**
 * Scores how well a route fits the traveller's needs (0–100) and explains why.
 * Reasons and warnings are written in plain language for the UI.
 */
export function matchRoute(route, needs = {}) {
  const legAccess = route.legs.map((l) => ({ leg: l, a: vehicleAccess(l.vehicleId) }));
  const scores = legAccess.map((x) => x.a.score);
  const avg = scores.reduce((s, x) => s + x, 0) / Math.max(scores.length, 1);
  const min = Math.min(...scores);
  let score = avg * 0.4 + min * 0.6;
  const mobility = needs.wheelchair || needs.stepFree;
  score -= route.transfers.length * (mobility ? 6 : 2);

  const reasons = [];
  const warnings = [];

  if (legAccess.every((x) => x.a.stepFree)) reasons.push('Step-free vehicles on every part of the journey');
  else if (legAccess.every((x) => x.a.wheelchair)) reasons.push('Wheelchair-friendly vehicles on every part of the journey');
  legAccess.filter((x) => x.a.score < 70).forEach((x) => {
    warnings.push(`${x.leg.name} has no published step-free access.`);
  });
  if (route.transfers.length === 0) reasons.push('No changes: one vehicle from start to finish');
  route.transfers.forEach((t) => {
    reasons.push(`Step-free path with ${t.elevators} lifts at ${t.hubName}`);
    if (t.spareMin < 3) {
      warnings.push(`Only ${Math.max(t.spareMin, 0)} spare minutes to change at ${t.hubName}.`);
      score -= 10;
    }
  });
  if (needs.extraTime && route.transfers.length) {
    const minWindow = Math.min(...route.transfers.map((t) => t.windowMin));
    reasons.push(`${minWindow}-minute change buffer at every stop`);
    score += 3;
  }
  if (needs.assist || needs.wheelchair) {
    if (legAccess.some((x) => x.a.assisted)) reasons.push('Assisted boarding available and pre-booked for you');
  }
  if (needs.quiet && route.legs.some((l) => l.vehicleId === 'luxury-vehicle' || l.vehicleId === 'private-air')) reasons.push('Quiet cabin with soft lighting');

  score = Math.max(20, Math.min(99, Math.round(score)));
  const level = score >= 90 ? 'Excellent match' : score >= 78 ? 'Good match' : score >= 62 ? 'Partial match' : 'Poor match';
  return { score, level, reasons: [...new Set(reasons)].slice(0, 5), warnings };
}

export const hasMobilityNeeds = (needs = {}) => Boolean(needs.wheelchair || needs.stepFree);
