import Icon from '../common/Icon';
import Button from '../common/Button';
import { familyColor } from '../transport/JourneyRibbon';
import { vehicleImage } from '../../data/vehicleImages';
import { getVehicle, CATEGORIES } from '../../data/vehicles';
import cityNight from '../../assets/city-night.webp';
import useNow from '../../hooks/useNow';
import { activeIncidents } from '../../data/incidents';
import { clock, duration, MIN } from '../../utils/time';

const familyLabel = (id) => CATEGORIES.find((c) => c.id === id)?.short || '';

/** One plain status for the whole journey, worked out from the route's own delay and transfer data. */
export function journeyStatus(route) {
  const risk = route.transfers.find((t) => t.status === 'at-risk' || t.status === 'rebooked');
  const tight = route.transfers.find((t) => t.status === 'tight');
  if (risk) return { tone: 'warn', icon: 'alert', head: 'CONNECTION AT RISK', note: 'Your next connection may be affected.', alternatives: true };
  if (route.delayMin > 0) return { tone: 'warn', icon: 'alert', head: `+${route.delayMin} min delay`, note: route.transfers.length ? 'Connection still achievable' : `Arrival updated to ${clock(route.arriveTime)}` };
  if (tight) return { tone: 'warn', icon: 'alert', head: 'On track, tight change', note: `${tight.windowMin} min to change at ${tight.hubName}.` };
  return { tone: 'ok', icon: 'check', head: 'On track', note: route.transfers.length ? 'Your connection is protected.' : 'No changes on this journey.' };
}

/** Route on a night-city map: glowing family-coloured path, a marker per vehicle, hubs, origin and destination. */
export function RouteVisual({ route, active = false, currentLeg = 0 }) {
  const n = route.legs.length;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const wobble = i === 0 || i === n ? 0 : (i % 2 ? -9 : 9);
    return { x: 13 + t * 74, y: 74 - t * 30 + wobble };
  });
  const seg = (a, b) => { const mx = (a.x + b.x) / 2; return `M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`; };
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="jo-route" role="group" aria-label={`Route from ${route.fromName} to ${route.toName}`}>
      <img className="jo-bg" src={cityNight} alt="" loading="lazy" decoding="async" />
      <svg className="jo-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {n > 0 && pts.slice(0, -1).map((a, i) => {
          const c = familyColor(route.legs[i].family);
          const lit = !active || i <= currentLeg;
          return (
            <g key={i} style={{ '--c': c }}>
              <path d={seg(a, pts[i + 1])} className="jo-map__glow" vectorEffect="non-scaling-stroke" opacity={lit ? 1 : 0.4} />
              <path d={seg(a, pts[i + 1])} className="jo-map__line" vectorEffect="non-scaling-stroke" opacity={lit ? 1 : 0.55} />
            </g>
          );
        })}
        {active && !reduce && (
          <circle r="1.1" className="jo-map__pulse">
            <animateMotion dur="6s" repeatCount="indefinite" path={seg(pts[Math.min(currentLeg, n - 1)], pts[Math.min(currentLeg, n - 1) + 1])} />
          </circle>
        )}
      </svg>
      <span className="jo-chip"><i />{active ? 'Live route' : 'Planned route'}</span>

      {route.legs.map((leg, i) => {
        const m = mid(pts[i], pts[i + 1]);
        const mins = leg.minutes + (leg.delayMin || 0);
        const now = active && i === currentLeg;
        return (
          <div key={i} className={`jo-bubble ${now ? 'is-now' : ''} ${leg.delayMin ? 'is-warn' : ''}`} style={{ left: `${m.x}%`, top: `${m.y}%`, '--c': familyColor(leg.family) }}>
            <span className="jo-bubble__pill"><Icon name={leg.icon} size={18} />{mins} min{leg.delayMin ? ' ⚠' : ''}</span>
            <span className="jo-bubble__veh"><Icon name={leg.icon} size={20} /></span>
          </div>
        );
      })}

      {pts.map((p, i) => {
        const first = i === 0; const end = i === n;
        const name = first ? route.fromName : end ? route.toName : route.legs[i - 1].toName;
        const sub = first ? clock(route.departTime) : end ? clock(route.arriveTime) : 'Transfer';
        return (
          <div key={i} className={`jo-stop ${first ? 'is-start' : ''} ${end ? 'is-end' : ''} ${!first && !end ? 'is-hub' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className="jo-stop__pin"><Icon name={first ? 'home' : end ? 'flag' : 'swap'} size={18} /></span>
            <span className="jo-stop__label"><strong>{name}</strong><small>{sub}</small></span>
          </div>
        );
      })}
    </div>
  );
}

/** Arrival + status in one card. Replaces confidence, "no changes", "on track" and arrival copy. */
export function StatusCard({ route, active, onAlternatives }) {
  const now = useNow(30000);
  const s = journeyStatus(route);
  const remaining = Math.max(0, Math.round((route.arriveTime - now) / MIN));
  return (
    <section className={`jo-status is-${s.tone}`} aria-label="Arrival and journey status">
      <small className="jo-label">ARRIVAL</small>
      <p className="jo-status__time num">{clock(route.arriveTime)}</p>
      <p className="jo-status__head"><Icon name={s.icon} size={20} />{s.head}</p>
      <p className="jo-status__note">{s.note}</p>
      <p className="jo-status__note">{active ? `${duration(remaining)} remaining` : `${duration(route.durationMin)} journey`}</p>
      {s.alternatives && <Button size="sm" icon="swap" onClick={onAlternatives}>See alternatives</Button>}
    </section>
  );
}

/** Vertical timeline built only from the route's real legs and transfers: time, icon node, place, status on the right. */
export function JourneySteps({ route, active, live }) {
  const steps = [];
  route.legs.forEach((leg, i) => {
    steps.push({ key: `l${i}`, kind: 'ride', legIdx: i, time: leg.departTime, leg });
    const tr = route.transfers[i];
    if (tr) steps.push({ key: `t${i}`, kind: 'transfer', legIdx: i, time: leg.arriveTime, tr });
  });
  const cur = active && live && !live.done
    ? steps.findIndex((s) => s.legIdx === live.legIdx && s.kind === (live.phase === 'transfer' ? 'transfer' : 'ride'))
    : -1;

  return (
    <ol className="jo-steps" aria-label="Journey steps">
      {steps.map((s, i) => {
        const isCur = i === cur;
        let c; let icon; let mode; let title; let sub; let tone; let flag; let flagIcon; let meta;
        if (s.kind === 'ride') {
          const { leg } = s;
          const mins = leg.minutes + (leg.delayMin || 0);
          c = familyColor(leg.family); icon = leg.icon; mode = familyLabel(leg.family).toUpperCase();
          title = `Board ${leg.name}`;
          sub = `${leg.fromName} → ${leg.toName}`;
          meta = `${leg.km ? `${leg.km} km · ` : ''}${mins} min`;
          if (leg.delayMin) { tone = 'warn'; flagIcon = 'alert'; flag = `+${leg.delayMin} min`; sub += `. Arrival updated to ${clock(leg.arriveTime)}`; } else { tone = 'ok'; flagIcon = 'check'; flag = 'On time'; }
        } else {
          const { tr } = s;
          const bad = tr.status !== 'safe';
          c = 'var(--ok)'; icon = 'swap'; mode = 'TRANSFER'; title = `Change at ${tr.hubName}`;
          sub = `${tr.movementMin} min step-free walk`; meta = `${tr.windowMin} min connection`;
          tone = bad ? 'warn' : 'ok'; flagIcon = bad ? 'alert' : 'shield'; flag = bad ? 'Connection risk' : 'Protected';
          if (bad) sub += `. ${tr.windowMin} min transfer window remaining`;
        }
        return (
          <li key={s.key} className={`jo-step ${isCur ? 'is-now' : ''}`} style={{ '--c': c }} aria-current={isCur ? 'step' : undefined}>
            <span className="jo-step__time num">{clock(s.time)}</span>
            <span className="jo-step__dot"><Icon name={icon} size={16} /></span>
            <div className="jo-step__body">
              <p className="jo-step__mode">{mode}{isCur && <b className="jo-now">Current step</b>}</p>
              <p className="jo-step__title">{title}</p>
              <p className="jo-step__sub">{sub}</p>
            </div>
            <div className="jo-step__side">
              <span className={`jo-pill is-${tone}`}><Icon name={flagIcon} size={14} />{flag}</span>
              <span className="jo-step__meta">{meta}</span>
            </div>
          </li>
        );
      })}
      <li className="jo-step jo-step--end" style={{ '--c': 'var(--violet-ink)' }}>
        <span className="jo-step__time num">{clock(route.arriveTime)}</span>
        <span className="jo-step__dot"><Icon name="flag" size={16} /></span>
        <div className="jo-step__body">
          <p className="jo-step__mode">ARRIVE</p>
          <p className="jo-step__title">{route.toName}</p>
        </div>
      </li>
    </ol>
  );
}

/** One compact supporting card per vehicle on the journey. */
export function TransportCard({ route, mobility }) {
  return (
    <div className="jo-transport-list">
      {route.legs.map((leg, i) => {
        const v = getVehicle(leg.vehicleId);
        const img = vehicleImage(leg.vehicleId);
        const a = leg.access || {};
        const mins = leg.minutes + (leg.delayMin || 0);
        const direct = route.legs.length === 1;
        return (
          <article key={i} className="jo-transport" style={{ '--c': familyColor(leg.family) }}>
            <div className="jo-transport__img">{img ? <img src={img.sm} alt={`${leg.name}, concept illustration`} loading="lazy" decoding="async" /> : <Icon name={leg.icon} size={34} />}</div>
            <div className="jo-transport__body">
              <h3><Icon name={leg.icon} size={18} />{leg.name}</h3>
              <p className="jo-step__sub">{mins} min{direct ? ' · Direct' : ''}</p>
              <p className="jo-tags">
                {a.stepFree || a.wheelchair
                  ? <span><Icon name="wheelchair" size={16} />Wheelchair friendly</span>
                  : mobility ? <span className="is-warn"><Icon name="alert" size={16} />Ask for boarding help</span> : null}
                {(a.assisted || !(a.stepFree || a.wheelchair)) && <span><Icon name="check" size={16} />Boarding help available</span>}
              </p>
              {v && (
                <dl className="jo-facts">
                  {v.speed?.[1] && <div><dt>Top speed</dt><dd>{v.speed[1]} km/h</dd></div>}
                  {v.passengers && <div><dt>Passengers</dt><dd>{v.passengers}</dd></div>}
                  {v.power && <div><dt>Power</dt><dd>{v.power}</dd></div>}
                </dl>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Live conditions on the categories this journey uses, so problems show on Overview without opening More. */
export function LiveWatch({ route, onDetails }) {
  const now = useNow(15000);
  const hits = activeIncidents(now).filter((i) => route.families.includes(i.category));
  const heavyRoads = route.congestionRisk && !hits.some((i) => i.category === 'smart');
  const clear = !hits.length && !heavyRoads;
  return (
    <section className={`jo-watch ${clear ? 'is-ok' : 'is-warn'}`} aria-label="Live conditions on your route" aria-live="polite">
      <h2 className="jo-h">LIVE ON YOUR ROUTE</h2>
      {clear ? (
        <p className="jo-watch__row"><Icon name="check" size={18} /><span>No problems reported on {route.families.map((f) => familyLabel(f)).join(', ')}.</span></p>
      ) : (
        <ul>
          {hits.map((i) => (
            <li key={i.id} className="jo-watch__row"><Icon name="alert" size={18} /><span><strong>{i.title}</strong> at {i.location}. Up to {i.delayMin} min. {i.advice}</span></li>
          ))}
          {heavyRoads && <li className="jo-watch__row"><Icon name="alert" size={18} /><span><strong>Heavy traffic</strong> on Ring Road 2. Already included in your arrival time.</span></li>}
        </ul>
      )}
      <button type="button" className="btn btn--ghost btn--sm" onClick={onDetails}>Delays and live status</button>
    </section>
  );
}
