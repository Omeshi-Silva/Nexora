import { useState } from 'react';
import useGo from '../../hooks/useGo';
import useJourneyRoute from '../../hooks/useJourneyRoute';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { Card, StatusBadge, Stat, Notice, CheckList } from '../../components/common/ui';
import { familyColor } from '../../components/transport/JourneyRibbon';
import { VehicleThumb } from '../../components/transport/ServiceArt';
import ConfirmTripModal, { payStartLabel } from '../../components/booking/ConfirmTripModal';
import { clock, duration } from '../../utils/time';
import { money } from '../../utils/format';
import { useSimple } from '../../context/AppContext';

/** A. Selected Route: the whole journey at a glance, then the next action. */
export default function SelectedRoute() {
  const navigate = useGo();
  const simple = useSimple();
  const { route, active, results, toggleSaved, savedIds, needs } = useJourneyRoute();
  const [confirm, setConfirm] = useState(false);
  const recommended = results?.recommendedId === route.id;
  const saved = savedIds.includes(route.id);
  const mobility = needs.wheelchair || needs.stepFree;
  const tight = route.transfers.find((t) => t.status !== 'safe');

  return (
    <div className="stack stack--lg">
      <Card variant={recommended ? 'ai' : undefined} pad className="selected-card">
        <div className="row row--wrap" style={{ gap: 8 }}>
          {recommended && <StatusBadge tone="ai">Best option</StatusBadge>}
          {route.tags?.map((t) => <span key={t} className="badge">{t}</span>)}
          <StatusBadge tone={route.delayMin ? 'warn' : 'ok'}>{route.delayMin ? `Includes ${route.delayMin} min traffic` : 'On time'}</StatusBadge>
        </div>

        <ol className="sequence" aria-label="Journey sequence">
          <li className="sequence__place"><Icon name="home" size={18} /><span><strong>{route.fromName}</strong><small>{clock(route.departTime)}</small></span></li>
          {route.legs.map((leg, i) => (
            <li key={i} className="sequence__block">
              <div className="sequence__leg" style={{ '--c': familyColor(leg.family) }}>
                <span className="mode-icon mode-icon--sm" style={{ '--c': familyColor(leg.family) }}><Icon name={leg.icon} size={18} /></span>
                <VehicleThumb vehicleId={leg.vehicleId} icon={leg.icon} family={leg.family} size={40} />
                <span><strong>{leg.name}</strong><small>{simple ? leg.plainInstruction : `${leg.fleetId}, ${leg.minutes + (leg.delayMin || 0)} min, from ${leg.fromPoint}`}</small></span>
              </div>
              <div className="sequence__place">
                <Icon name={i === route.legs.length - 1 ? 'flag' : 'building'} size={18} />
                <span><strong>{i === route.legs.length - 1 ? route.toName : leg.toName}</strong><small>{clock(leg.arriveTime)}{route.transfers[i] ? `, change here (${route.transfers[i].windowMin} min)` : ''}</small></span>
              </div>
            </li>
          ))}
        </ol>

        <div className="stats">
          <Stat label="Total" value={duration(route.durationMin)} icon="clock" />
          <Stat label="Departure" value={clock(route.departTime)} note={route.legs[0].fromPoint} />
          <Stat label="Arrival (ETA)" value={clock(route.arriveTime)} />
          <Stat label="Transfers" value={route.transferCount} />
          <Stat label="Price" value={money(route.price)} note={route.hasEstimate ? 'Includes estimates' : 'All fees included'} />
          <Stat label="Accessibility" value={`${route.access.score}%`} note={route.access.level} />
          <Stat label="Safety" value={route.safety.status} />
          <Stat label="Status" value={route.delayMin ? `+${route.delayMin} min` : 'On time'} />
        </div>
      </Card>

      <Card>
        <h2 className="h3 row"><Icon name="sparkles" size={18} style={{ color: 'var(--violet-ink)' }} />Why NEXORA recommends this</h2>
        <p className="muted" style={{ margin: '8px 0 10px' }}>{route.summary}</p>
        <CheckList tone="ai" items={(route.reasons || []).map((r) => r.text)} />
      </Card>

      {mobility && route.access.warnings.length > 0 && (
        <Notice tone="warn" role="alert"><strong>{route.access.warnings[0]}</strong> An accessible alternative is available. <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/journey?view=alternatives&sort=accessible')}>Show accessible options</button></Notice>
      )}
      {tight && <Notice tone="warn">You have only {tight.spareMin} spare minutes to change at {tight.hubName}. <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/journey?view=transfers')}>See transfer details</button></Notice>}

      {active ? (
        <div className="sticky-cta btn-row">
          <Button variant="primary" size="lg" icon="map" to="/live">Track my journey</Button>
          <Button onClick={() => navigate('/journey?view=alternatives')} icon="swap">Change route</Button>
        </div>
      ) : (
        <>
          <div className="btn-row">
            <Button size="sm" icon="layers" onClick={() => navigate('/journey?view=alternatives')}>View alternatives</Button>
            <Button size="sm" icon="swap" onClick={() => navigate('/journey')}>Change route</Button>
            <Button size="sm" icon="save" onClick={() => toggleSaved(route)} success={saved}>{saved ? 'Saved' : 'Save journey'}</Button>
          </div>
          <div className="sticky-cta">
            <Button variant="primary" size="lg" block icon="check" onClick={() => setConfirm(true)}>{payStartLabel(route)}</Button>
          </div>
        </>
      )}
      <ConfirmTripModal route={route} open={confirm} onClose={() => setConfirm(false)} />
    </div>
  );
}
