import { memo } from 'react';
import Icon from '../common/Icon';
import { HUBS, PLACE_BY_ID } from '../../data/places';
import { familyColor } from '../transport/JourneyRibbon';
import { toSvgPath } from '../../utils/geometry';
import { LOOP_PATHS, AMBIENT } from '../../services/realtimeService';
import { FAMILIES, PROBLEM } from '../../data/vehicles';
import Miniature from './Miniatures';

export { MapBackground } from './CityScene';

export const MAP_W = 1000;
export const MAP_H = 700;

/**
 * Each category sits in its own lane so overlapping roads stay readable:
 * ground and smart roads are nudged apart, and air is lifted above everything.
 */
export const CAT_OFFSET = { ground: [-3, -3], smart: [3, 3], rail: [0, 0], air: [0, -18] };
export const catOffset = (f) => CAT_OFFSET[f] || [0, 0];

/** Loops per category, derived from the simulated fleet (one source of truth). */
export const CATEGORY_LOOPS = AMBIENT.reduce((acc, a) => {
  if (!acc[a.filter]) acc[a.filter] = new Set();
  acc[a.filter].add(a.loop);
  return acc;
}, {});

/** A hub takes the colour of the network it mainly serves: rail, then air, otherwise smart roads. */
export const hubKind = (hub) => (hub.points?.rail || hub.points?.metro ? 'rail' : hub.points?.air ? 'air' : 'smart');

const SMART_NODES = (() => {
  const seen = new Map();
  [...(CATEGORY_LOOPS.smart || [])].forEach((k) => LOOP_PATHS[k].forEach(([x, y]) => seen.set(`${x},${y}`, [x, y])));
  return [...seen.values()];
})();
export const AI_NODE = [500, 360];

/** Every simulated route drawn in its category colour, with moving particles. Air floats above. */
export const NetworkRoutes = memo(function NetworkRoutes({ filter, focusLoop, showAir }) {
  const cats = ['ground', 'smart', 'rail', 'air'].filter((c) => filter === 'all' || filter === c);
  return (
    <g className="net-routes">
      {cats.map((cat) => {
        if (cat === 'air' && !showAir) return null;
        const [ox, oy] = catOffset(cat);
        return [...(CATEGORY_LOOPS[cat] || [])].map((loop) => {
          const d = toSvgPath(LOOP_PATHS[loop]);
          const cls = focusLoop ? (focusLoop === loop ? 'is-focus' : 'is-dim') : '';
          return (
            <g key={loop} className={`net-route net-route--${cat} ${cls}`} style={{ '--c': FAMILIES[cat].color }} transform={`translate(${ox} ${oy})`}>
              {cat === 'air' && <path d={d} className="net-route__shadow" transform={`translate(0 ${-oy})`} />}
              <path d={d} className="net-route__halo" />
              <path d={d} className="net-route__line" />
              <path d={d} className="net-route__flow" />
            </g>
          );
        });
      })}
    </g>
  );
});

/** Smart roads: connected intersections that pulse slowly. */
export const SmartInfra = memo(function SmartInfra() {
  return (
    <g className="smart-infra" aria-hidden="true">
      {SMART_NODES.map(([x, y], i) => (
        <g key={`${x}-${y}`} transform={`translate(${x + 3} ${y + 3})`} className="smart-node">
          <circle r="9" className="smart-node__pulse" style={{ animationDelay: `${(i % 5) * 0.6}s` }} />
          <rect x="-4" y="-4" width="8" height="8" rx="2" transform="rotate(45)" className="smart-node__core" />
        </g>
      ))}
    </g>
  );
});

/** Vehicle-to-infrastructure links from each smart vehicle. */
export function SmartLinks({ vehicles, selectedId }) {
  const [ox, oy] = catOffset('smart');
  return (
    <g className="smart-links" aria-hidden="true">
      {vehicles.filter((v) => v.family === 'smart').map((v) => {
        const vx = v.x + ox;
        const vy = v.y + oy;
        let best = SMART_NODES[0];
        let bd = Infinity;
        SMART_NODES.forEach((n) => { const d = (n[0] - vx) ** 2 + (n[1] - vy) ** 2; if (d < bd) { bd = d; best = n; } });
        return (
          <g key={v.id}>
            <line x1={vx} y1={vy} x2={best[0] + 3} y2={best[1] + 3} className="smart-link" />
            {selectedId === v.id && <line x1={vx} y1={vy} x2={AI_NODE[0]} y2={AI_NODE[1]} className="smart-link smart-link--ai" />}
          </g>
        );
      })}
    </g>
  );
}

const hubSub = (hub, kind) => (Object.keys(hub.points || {}).length >= 3 ? 'Multi-Modal' : kind === 'air' ? 'Air Mobility Hub' : kind === 'rail' ? 'Rail Hub' : 'Smart Mobility Hub');

/** Station / mobility hub marker, coloured by the network it serves. */
export function StationMarker({ hub, scale, accessible, onSelect, dim, showLabel = true }) {
  const kind = hubKind(hub);
  const sub = hubSub(hub, kind);
  const left = hub.id === 'hub-east';
  const width = Math.max(hub.short.length * 6.6, sub.length * 5.6) + 20;
  return (
    <g
      className={`map-station map-station--${kind} ${dim ? 'is-dim' : ''}`}
      style={{ '--c': FAMILIES[kind].color }}
      transform={`translate(${hub.x} ${hub.y}) scale(${scale})`}
      role="button"
      tabIndex={0}
      aria-label={`${hub.name}. ${FAMILIES[kind].label} hub. ${hub.elevators} lifts, step-free.`}
      onClick={() => onSelect?.(hub)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(hub); } }}
    >
      <circle r="18" className="map-station__pulse" />
      {showLabel && (
        <g transform={`translate(${left ? -18 - width : 18} -17)`} className="map-station__label">
          <rect width={width} height="34" rx="11" className="map-station__pill" />
          <text x="10" y="15" className="map-station__name">{hub.short}</text>
          <text x="10" y="27" className="map-station__sub">{sub}</text>
        </g>
      )}
      <circle r="13.5" className="map-station__box" />
      <g transform="translate(-7.5 -7.5)" className="map-station__icon"><Icon name={kind === 'air' ? 'airtaxi' : kind === 'rail' ? 'train' : 'building'} size={15} strokeWidth={2} /></g>
      {accessible && (
        <g transform="translate(12 -22)">
          <circle r="10" className="map-a11y-dot" />
          <g transform="translate(-7 -7)"><Icon name="elevator" size={14} strokeWidth={2.2} /></g>
        </g>
      )}
    </g>
  );
}

/**
 * The traveller's journey, one colour per leg. The active leg glows, finished legs calm down,
 * upcoming legs are slightly dimmed. A leg hit by a problem turns red.
 */
export function RoutePath({ route, progressLegIdx = -1, activeLegIdx = -1, issueLegIdx = -1, alt, dimmed }) {
  if (!route) return null;
  return (
    <g className={`map-route ${alt ? 'map-route--alt' : ''} ${dimmed ? 'is-dim' : ''}`}>
      {route.legs.map((leg, i) => {
        const d = toSvgPath(leg.path);
        const issue = i === issueLegIdx;
        const state = i < progressLegIdx ? 'is-done' : i === activeLegIdx ? 'is-active' : activeLegIdx >= 0 ? 'is-upcoming' : '';
        const color = issue ? PROBLEM.color : familyColor(leg.family);
        const [ox, oy] = catOffset(leg.family);
        return (
          <g key={`${leg.vehicleId}-${i}`} className={`${state} ${issue ? 'is-issue' : ''}`} style={{ '--c': color }} transform={`translate(${ox} ${oy})`}>
            <path d={d} className="map-route__halo" />
            <path d={d} className="map-route__line" strokeDasharray={alt ? '6 8' : leg.family === 'air' ? '10 8' : undefined} />
            {!alt && <path d={d} className="map-route__flow" />}
          </g>
        );
      })}
      {!alt && route.transfers.map((t) => {
        const leg = route.legs[t.idx];
        const p = leg.path[leg.path.length - 1];
        return (
          <g key={t.hubId} transform={`translate(${p[0]} ${p[1]})`} className="map-transfer">
            <circle r="9" />
            <g transform="translate(-6 -6)"><Icon name="swap" size={12} strokeWidth={2.4} /></g>
          </g>
        );
      })}
    </g>
  );
}

const SHORT = (n = '') => n
  .replace(/^Autonomous /, '')
  .replace('High-Speed Maglev Express', 'Maglev Express')
  .replace('eVTOL City-to-City Vehicle', 'eVTOL')
  .replace('Private Air Mobility Vehicle', 'Private Air')
  .replace('Smart-Road Autonomous Vehicle', 'Smart-Road Vehicle');

/**
 * Any moving vehicle, drawn as a small miniature of its real type (car, van, bus, train, aircraft).
 * Category colour = type; a red ring = a problem, so a delayed taxi stays green.
 * lod: far (miniature only), mid, near (adds the name).
 */
export function VehicleMarker({ v, scale, selected, mine, onSelect, reduced, lod = 'mid', dim, match, issue }) {
  const color = familyColor(v.family);
  const [ox, oy] = catOffset(v.family);
  const air = v.family === 'air';
  const showLabel = mine || selected || match || lod === 'near';
  const emphasis = mine || selected || match;
  const hit = mine ? 18 : 13;
  return (
    <g
      className={`map-vehicle cat-${v.family} ${selected ? 'is-selected' : ''} ${mine ? 'is-mine' : ''} ${v.concept ? 'is-concept' : ''} ${dim ? 'is-dim' : ''} ${match ? 'is-match' : ''} ${issue ? 'has-issue' : ''}`}
      style={{ transform: `translate(${v.x + ox}px, ${v.y + oy}px) scale(${scale})`, transition: reduced ? 'none' : 'transform 520ms linear', '--c': color }}
      role="button"
      tabIndex={0}
      aria-label={`${mine ? 'Your vehicle: ' : ''}${v.name} ${v.fleetId}, ${FAMILIES[v.family].label}. ${v.status || ''}. Next stop ${v.nextStop || ''}.`}
      onClick={() => onSelect?.(v)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(v); } }}
    >
      {air && <g className="map-shadow" aria-hidden="true"><line x1="0" y1="0" x2="0" y2={-oy} /><ellipse cx="0" cy={-oy} rx="9" ry="3.4" /></g>}
      {issue && <circle r="14" className="map-issue" />}
      {emphasis && <circle r={mine ? 17 : 14} className="map-vehicle__pulse" />}
      {emphasis && <circle r={mine ? 13 : 11} className="map-vehicle__ring" />}
      <circle r={hit} className="map-vehicle__hit" />
      <g className="map-vehicle__model" transform={`scale(${mine ? 1.5 : 1.15})`}>
        <Miniature vehicleId={v.vehicleId} family={v.family} angle={v.angle || 0} />
      </g>
      {showLabel && <text y={-hit - 6} textAnchor="middle" className="map-tag">{mine ? v.fleetId : SHORT(v.name)}</text>}
    </g>
  );
}

/** A red problem marker. Severity sets size and animation: low is small, medium glows, critical pulses. */
export function IncidentMarker({ inc, scale, selected, onSelect }) {
  const r = { low: 8, medium: 12, critical: 15 }[inc.severity];
  return (
    <g
      className={`map-incident sev-${inc.severity} ${selected ? 'is-selected' : ''}`}
      transform={`translate(${inc.at[0]} ${inc.at[1]}) scale(${scale})`}
      role="button"
      tabIndex={0}
      aria-label={`${inc.severity} problem: ${inc.title}, ${inc.location}. Delay ${inc.delayMin} minutes.`}
      onClick={() => onSelect?.(inc)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(inc); } }}
    >
      {inc.severity !== 'low' && <circle r={r + 8} className="map-incident__ring" />}
      {inc.severity === 'critical' && <circle r={r + 8} className="map-incident__ring map-incident__ring--2" />}
      <circle r={r + 6} className="map-vehicle__hit" />
      <circle r={r} className="map-incident__body" />
      <g transform={`translate(${-r * 0.6} ${-r * 0.6})`} className="map-incident__icon"><Icon name="alert" size={r * 1.2} strokeWidth={2.4} /></g>
    </g>
  );
}

/** The affected stretch of road, rail or air corridor, drawn in red. */
export function IncidentPath({ inc }) {
  const [ox, oy] = catOffset(inc.category);
  return (
    <g className={`incident-path sev-${inc.severity}`} transform={`translate(${ox} ${oy})`} aria-hidden="true">
      <path d={toSvgPath(inc.path)} className="incident-path__halo" />
      <path d={toSvgPath(inc.path)} className="incident-path__line" />
    </g>
  );
}

export function UserMarker({ x, y, scale }) {
  return (
    <g className="map-user" transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
      <circle r="22" className="map-user__halo" />
      <circle r="9" className="map-user__dot" />
      <text y="-18" textAnchor="middle" className="map-tag">You</text>
    </g>
  );
}

export function DestinationMarker({ x, y, label, scale }) {
  return (
    <g className="map-dest" transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
      <path d="M0 0 C-12 -16 -14 -22 -14 -28 A14 14 0 0 1 14 -28 C14 -22 12 -16 0 0 Z" className="map-dest__pin" />
      <g transform="translate(-8 -36)"><Icon name="flag" size={16} strokeWidth={2.2} /></g>
      <text y="18" textAnchor="middle" className="map-label map-label--dest">{label}</text>
    </g>
  );
}

export const HUB_LIST = Object.values(HUBS);
export const placeById = (id) => PLACE_BY_ID[id];
