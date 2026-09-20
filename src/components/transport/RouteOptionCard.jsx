import Icon from '../common/Icon';
import { StatusBadge } from '../common/ui';
import JourneyRibbon from './JourneyRibbon';
import { clock, duration } from '../../utils/time';
import { money } from '../../utils/format';

export function accessTone(score) {
  return score >= 90 ? 'ok' : score >= 75 ? 'info' : score >= 60 ? 'warn' : 'bad';
}

/** One route option. Clicking selects; the whole card is a real button for keyboard users. */
export default function RouteOptionCard({ route, selected, recommended, onSelect, showReasons }) {
  const status = route.delayMin ? `${route.delayMin} min traffic delay included` : 'On time';
  return (
    <button
      type="button"
      className={`card route-card ${selected ? 'is-selected' : ''}`}
      data-route-id={route.id}
      onClick={() => onSelect?.(route.id)}
      aria-pressed={selected}
      aria-label={`${recommended ? 'Best option. ' : ''}${duration(route.durationMin)}, ${money(route.price)}, ${route.transferCount} changes, accessibility ${route.access.level}. Leaves ${clock(route.departTime)}, arrives ${clock(route.arriveTime)}.`}
    >
      <div className="row row--wrap" style={{ gap: 6 }}>
        {recommended && <StatusBadge tone="ai">Best option</StatusBadge>}
        {route.tags?.map((t) => <span key={t} className="badge">{t}</span>)}
      </div>
      <div className="route-card__top">
        <span className="route-card__time">{duration(route.durationMin)}</span>
        <span className="muted num">{clock(route.departTime)} to {clock(route.arriveTime)}</span>
        <span className="strong num" style={{ marginLeft: 'auto' }}>{money(route.price)}</span>
      </div>
      <JourneyRibbon route={route} />
      <div className="route-card__meta">
        <span><Icon name="swap" size={16} />{route.transferCount === 0 ? 'No changes' : `${route.transferCount} change${route.transferCount > 1 ? 's' : ''}`}</span>
        <span><Icon name="a11y" size={16} />{route.access.level}</span>
        <span className="adv"><Icon name="leaf" size={16} />Eco {route.ecoScore}</span>
        <span><Icon name={route.delayMin ? 'alert' : 'check'} size={16} />{status}</span>
      </div>
      {showReasons && route.reasons?.length > 0 && (
        <p className="small muted" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <Icon name="sparkles" size={14} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--violet-ink)' }} /> {route.reasons.slice(0, 2).map((r) => r.text).join('. ')}.
        </p>
      )}
    </button>
  );
}
