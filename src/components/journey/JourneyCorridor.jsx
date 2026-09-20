import { Fragment } from 'react';
import Icon from '../common/Icon';
import { StatusBadge } from '../common/ui';
import { familyColor } from '../transport/JourneyRibbon';
import { vehicleImage } from '../../data/vehicleImages';
import { useSimple } from '../../context/AppContext';
import { clock } from '../../utils/time';

/** A small, honest 0–99 score: starts high, loses points for delay and thin transfer buffers. */
export function journeyConfidence(route) {
  if (!route) return 0;
  let score = 97 - (route.delayMin || 0) * 2;
  route.transfers.forEach((t) => {
    if (t.status === 'tight') score -= 8;
    else if (t.status === 'at-risk' || t.status === 'rebooked') score -= 18;
  });
  return Math.max(55, Math.min(99, Math.round(score)));
}

function LegCard({ leg, state, live }) {
  const simple = useSimple();
  const img = vehicleImage(leg.vehicleId);
  const mins = leg.minutes + (leg.delayMin || 0);
  const a = leg.access || {};
  return (
    <li className={`leg is-${state} ${state === 'current' && !live ? 'is-static' : ''}`} style={{ '--c': familyColor(leg.family) }} aria-current={state === 'current' && live ? 'step' : undefined}>
      <div className="leg__media">
        {img ? <img src={img.sm} srcSet={`${img.sm} 640w, ${img.lg} 1200w`} sizes="(min-width: 960px) 620px, 92vw" alt={`${leg.name}, concept illustration`} loading="lazy" decoding="async" /> : <Icon name={leg.icon} size={56} strokeWidth={1.3} />}
        <div className="leg__tag">
          <strong>{leg.name}</strong>
          <StatusBadge tone={leg.delayMin ? 'warn' : 'ok'}>{leg.delayMin ? `+${leg.delayMin} min` : state === 'done' ? 'Done' : 'On time'}</StatusBadge>
        </div>
      </div>
      <div className="leg__body">
        <p className="leg__times"><span><strong className="num">{clock(leg.departTime)}</strong> to <strong className="num">{clock(leg.arriveTime)}</strong></span><span>{mins} min</span></p>
        {simple && <p className="small muted">{leg.plainInstruction}</p>}
        <div className="leg__flags">
          {a.stepFree ? <span className="badge"><Icon name="check" size={14} />Step-free</span> : a.wheelchair ? <span className="badge"><Icon name="wheelchair" size={14} />Wheelchair-friendly</span> : <span className="badge"><Icon name="hand" size={14} />Boarding help available</span>}
          {a.assisted && <span className="badge"><Icon name="hand" size={14} />Assisted boarding</span>}
        </div>
      </div>
    </li>
  );
}

/**
 * The journey as a spatial corridor: home, then each vehicle with its real image,
 * hubs between them, then the destination. The current leg is largest, upcoming legs
 * a little smaller, finished legs calm. Plain ordered list, so it reads well without sight.
 */
export default function JourneyCorridor({ route, activeIdx = 0, live = false, phase = 'leg' }) {
  const n = route.legs.length;
  const doneBefore = live ? (phase === 'transfer' ? activeIdx + 1 : activeIdx) : 0;
  const current = live ? (phase === 'transfer' ? activeIdx + 1 : activeIdx) : 0;
  const stateOf = (i) => (i < doneBefore ? 'done' : i === current ? 'current' : 'next');
  return (
    <ol className="corr" aria-label="Your journey, step by step">
      <li className="corr__place">
        <span className="corr__pin"><Icon name="home" size={20} /></span>
        <span><strong>{route.fromName}</strong><small>Leave {clock(route.departTime)}</small></span>
      </li>
      <li className={`corr__link ${live && doneBefore > 0 ? 'is-lit' : ''}`} aria-hidden="true">{clock(route.departTime)}</li>
      {route.legs.map((leg, i) => {
        const tr = route.transfers[i];
        return (
          <Fragment key={`${leg.vehicleId}-${i}`}>
            <LegCard leg={leg} state={stateOf(i)} live={live} />
            <li className={`corr__link ${live && i < doneBefore ? 'is-lit' : ''}`} aria-hidden="true">{leg.minutes + (leg.delayMin || 0)} min</li>
            {i < n - 1 && (
              <>
                <li className="corr__place">
                  <span className="corr__pin" style={{ color: 'var(--ok)' }}><Icon name="swap" size={20} /></span>
                  <span><strong>{leg.toName}</strong><small>Transfer hub</small></span>
                </li>
                <li className={`corr__link is-transfer ${live && i < doneBefore ? 'is-lit' : ''}`}>
                  <Icon name="shield" size={16} />&nbsp;{tr ? `${tr.windowMin} min transfer, protected` : 'Transfer'}
                </li>
              </>
            )}
          </Fragment>
        );
      })}
      <li className="corr__place">
        <span className="corr__pin" style={{ color: 'var(--violet-ink)' }}><Icon name="flag" size={20} /></span>
        <span><strong>{route.toName}</strong><small>Arrive {clock(route.arriveTime)}</small></span>
      </li>
    </ol>
  );
}
