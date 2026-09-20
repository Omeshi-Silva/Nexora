import { useState } from 'react';
import Icon from '../common/Icon';
import { CATEGORIES, PROBLEM } from '../../data/vehicles';

const NAMES = { ground: 'Ground', smart: 'Smart Roads', rail: 'Rail', air: 'Air' };

/** One list drives the filter bar, the legend and the panels, so colours can never drift apart. */
export const MAP_FILTERS = [
  { id: 'all', label: 'All', color: null },
  ...CATEGORIES.map((c) => ({ id: c.id, label: NAMES[c.id], color: c.color, glow: c.glow })),
  { id: 'problems', label: 'Problems', color: PROBLEM.color, glow: PROBLEM.glow },
];

/** Category filter (horizontally scrollable on phones) plus a search that highlights matches. */
export function MapFilterBar({ filter, onFilter, query, onQuery, suggestions, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="map-filterbar scroller" role="group" aria-label="Show on map">
        {MAP_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="map-chip-btn"
            style={f.color ? { '--c': f.color, '--g': f.glow } : undefined}
            aria-pressed={filter === f.id}
            onClick={() => onFilter(f.id)}
          >
            {f.color && <span className="dot" aria-hidden="true" />}{f.label}
          </button>
        ))}
      </div>
      <button type="button" className="map-ctl map-search-btn" aria-label="Search the map" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Icon name="search" size={22} /></button>
      {open && (
        <div className="map-search glass" role="search">
          <Icon name="search" size={20} />
          <input
            autoFocus
            type="search"
            value={query}
            placeholder="Vehicle, station, Skyport, Maglev, Air Taxi…"
            aria-label="Search vehicles, stations and categories"
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); } if (e.key === 'Enter' && suggestions[0]) onPick(suggestions[0]); }}
          />
          <button type="button" className="icon-btn" aria-label="Close search" onClick={() => { onQuery(''); setOpen(false); }}><Icon name="close" size={20} /></button>
          {query.trim() && (
            <ul className="map-search__list">
              {suggestions.length === 0 && <li className="muted small" style={{ padding: 12 }}>Nothing matches. Try “Taxi”, “Maglev” or “Skyport”.</li>}
              {suggestions.map((s) => (
                <li key={`${s.kind}-${s.id}`}>
                  <button type="button" onClick={() => onPick(s)} style={{ '--c': s.color }}>
                    <span className="dot" aria-hidden="true" /><span><strong>{s.label}</strong><small>{s.sub}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

/** Network health, shown as one small live indicator. */
export function NetworkPill({ score, count }) {
  const tone = score >= 95 ? 'ok' : score >= 80 ? 'warn' : 'bad';
  const text = { ok: 'Normal', warn: 'Minor disruptions', bad: 'Disruptions detected' }[tone];
  return (
    <div className={`net-pill net-pill--${tone}`} role="status" aria-label={`Network ${score} percent. ${text}. ${count} active problems.`}>
      <span className="dot" aria-hidden="true" />
      <span className="net-pill__full"><b>NETWORK {score}%</b><small>{text}</small></span>
      <span className="net-pill__short" aria-hidden="true">{tone === 'ok' ? 'Network stable' : tone === 'warn' ? 'Minor disruption' : 'Disruptions'}</span>
    </div>
  );
}

/** Compact glass legend. Every dot carries the same glow as its map elements. */
export function MapLegend() {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 900);
  const rows = [...CATEGORIES.map((c) => ({ id: c.id, label: NAMES[c.id] === 'Ground' ? 'Autonomous Ground' : NAMES[c.id] === 'Air' ? 'Air Mobility' : NAMES[c.id], color: c.color, glow: c.glow })), { id: 'problem', label: 'Problem / Incident', color: PROBLEM.color, glow: PROBLEM.glow }];
  return (
    <div className="map-legend-wrap">
      <button type="button" className="map-legend-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Icon name="layers" size={18} />Legend</button>
      {open && (
        <div className="map-legend glass" role="group" aria-label="Transport network legend">
          <p className="map-legend__title">TRANSPORT NETWORK</p>
          <ul>
            {rows.map((r) => <li key={r.id} style={{ '--c': r.color, '--g': r.glow }}><span className="dot" aria-hidden="true" />{r.label}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
