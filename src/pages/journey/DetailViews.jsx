import { useState } from 'react';
import useJourneyRoute from '../../hooks/useJourneyRoute';
import useNow from '../../hooks/useNow';
import TransportModeCard from '../../components/transport/TransportModeCard';
import TransferCard from '../../components/transport/TransferCard';
import JourneyTimeline from '../../components/transport/JourneyTimeline';
import AccessibilityCard from '../../components/transport/AccessibilityCard';
import SafetyCard from '../../components/transport/SafetyCard';
import FareBreakdown from '../../components/transport/FareBreakdown';
import MobilityHubCard from '../../components/transport/MobilityHubCard';
import JourneyRibbon from '../../components/transport/JourneyRibbon';
import { Card, KV, StatusBadge, Notice, Switch, CheckList, Stat } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { useApp } from '../../context/AppContext';
import { journeyConfidence } from '../../components/journey/JourneyCorridor';
import { getVehicle } from '../../data/vehicles';
import { clock, duration, countdown, MIN } from '../../utils/time';
import { money } from '../../utils/format';

/** B. Transport Modes */
export function ModesView() {
  const { route } = useJourneyRoute();
  return (
    <div className="stack">
      <p className="muted">Your journey uses {route.legs.length} {route.legs.length === 1 ? 'mode' : 'modes'} of transport. Open any mode for every detail.</p>
      {route.legs.map((leg, i) => <TransportModeCard key={i} leg={leg} index={i} total={route.legs.length} transferAfter={route.transfers[i]} />)}
    </div>
  );
}

/** C. Arrival & Departure, with live countdowns. */
export function TimesView() {
  const { route } = useJourneyRoute();
  const now = useNow(1000);
  const first = route.legs[0];
  const leaving = first.departTime - now;
  return (
    <div className="stack">
      <Card variant="live" pad>
        <div className="grid-2">
          <div>
            <p className="tiny faint">Departure</p>
            <p className="big-time">{clock(route.departTime)}</p>
            <p className="small muted">{leaving > 0 ? `Leaves in ${countdown(first.departTime, now)}` : 'Departed'}</p>
          </div>
          <div>
            <p className="tiny faint">Arrival</p>
            <p className="big-time">{clock(route.arriveTime)}</p>
            <p className="small muted">Estimated arrival, {route.delayMin ? `${route.delayMin} min delay included` : 'on time'}</p>
          </div>
        </div>
        <div className="stats" style={{ marginTop: 14 }}>
          <Stat label="Boarding begins" value={clock(first.boardTime)} />
          <Stat label={first.family === 'air' ? 'Gate' : first.family === 'rail' ? 'Platform' : 'Pickup'} value={first.fromPoint} />
          <Stat label="Travel time" value={duration(route.legs.reduce((s, l) => s + l.minutes, 0))} />
          <Stat label="Waiting time" value={duration(route.transfers.reduce((s, t) => s + t.windowMin, 0))} note="At changes" />
          <Stat label="Remaining" value={duration(Math.max(0, (route.arriveTime - now) / MIN))} />
          <Stat label="Status" value={route.delayMin ? 'Delayed' : 'On time'} />
        </div>
      </Card>
      {route.legs.map((leg, i) => (
        <Card key={i}>
          <div className="spread">
            <h3 className="h3 row"><Icon name={leg.icon} size={20} />{leg.name}</h3>
            <StatusBadge tone={leg.delayMin ? 'warn' : 'ok'}>{leg.delayMin ? `${leg.delayMin} min late` : 'On time'}</StatusBadge>
          </div>
          <KV two rows={[
            ['Station or hub', leg.fromName],
            [leg.family === 'air' ? 'Gate' : leg.family === 'rail' ? 'Platform' : 'Boarding point', leg.fromPoint],
            ['Boarding begins', clock(leg.boardTime)],
            ['Departs', clock(leg.departTime)],
            ['Arrives', `${clock(leg.arriveTime)} at ${leg.toPoint}`],
            ['Leaves in', leg.departTime > now ? countdown(leg.departTime, now) : 'Departed'],
          ]} />
        </Card>
      ))}
    </div>
  );
}

/** E. Transfers & Connections */
export function TransfersView() {
  const { route } = useJourneyRoute();
  if (!route.transfers.length) {
    return <Notice tone="ok">No changes on this journey. One vehicle takes you from {route.fromName} to {route.toShort}.</Notice>;
  }
  return (
    <div className="stack">
      <p className="muted">{route.transfers.length} {route.transfers.length === 1 ? 'change' : 'changes'}. Every path is step-free, with lifts and glowing floor guidance.</p>
      {route.transfers.map((t, i) => (
        <div key={i} className="stack">
          <TransferCard transfer={t} index={i} />
          <MobilityHubCard hubId={t.hubId} />
        </div>
      ))}
    </div>
  );
}

/** F. Journey Timeline */
export function TimelineView() {
  const { route } = useJourneyRoute();
  return <Card pad><JourneyTimeline route={route} /></Card>;
}

/** G. Accessibility */
export function AccessibilityView() {
  const { route, needs } = useJourneyRoute();
  const { prefs, setPref } = useApp();
  return (
    <div className="stack">
      <AccessibilityCard route={route} needs={needs} />
      <Card>
        <h2 className="h3">Step by step</h2>
        <ul className="stack stack--sm" style={{ listStyle: 'none', marginTop: 10 }}>
          {route.legs.map((l, i) => (
            <li key={i} className="row row--top">
              <Icon name={l.access.stepFree ? 'check' : 'alert'} size={18} style={{ color: l.access.stepFree ? 'var(--ok)' : 'var(--warn)', flexShrink: 0, marginTop: 3 }} />
              <span><strong>{l.name}:</strong> {l.access.label}.{l.access.assisted ? ' Assisted boarding available.' : ''}</span>
            </li>
          ))}
          {route.transfers.map((t) => (
            <li key={t.hubId} className="row row--top"><Icon name="elevator" size={18} style={{ color: 'var(--ok)', flexShrink: 0, marginTop: 3 }} /><span><strong>{t.hubName}:</strong> {t.elevators} lifts, step-free path, {t.movementMin} min to move.</span></li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="h3">Update your needs</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>NEXORA re-plans instantly when you change these.</p>
        <div className="grid-2">
          <Switch checked={prefs.stepFree} onChange={(v) => setPref('stepFree', v)} label="Step-free routes" icon="stairs" />
          <Switch checked={prefs.wheelchair} onChange={(v) => { setPref('wheelchair', v); if (v) setPref('stepFree', true); }} label="Wheelchair accessible" icon="wheelchair" />
          <Switch checked={prefs.extraTime} onChange={(v) => setPref('extraTime', v)} label="Extra time to change" icon="clock" />
          <Switch checked={prefs.simplified} onChange={(v) => setPref('simplified', v)} label="Simplified instructions" icon="list" />
        </div>
      </Card>
      <Notice>If a lift is out of service, NEXORA warns you before you reach it and finds another step-free path. Staff help is available at every hub: tap Safety and help.</Notice>
    </div>
  );
}

/** H. Safety */
export function SafetyView() {
  const { route } = useJourneyRoute();
  return (
    <div className="stack">
      <SafetyCard safety={route.safety} />
      {route.emergency && (
        <Card variant="bad">
          <h2 className="h3">Emergency status</h2>
          <KV rows={[['Route clearance', 'Priority corridor active'], ['Hospital', route.toName], ['Hospital notified', 'Yes, team waiting at entrance'], ['Emergency contact', 'NEXORA Care, call 2100'], ['ETA', clock(route.arriveTime)]]} />
        </Card>
      )}
      <Card>
        <h2 className="h3">If something goes wrong</h2>
        <CheckList items={['Every vehicle has an emergency button and a two-way voice link.', 'Your live location can be shared with a trusted contact in one tap.', 'Stations are staffed and monitored around the clock.']} />
        <div className="btn-row" style={{ marginTop: 12 }}><Button to="panel:profile:help" icon="shield">Safety and help</Button></div>
      </Card>
    </div>
  );
}

/** I. Price / Fare, with sustainability. */
export function FareView() {
  const { route, routes } = useJourneyRoute();
  const [usePass, setUsePass] = useState(true);
  const worst = Math.max(...routes.map((r) => r.energyKwh), route.energyKwh);
  return (
    <div className="stack">
      <Card pad>
        <div className="spread"><h2 className="h3">Fare breakdown</h2><StatusBadge tone="info" icon="lock">No hidden fees</StatusBadge></div>
        {route.fare.note && <Notice tone="ok">{route.fare.note}</Notice>}
        <FareBreakdown fare={route.fare} usePass={usePass} />
        <Switch checked={usePass} onChange={setUsePass} label="Pay with NEXORA Pass" hint={`Saves ${money(route.fare.passSaving)} on this journey`} icon="wallet" />
        {route.hasEstimate && <p className="tiny faint" style={{ marginTop: 8 }}>Some vehicles have no published fare, so NEXORA shows an estimate. You will see the final price before paying.</p>}
      </Card>
      <Card>
        <h2 className="h3 row"><Icon name="leaf" size={20} style={{ color: 'var(--ok)' }} />Environmental impact</h2>
        <div className="stats" style={{ marginTop: 12 }}>
          <Stat label="Energy used" value={`${route.energyKwh} kWh`} />
          <Stat label="CO₂ avoided" value={`${route.co2SavedKg} kg`} note="Compared with a 2020s petrol car" />
          <Stat label="Eco score" value={`${route.ecoScore}/100`} />
          <Stat label="Distance" value={`${route.totalKm} km`} />
        </div>
        <ul className="stack stack--sm" style={{ listStyle: 'none', marginTop: 12 }}>
          {route.legs.map((l, i) => {
            const v = getVehicle(l.vehicleId);
            return <li key={i} className="spread small"><span>{l.name}</span><span className="muted">{v.energy}, {v.eco ? `${v.eco.toLowerCase()} impact` : 'impact not published'}</span></li>;
          })}
        </ul>
        <p className="small muted" style={{ marginTop: 12 }}>Compared with your other options this journey uses {Math.round((route.energyKwh / (worst || 1)) * 100)}% of the energy of the most energy-hungry one. All NEXORA vehicles charge from Aurora's renewable smart grid, many wirelessly at hubs.</p>
      </Card>
    </div>
  );
}

/** J. Why this is the best option */
export function BestOptionView() {
  const { route, routes, results, needs } = useJourneyRoute();
  const others = routes.filter((r) => r.id !== route.id).slice(0, 3);
  const factors = [
    ['Journey confidence', `${journeyConfidence(route)}%, based on delays and transfer buffers`],
    ['Time', `${duration(route.durationMin)}, ${route.tags?.includes('Fastest') ? 'the fastest option' : 'close to the fastest'}`],
    ['Safety', route.safety.status === 'Clear' ? 'Clear, no incidents' : route.safety.summary],
    ['Accessibility', `${route.access.score}%, ${route.access.level.toLowerCase()}`],
    ['Availability', route.legs[0].onDemand ? `Vehicle ready, pickup in ${route.pickupMin} min` : `Next departure ${clock(route.legs[0].departTime)}`],
    ['Transfers', route.transferCount ? `${route.transferCount}, all with safe step-free paths` : 'None'],
    ['Comfort', `${route.comfort} out of 5`],
    ['Cost', money(route.price)],
    ['Energy', `${route.energyKwh} kWh, eco score ${route.ecoScore}`],
    ['Congestion', route.congestionRisk ? 'Some traffic expected and included' : 'Avoids today’s heavy traffic'],
    ['Weather', 'Stable, no effect expected'],
    ['Your needs', Object.keys(needs).filter((k) => needs[k]).length ? Object.keys(needs).filter((k) => needs[k]).join(', ').replace('stepFree', 'step-free').replace('extraTime', 'extra time') : 'None set'],
  ];
  return (
    <div className="stack">
      <Card variant="ai" pad>
        <StatusBadge tone="ai">Why this route?</StatusBadge>
        <p className="h3" style={{ margin: '12px 0' }}>{route.summary}</p>
        <p className="small muted">NEXORA compared {results?.considered || routes.length} possible routes across {results?.modesChecked || 'several'} transport types and weighed them for a {route.purpose} trip.</p>
      </Card>
      <Card>
        <h2 className="h3">What it considered</h2>
        <KV rows={factors} />
      </Card>
      {others.length > 0 && (
        <Card>
          <h2 className="h3">Why not the others?</h2>
          <ul className="stack" style={{ listStyle: 'none', marginTop: 10 }}>
            {others.map((o) => {
              const diffs = [];
              if (o.durationMin > route.durationMin) diffs.push(`${o.durationMin - route.durationMin} min slower`);
              if (o.durationMin < route.durationMin) diffs.push(`${route.durationMin - o.durationMin} min faster`);
              if (o.price > route.price) diffs.push(`${money(o.price - route.price)} more`);
              if (o.price < route.price) diffs.push(`${money(route.price - o.price)} cheaper`);
              if (o.transferCount > route.transferCount) diffs.push('more changes');
              if (o.access.score < route.access.score - 4) diffs.push('less accessible');
              return (
                <li key={o.id} className="stack stack--sm">
                  <JourneyRibbon route={o} />
                  <p className="small muted">{diffs.join(', ') || 'Very similar'}. Overall it fits your trip less well.</p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
