import { useState } from 'react';
import useGo from '../../hooks/useGo';
import { useJourney } from '../../context/JourneyContext';
import { useApp } from '../../context/AppContext';
import { Card, Stat, EmptyState, Notice } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import JourneyRibbon from '../../components/transport/JourneyRibbon';
import { fareTotal } from '../../components/transport/FareBreakdown';
import { clock, duration } from '../../utils/time';
import { money } from '../../utils/format';

/** Journey completion: arrival, final fare, environmental impact, feedback, save or repeat. */
export default function CompletePanel() {
  const navigate = useGo();
  const { lastCompleted, endTrip, toggleSaved, plan, trip } = useJourney();
  const { notify } = useApp();
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const [recalled, setRecalled] = useState(false);
  const route = lastCompleted?.route;
  if (!route) return <div className="panel-body"><EmptyState icon="flag" title="No completed journey yet" action={<Button variant="primary" to="/">Plan a journey</Button>}>When you arrive, your journey summary appears here.</EmptyState></div>;
  const last = route.legs[route.legs.length - 1];
  const parkable = last.onDemand && (last.family === 'ground' || last.family === 'smart');
  const done = () => { if (trip) endTrip('completed'); navigate('/'); };
  const arrivedOnTime = !route.delayMin;
  return (
    <div className="panel-body stack stack--lg">
      <div className="done-card" role="status">
        <span className="card-icon card-icon--ok"><Icon name="check" size={34} strokeWidth={2.4} /></span>
        <p className="nx-eyebrow">Journey complete</p>
        <h1>You arrived at {route.toShort || route.toName}</h1>
        <div className="live-eta"><b className="num">{clock(route.arriveTime)}</b><span>{arrivedOnTime ? 'On time' : `${route.delayMin} min late`} · {duration(route.durationMin)} · {money(fareTotal(route.fare, true))}</span></div>
        <JourneyRibbon route={route} />
        <div className="done-actions">
          <Button variant="primary" size="lg" icon="refresh" onClick={() => { if (trip) endTrip('completed'); plan({ fromId: route.toId, toId: route.fromId, purpose: route.purpose, needs: [] }); navigate('/journey'); }}>Plan return journey</Button>
          <Button onClick={done}>Done</Button>
        </div>
      </div>

      <details className="done-more">
        <summary>More about this journey</summary>
        <div className="stack stack--lg" style={{ paddingTop: 12 }}>
          <div className="stats">
            <Stat label="Total time" value={duration(route.durationMin)} />
            <Stat label="Final fare" value={money(fareTotal(route.fare, true))} note="Paid with NEXORA Pass" />
            <Stat label="CO₂ avoided" value={`${route.co2SavedKg} kg`} note={`${route.energyKwh} kWh used`} />
          </div>
          {parkable && (
            <Card>
              <div className="row row--top">
                <span className="card-icon"><Icon name="car" size={22} /></span>
                <div className="grow stack stack--sm">
                  <h2 className="h3">{recalled ? 'Vehicle returning' : 'Vehicle parked at Smart Mobility Hub B'}</h2>
                  <p className="small muted">{recalled ? `${last.fleetId} is on its way back to you. ETA 4 min.` : `${last.fleetId} is charging wirelessly at Bay B-2. You can call it back for your return trip.`}</p>
                  <Button size="sm" disabled={recalled} onClick={() => { setRecalled(true); notify({ type: 'arrival', severity: 'info', title: 'Vehicle returning', body: `${last.fleetId} will reach you in about 4 minutes.` }); }}>{recalled ? 'On its way' : 'Call vehicle back'}</Button>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <h2 className="h3">How was your journey?</h2>
            <div className="row" role="radiogroup" aria-label="Rate your journey" style={{ margin: '10px 0' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} className={`icon-btn star-btn ${n <= rating ? 'is-on' : ''}`} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}>
                  <Icon name="star" size={26} />
                </button>
              ))}
            </div>
            {sent ? <Notice tone="ok" role="status">Thank you. Your feedback helps NEXORA plan better journeys.</Notice> : <Button size="sm" disabled={!rating} onClick={() => setSent(true)}>Send feedback</Button>}
          </Card>
          <div className="btn-row">
            <Button icon="save" onClick={() => { toggleSaved(route); notify({ type: 'journey', severity: 'success', title: 'Journey saved', body: 'Find it in My Journeys.' }); }}>Save journey</Button>
            <Button icon="ticket" to="panel:profile:pass">View travel pass</Button>
          </div>
        </div>
      </details>
    </div>
  );
}
