import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Link from '../components/common/GoLink';
import useGo from '../hooks/useGo';
import { useJourney, useLive } from '../context/JourneyContext';
import { useApp } from '../context/AppContext';
import RouteOptionCard from '../components/transport/RouteOptionCard';
import SearchPanel from '../components/home/SearchPanel';
import { RouteVisual, StatusCard, JourneySteps, TransportCard, LiveWatch } from '../components/journey/JourneyOverview';
import RebookAlert from '../components/journey/RebookAlert';
import ConfirmTripModal, { payStartLabel, payableFare } from '../components/booking/ConfirmTripModal';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import { Section, ErrorState, Notice } from '../components/common/ui';
import DelaysView from './journey/DelaysView';
import Alternatives from './journey/Alternatives';
import { ModesView, TimesView, TransfersView, TimelineView, AccessibilityView, SafetyView, FareView, BestOptionView } from './journey/DetailViews';
import { SORTS } from './journey/sorts';
import { PLACE_BY_ID, SCENARIOS } from '../data/places';
import { clock, duration } from '../utils/time';
import { money } from '../utils/format';

/** Three primary views. Everything else lives inside MORE. */
export const JOURNEY_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'steps', label: 'Steps' },
  { id: 'more', label: 'More' },
];

/** The detail views that used to be tabs, now one tap inside MORE. */
export const MORE_SECTIONS = [
  { id: 'alternatives', label: 'Alternatives', note: 'Compare other ways to get there', icon: 'swap', View: Alternatives },
  { id: 'modes', label: 'Transport', note: 'The vehicles on this journey', icon: 'bus', View: ModesView },
  { id: 'transfers', label: 'Transfers', note: 'Buffers, lifts and platforms', icon: 'swap', View: TransfersView },
  { id: 'accessibility', label: 'Accessibility', note: 'How this journey fits your needs', icon: 'a11y', View: AccessibilityView },
  { id: 'safety', label: 'Safety', note: 'Checks and safety features', icon: 'shield', View: SafetyView },
  { id: 'fare', label: 'Fare', note: 'Price and pass savings', icon: 'wallet', View: FareView },
  { id: 'best', label: 'Why this route?', note: 'How NEXORA chose it', icon: 'check', View: BestOptionView },
  { id: 'times', label: 'Times', note: 'Departures and arrivals', icon: 'clock', View: TimesView },
  { id: 'delays', label: 'Delays and live status', note: 'What NEXORA is watching', icon: 'alert', View: DelaysView },
  { id: 'routes', label: 'Compare all routes', note: 'Every option, sortable', icon: 'layers', View: null },
];

/** How the MORE buttons are grouped on screen. */
const MORE_GROUPS = [
  { title: 'Compare', ids: ['alternatives', 'routes', 'best'] },
  { title: 'Journey information', ids: ['modes', 'times', 'transfers', 'fare'] },
  { title: 'Safety and access', ids: ['accessibility', 'safety', 'delays'] },
];

/** Old deep links (?view=timeline, ?view=fare …) still land in the right place. */
function resolveView(search) {
  const p = new URLSearchParams(search);
  const view = p.get('view') || 'overview';
  if (view === 'overview' || view === 'selected') return { tab: 'overview' };
  if (view === 'steps' || view === 'timeline') return { tab: 'steps' };
  if (view === 'more') return { tab: 'more', section: p.get('section') };
  if (MORE_SECTIONS.some((s) => s.id === view)) return { tab: 'more', section: view };
  return { tab: 'overview' };
}

const ERRORS = {
  'same-place': ['You are already there', 'Your start and destination are the same place.', 'Choose a different destination.'],
  'no-routes': ['We couldn’t find a route matching your preferences', 'No vehicle can make this trip with every preference you selected.', 'Relax one preference, leave a little earlier, or change your search.'],
  'no-destination': ['Tell NEXORA where you want to go', 'NEXORA needs a destination to build your journey.', 'Type a place or tap a quick destination.'],
};

/** Every option to compare, kept inside MORE. */
function RoutesOverview({ onChoose, onScenario }) {
  const { results, routes, chosenId } = useJourney();
  const [sort, setSort] = useState('best');
  const sorted = (() => {
    const s = SORTS.find((x) => x.id === sort);
    return s?.fn ? [...routes].sort(s.fn) : routes;
  })();
  return (
    <>
      <Section id="all-options" title="Compare all routes" subtitle={`${routes.length} ways to get there. Each suits a different need.`}>
        <div className="scroller" role="group" aria-label="Sort routes" style={{ marginBottom: 6 }}>
          {SORTS.slice(0, 6).map((s) => <button key={s.id} type="button" className="chip" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>)}
        </div>
        <div className="grid-2">
          {sorted.map((r) => <RouteOptionCard key={r.id} route={r} recommended={r.id === results.recommendedId} selected={r.id === chosenId} onSelect={onChoose} showReasons />)}
        </div>
        <p className="tiny faint" style={{ marginTop: 10 }}>Live estimates, planned at {clock(results.generatedAt)}. NEXORA only uses its 20 approved vehicles across Ground, Smart Roads, Rail and Air.</p>
      </Section>
      <Section title="Example journeys" subtitle="See how NEXORA handles different needs.">
        <div className="scroller">
          {SCENARIOS.map((sc) => (
            <button key={sc.id} type="button" className="card scenario-card" onClick={() => onScenario(sc)}>
              <strong>{sc.title}</strong>
              <span className="small muted">{sc.description}</span>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

/** OVERVIEW: destination, arrival, status, steps, transport, one action. */
function Overview({ route, active, live, onStart, onWhy }) {
  const { pendingRebook, resolveRebook, toggleSaved, savedIds, needs, results, chosenId, selectRoute } = useJourney();
  const isChosen = chosenId === route.id;
  const go = useGo();
  const mobility = needs.wheelchair || needs.stepFree;
  const saved = savedIds.includes(route.id);
  const legIdx = live && !live.done ? live.legIdx : 0;
  const alternatives = () => go('/journey?view=more&section=alternatives');
  return (
    <>
      {active && pendingRebook && <RebookAlert disruption={pendingRebook} onSwitch={() => resolveRebook('switch')} onKeep={() => resolveRebook('keep')} />}

      {results?.modeFallback && <Notice tone="warn">None of your chosen ways of travelling can make this trip, so NEXORA is showing every option instead.</Notice>}

      <div className="jo-top">
        <RouteVisual route={route} active={active} currentLeg={legIdx} />
        <StatusCard route={route} active={active} onAlternatives={alternatives} />
      </div>

      <LiveWatch route={route} onDetails={() => go('/journey?view=more&section=delays')} />

      {mobility && route.access.warnings.length > 0 && (
        <div className="protected is-warn" role="alert"><Icon name="a11y" size={22} /><div><strong>CHECK ACCESS</strong><p>{route.access.warnings[0]} <button type="button" className="btn btn--ghost btn--sm" onClick={alternatives}>Show accessible options</button></p></div></div>
      )}

      <section className="jo-section" aria-labelledby="jo-steps-h">
        <h2 id="jo-steps-h" className="jo-h">JOURNEY STEPS</h2>
        <JourneySteps route={route} active={active} live={live} />
      </section>

      <section className="jo-section" aria-labelledby="jo-transport-h">
        <h2 id="jo-transport-h" className="jo-h">TRANSPORT</h2>
        <TransportCard route={route} mobility={mobility} />
      </section>

      <section className="why" aria-labelledby="why-h">
        <h2 id="why-h" className="why__h"><Icon name="check" size={18} />Why NEXORA chose this</h2>
        {(route.reasons || []).length > 0
          ? <ul className="why__list">{route.reasons.slice(0, 3).map((r) => <li key={r.text}><Icon name="check" size={16} />{r.text}</li>)}</ul>
          : <p className="small muted">NEXORA picked the best balance of time, cost and comfort for you.</p>}
        <button type="button" className="why__link" onClick={onWhy}>See full explanation <Icon name="next" size={16} /></button>
      </section>

      <div className="sticky-cta jr-cta">
        {active
          ? <Button variant="primary" size="lg" icon="map" to="/live">Continue journey</Button>
          : isChosen
            ? <Button variant="primary" size="lg" icon="check" onClick={onStart}>{payStartLabel(route)}</Button>
            : <Button variant="primary" size="lg" icon="check" onClick={() => selectRoute(route.id)}>Select this route</Button>}
        {!active && (
          <div className="jr-cta__row">
            <Button size="sm" icon="swap" onClick={() => go('/journey?view=more&section=alternatives')}>Other ways</Button>
            <Button size="sm" icon="save" onClick={() => toggleSaved(route)} success={saved}>{saved ? 'Saved' : 'Save'}</Button>
            {isChosen && <span className="small muted" style={{ alignSelf: 'center' }}>{money(payableFare(route))}</span>}
          </div>
        )}
      </div>
    </>
  );
}

/** MORE: every detail view, one tap away. */
function More({ section, route, onChoose, onScenario }) {
  const { toggleSaved, savedIds } = useJourney();
  const s = MORE_SECTIONS.find((x) => x.id === section);
  if (s) {
    const body = s.View ? <s.View /> : <RoutesOverview onChoose={onChoose} onScenario={onScenario} />;
    return (
      <div className="stack stack--lg">
        <Link to="/journey?view=more" className="more-back"><Icon name="back" size={18} />More about this journey</Link>
        <h2 className="nx-h2">{s.label}</h2>
        {body}
      </div>
    );
  }
  const saved = savedIds.includes(route.id);
  const item = (x) => (
    <li key={x.id}>
      <Link to={`/journey?view=more&section=${x.id}`}>
        <Icon name={x.icon} size={22} /><span className="grow">{x.label}<small>{x.note}</small></span><Icon name="next" size={18} />
      </Link>
    </li>
  );
  return (
    <div className="more-groups">
      {MORE_GROUPS.map((g) => (
        <section key={g.title} className="more-group" aria-labelledby={`more-${g.title}`}>
          <h3 className="more-group__h" id={`more-${g.title}`}>{g.title}</h3>
          <ul className="more-list more-list--grid">
            {g.ids.map((id) => MORE_SECTIONS.find((x) => x.id === id)).filter(Boolean).map(item)}
          </ul>
        </section>
      ))}
      <section className="more-group" aria-labelledby="more-actions">
        <h3 className="more-group__h" id="more-actions">Actions</h3>
        <ul className="more-list more-list--grid">
          <li><button type="button" onClick={() => toggleSaved(route)}><Icon name="save" size={22} /><span className="grow">{saved ? 'Saved to My Journeys' : 'Save'}<small>Find it again later</small></span></button></li>
          <li><Link to="panel:profile:help"><Icon name="share" size={22} /><span className="grow">Share<small>Let someone you trust follow your journey</small></span><Icon name="next" size={18} /></Link></li>
        </ul>
      </section>
    </div>
  );
}

/** PRIMARY PAGE 2: Journey. NEXORA found the simplest way. */
export default function JourneyPage() {
  const { search } = useLocation();
  const go = useGo();
  const { setA11yOpen } = useApp();
  const { tab, section } = resolveView(search);
  const { results, routes, query, selected, chosen, selectRoute, plan, trip } = useJourney();
  const { live } = useLive();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const active = Boolean(trip && !trip.completed);
  const route = active ? trip.route : selected;
  const to = PLACE_BY_ID[query.toId];
  const from = PLACE_BY_ID[query.fromId];

  const choose = (id) => {
    // Name only the card that was chosen, so it morphs into the overview.
    document.querySelectorAll('[data-route-id]').forEach((el) => { el.style.viewTransitionName = ''; });
    const src = document.querySelector(`[data-route-id="${CSS.escape(id)}"]`);
    if (src) src.style.viewTransitionName = 'nx-route';
    selectRoute(id);
    go('/journey');
  };
  const startPlan = (q) => { plan(q); go('/journey'); };
  const scenario = (sc) => startPlan({ fromId: sc.from, toId: sc.to, purpose: sc.purpose, needs: sc.needs, whenMode: sc.whenMode || 'now', time: sc.time || null });

  let body;
  if (results?.error) {
    const e = ERRORS[results.error] || ERRORS['no-routes'];
    body = <ErrorState title={e[0]} why={e[1]} next={e[2]} action={<div className="btn-row"><Button variant="primary" onClick={() => setA11yOpen(true)}>Change preferences</Button><Button onClick={() => setEditing(true)}>Change search</Button></div>} />;
  } else if (!routes.length || !route) {
    body = <div className="empty-hero"><h1>Tell NEXORA where you want to go.</h1><p className="nx-sub">It will find the simplest way and look after it until you arrive.</p><Button variant="primary" size="lg" to="/">Plan my journey</Button></div>;
  } else if (tab === 'steps') {
    body = <div className="steps-wrap"><p className="nx-sub">Plain steps, in order. {active ? 'Your current step is highlighted.' : ''}</p><TimelineView /></div>;
  } else if (tab === 'more') {
    body = <More section={section} route={route} onChoose={choose} onScenario={scenario} />;
  } else {
    body = <Overview route={route} active={active} live={live} onStart={() => setConfirm(true)} onWhy={() => go('/journey?view=more&section=best')} />;
  }

  const showTabs = routes.length > 0 && route && !results?.error;
  return (
    <div className="page container journey">
      <header className="journey-head">
        <div className="journey-head__od jr-title">
          <p className="nx-eyebrow">{active ? 'Active journey' : 'Your journey'}</p>
          <h1>{route ? `${route.fromName} → ${route.toName}` : `${from?.id === 'here' ? 'My location' : from?.name || from?.label} → ${to?.name || to?.label || 'somewhere'}`}</h1>
          <p className="small muted">{route
            ? `${active ? 'Journey under way' : query.whenMode === 'now' ? 'Leaving now' : query.whenMode === 'arrive' ? `Arrive by ${query.time}` : `Leave at ${query.time}`} · ${duration(route.durationMin)} · Arrive ${clock(route.arriveTime)}`
            : 'Leaving now'}</p>
        </div>
      </header>

      {showTabs && (
        <nav className="jtabs" aria-label="Journey views">
          {JOURNEY_TABS.map((t) => {
            const warn = t.id === 'overview' && (route.delayMin > 0 || route.transfers.some((x) => x.status !== 'safe'));
            return (
              <Link key={t.id} to={t.id === 'overview' ? '/journey' : `/journey?view=${t.id}`} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined}>
                {t.label}{warn && <span className="tab__warn" aria-label="needs attention" />}
              </Link>
            );
          })}
        </nav>
      )}

      <button type="button" className="select-journey" onClick={() => go('panel:services')}>
        <span className="select-journey__icon"><Icon name="search" size={24} /></span>
        <span className="select-journey__text"><strong>Choose your vehicle</strong><small>Browse all transport services</small></span>
        <Icon name="next" size={22} />
      </button>

      <div className="journey-view stack stack--lg" style={{ marginTop: 18 }}>{body}</div>

      <ConfirmTripModal route={chosen} open={confirm && Boolean(chosen)} onClose={() => setConfirm(false)} />
      <Modal open={editing} onClose={() => setEditing(false)} title="Change your journey" icon="search">
        <SearchPanel initial={query} onPlan={(q) => { setEditing(false); startPlan(q); }} onViewAll={() => { setEditing(false); go('panel:services'); }} />
      </Modal>    </div>
  );
}
