import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useGo from '../../hooks/useGo';
import useJourneyRoute from '../../hooks/useJourneyRoute';
import JourneyRibbon from '../../components/transport/JourneyRibbon';
import { ConfirmationModal } from '../../components/common/Modal';
import { Notice, KV, StatusBadge } from '../../components/common/ui';
import Icon from '../../components/common/Icon';
import { useApp } from '../../context/AppContext';
import { SORTS } from './sorts';
import { duration, clock } from '../../utils/time';
import { money } from '../../utils/format';

/** Compare-by options not offered as chips on this screen. */
const HIDDEN_SORTS = ['comfort', 'fewest', 'eco', 'family', 'business'];

/** One simplified route: key facts and a Choose button, with the rest behind "See details". */
function AltRouteCard({ route: r, name, recommended, selected, onChoose }) {
  const [open, setOpen] = useState(false);
  const panelId = `alt-details-${r.id}`;
  const changes = r.transferCount === 0 ? 'No transfers' : `${r.transferCount} transfer${r.transferCount > 1 ? 's' : ''}`;
  return (
    <article className={`card alt-card ${selected ? 'is-selected' : ''}`} data-route-id={r.id}>
      <div className="alt-card__main">
        <div className="alt-card__info">
          <div className="row row--wrap" style={{ gap: 8 }}>
            <h3 className="alt-card__name">{name}</h3>
            {recommended && <StatusBadge tone="ai">Best option</StatusBadge>}
          </div>
          <p className="alt-card__headline num">{duration(r.durationMin)} · {money(r.price)}</p>
          <p className="alt-card__meta">
            <span><Icon name="swap" size={16} />{changes}</span>
            <span><Icon name="a11y" size={16} />{r.access.score}% accessible</span>
          </p>
        </div>
        <button type="button" className="btn btn--primary alt-card__choose" onClick={onChoose} aria-label={`Choose ${name}: ${duration(r.durationMin)}, ${money(r.price)}, ${changes}, ${r.access.score}% accessible`}>
          {selected ? 'Selected' : 'Choose'}
        </button>
      </div>
      <button type="button" className="alt-card__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide details' : 'See details'}
      </button>
      {open && (
        <div id={panelId} className="alt-card__details stack stack--sm">
          <JourneyRibbon route={r} />
          <p className="muted num">{clock(r.departTime)} to {clock(r.arriveTime)} · {r.delayMin ? `${r.delayMin} min traffic delay included` : 'On time'}</p>
          <p className="muted">Access: {r.access.level} · Eco {r.ecoScore} · Comfort {r.comfort}</p>
          {r.tags?.length > 0 && <div className="row row--wrap" style={{ gap: 6 }}>{r.tags.map((t) => <span key={t} className="badge">{t}</span>)}</div>}
          {r.reasons?.length > 0 && <p className="small muted">{r.reasons.slice(0, 2).map((x) => x.text).join('. ')}.</p>}
        </div>
      )}
    </article>
  );
}

/** K. Alternative Routes and route comparison, with a summary of the differences. */
export default function Alternatives() {
  const navigate = useGo();
  const { search } = useLocation();
  const initial = new URLSearchParams(search).get('sort') || 'best';
  const { route, routes, selectRoute, results, active, chosenId } = useJourneyRoute();
  const { notify } = useApp();
  const [sort, setSort] = useState(initial);
  const [pick, setPick] = useState(null);
  const list = useMemo(() => {
    const s = SORTS.find((x) => x.id === sort);
    return s?.fn ? [...routes].sort(s.fn) : routes;
  }, [routes, sort]);

  const summary = useMemo(() => {
    if (routes.length < 2) return 'There is only one suitable route for this journey.';
    const fast = [...routes].sort(SORTS[1].fn)[0];
    const cheap = [...routes].sort(SORTS[2].fn)[0];
    const acc = [...routes].sort(SORTS[3].fn)[0];
    const parts = [`The fastest takes ${duration(fast.durationMin)} for ${money(fast.price)}`];
    if (cheap.id !== fast.id) parts.push(`the cheapest costs ${money(cheap.price)} but takes ${duration(cheap.durationMin)}`);
    if (acc.id !== fast.id && acc.id !== cheap.id) parts.push(`the most accessible scores ${acc.access.score}%`);
    return `${parts.join(', ')}. The best option balances these for your trip.`;
  }, [routes]);

  const confirmSwitch = () => {
    selectRoute(pick.id);
    notify({ type: 'journey', severity: 'success', title: 'Route changed', body: `You will arrive at ${clock(pick.arriveTime)}.` });
    setPick(null);
    navigate('/journey?view=selected');
  };

  return (
    <div className="stack">
      <Notice tone="ai"><strong>Summary: </strong>{summary}</Notice>
      {active && <Notice tone="warn">You are already travelling. To change route mid-journey, use the live map, where NEXORA offers alternatives from where you are now.</Notice>}
      <div className="scroller" role="group" aria-label="Compare by">
        {SORTS.filter((s) => !HIDDEN_SORTS.includes(s.id)).map((s) => <button key={s.id} type="button" className="chip" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>)}
      </div>
      <div className="alt-list">
        {list.map((r, i) => (
          <AltRouteCard
            key={r.id}
            route={r}
            name={`Route ${String.fromCharCode(65 + i)}`}
            recommended={r.id === results?.recommendedId}
            selected={r.id === chosenId}
            onChoose={() => {
              if (active || r.id === chosenId) navigate('/journey?view=selected');
              else if (r.id === route.id) { selectRoute(r.id); navigate('/journey?view=selected'); }
              else setPick(r);
            }}
          />
        ))}
      </div>
      <ConfirmationModal open={Boolean(pick)} onClose={() => setPick(null)} onConfirm={confirmSwitch} title="Switch to this route?" icon="swap" confirmLabel="Switch route">
        {pick && (
          <div className="stack">
            <JourneyRibbon route={pick} />
            <KV rows={[
              ['Arrival', `${clock(pick.arriveTime)} (${pick.arriveTime < route.arriveTime ? `${Math.round((route.arriveTime - pick.arriveTime) / 60000)} min earlier` : pick.arriveTime > route.arriveTime ? `${Math.round((pick.arriveTime - route.arriveTime) / 60000)} min later` : 'same time'})`],
              ['Cost difference', pick.price > route.price ? `${money(pick.price - route.price)} more` : pick.price < route.price ? `${money(route.price - pick.price)} less` : 'Same price'],
              ['Changes', `${pick.transferCount} (now ${route.transferCount})`],
            ]} />
            <StatusBadge tone={pick.access.score >= route.access.score - 5 ? 'ok' : 'warn'} icon="a11y">Accessibility: {pick.access.score >= route.access.score - 5 ? 'Compatible with your needs' : `Lower match (${pick.access.score}%)`}</StatusBadge>
            {pick.access.warnings[0] && <p className="small muted"><Icon name="alert" size={14} style={{ display: 'inline' }} /> {pick.access.warnings[0]}</p>}
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}
