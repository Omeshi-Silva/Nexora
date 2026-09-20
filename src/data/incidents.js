/**
 * Network problems shown on the Live Map. Red is reserved for these.
 * Severity: low (small indicator), medium (glowing marker), critical (pulsing warning halo).
 * `loops` names the simulated routes affected; `path` is the stretch drawn in red.
 * `cycle` and `duty` make problems come and go over time, so the network feels alive.
 */
export const SEVERITY_PENALTY = { low: 1, medium: 4, critical: 9 };

export const INCIDENTS = [
  { id: 'inc-ring2', severity: 'medium', category: 'smart', kind: 'Traffic disruption', title: 'Heavy traffic detected', location: 'Ring Road 2', loops: ['ringMid'], delayMin: 12, at: [530, 250], path: [[300, 250], [760, 250]], advice: 'Alternative route available. NEXORA is re-routing affected vehicles.', cycle: 0, duty: 1 },
  { id: 'inc-metro', severity: 'low', category: 'rail', kind: 'Rail disruption', title: 'Minor rail slowdown', location: 'Central Mobility Hub approach', loops: ['rail'], delayMin: 3, at: [400, 360], path: [[300, 360], [500, 360]], advice: 'Trains are running 2 to 3 minutes late. Transfers are still protected.', cycle: 240, duty: 0.7 },
  { id: 'inc-air', severity: 'critical', category: 'air', kind: 'Air route restriction', title: 'Air corridor restricted', location: 'North Vertiport approach', loops: ['air1'], delayMin: 9, at: [515, 95], path: [[430, 130], [600, 60]], advice: 'Strong crosswind. Flights hold at the vertiport or use the southern corridor.', cycle: 300, duty: 0.4 },
  { id: 'inc-south', severity: 'low', category: 'ground', kind: 'Road works', title: 'Lane closed for maintenance', location: 'South Ring', loops: ['south'], delayMin: 4, at: [400, 592], path: [[170, 592], [640, 592]], advice: 'Vehicles slow down through the works. No action needed.', cycle: 200, duty: 0.6 },
];

/** Incidents that are active right now. */
export function activeIncidents(now = Date.now()) {
  const t = now / 1000;
  return INCIDENTS.filter((i) => !i.cycle || ((t / i.cycle) % 1) < i.duty);
}

/** 0–100 network health after subtracting active problems. */
export function networkScore(base, incidents) {
  return Math.max(40, Math.round(base - incidents.reduce((s, i) => s + SEVERITY_PENALTY[i.severity], 0)));
}
