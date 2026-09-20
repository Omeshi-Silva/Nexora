import { useState } from 'react';
import Link from '../../components/common/GoLink';
import useJourneyRoute from '../../hooks/useJourneyRoute';
import DelayAlert from '../../components/transport/DelayAlert';
import JourneyRibbon from '../../components/transport/JourneyRibbon';
import TransferCard from '../../components/transport/TransferCard';
import { Card, KV, StatusBadge, Notice } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { disrupt } from '../../services/routeEngine';
import { serviceLive } from '../../services/realtimeService';
import { useApp } from '../../context/AppContext';
import { clock } from '../../utils/time';
import { money } from '../../utils/format';

/** D. Delays & Live Status, including a disruption demo and alternatives. */
export default function DelaysView() {
  const { route, active, needs, replaceSelected, pendingRebook, triggerDisruption } = useJourneyRoute();
  const { notify } = useApp();
  const [d, setD] = useState(null);
  const [details, setDetails] = useState(false);
  const shown = active ? pendingRebook : d;

  const simulate = () => {
    if (active) { triggerDisruption(); return; }
    setD(disrupt(route, needs));
  };
  const useAlternative = () => {
    replaceSelected(shown.alternative);
    notify({ type: 'journey', severity: 'success', title: 'Route changed', body: `New arrival ${clock(shown.alternative.arriveTime)}.` });
    setD(null);
  };
  const keep = () => {
    replaceSelected(shown.kept);
    notify({ type: 'journey', severity: 'info', title: 'Keeping your route', body: `Updated arrival ${clock(shown.kept.arriveTime)}.${shown.impact.missedConnection ? ' Moved to the next departure.' : ''}` });
    setD(null);
  };

  return (
    <div className="stack">
      <Card variant={route.delayMin ? 'warn' : 'ok'} pad>
        <div className="spread">
          <div>
            <p className="tiny faint">Live status</p>
            <h2 className="h2">{route.delayMin ? `${route.delayMin} minutes late` : 'On time'}</h2>
          </div>
          <StatusBadge tone={route.delayMin ? 'warn' : 'ok'}>{route.delayMin ? 'Delayed' : 'No delays'}</StatusBadge>
        </div>
        <KV rows={[
          ['Current delay', route.delayMin ? `${route.delayMin} min` : 'None'],
          ['Expected delay', route.congestionRisk ? 'Up to 4 min on Ring Road 2' : 'None expected'],
          ['Cancellations', 'None'],
          ['Congestion', route.congestionRisk ? 'Heavy on Ring Road 2' : 'Light on your route'],
          ['Updated ETA', clock(route.arriveTime)],
          ['Route status', 'Running'],
          ['Safety status', route.safety.status],
        ]} />
      </Card>

      <Card>
        <h2 className="h3">Each vehicle</h2>
        <ul className="stack stack--sm" style={{ listStyle: 'none', marginTop: 10 }}>
          {route.legs.map((l, i) => {
            const live = serviceLive(l.vehicleId);
            return (
              <li key={i} className="spread">
                <span className="row"><Icon name={l.icon} size={18} /><span><strong>{l.name}</strong><span className="small muted" style={{ display: 'block' }}>{l.fleetId}, {live.status === 'Busy' ? 'busy, extra vehicle on the way' : 'vehicle available'}</span></span></span>
                <StatusBadge tone={l.delayMin ? 'warn' : 'ok'}>{l.delayMin ? `+${l.delayMin} min, ${l.delayReason || 'traffic'}` : 'On time'}</StatusBadge>
              </li>
            );
          })}
        </ul>
      </Card>

      {shown ? (
        <>
          <DelayAlert
            minutes={shown.delayMin}
            reason={`${shown.reason} is slowing ${shown.vehicleName} ${shown.fleetId}.`}
            suggestion={shown.alternative ? `Alternative route available. This saves approximately ${shown.impact.timeSaved} minutes${shown.impact.priceDiff > 0 ? ` for ${money(shown.impact.priceDiff)} more` : ''}.` : 'No faster route right now. NEXORA will keep watching and update your arrival time.'}
            actions={active ? <Button to="/live" variant="primary">Review on live map</Button> : (
              <>
                {shown.alternative && <Button variant="primary" onClick={useAlternative}>Use alternative</Button>}
                <Button onClick={keep}>Keep current route</Button>
                <Button variant="ghost" onClick={() => setDetails((x) => !x)} aria-expanded={details}>Show details</Button>
              </>
            )}
          />
          {details && !active && (
            <div className="grid-2">
              <Card><p className="tiny faint">Current route if you keep it</p><p className="h3">Arrive {clock(shown.impact.keptArrive)}</p><JourneyRibbon route={shown.kept} /></Card>
              {shown.alternative && <Card variant="live"><p className="tiny faint">Alternative</p><p className="h3">Arrive {clock(shown.impact.altArrive)}</p><JourneyRibbon route={shown.alternative} /></Card>}
            </div>
          )}
          {route.transfers[0] && !active && <TransferCard transfer={route.transfers[0]} index={0} predictedDelay={shown.delayMin} onAlternative={shown.alternative ? useAlternative : undefined} />}
        </>
      ) : (
        <Card>
          <div className="row row--top">
            <span className="card-icon card-icon--ai"><Icon name="sparkles" size={20} /></span>
            <div className="stack stack--sm grow">
              <h2 className="h3">NEXORA is watching your journey</h2>
              <p className="small muted">NEXORA checks traffic, weather, vehicle health and connections every few seconds. If something changes, you get an alert and a better option. It never changes your route without asking.</p>
              <div className="btn-row"><Button variant="ai" icon="alert" onClick={simulate}>Simulate a disruption</Button></div>
              <p className="tiny faint">Demo: see how smart rebooking works.</p>
            </div>
          </div>
        </Card>
      )}
      <Notice>Service information: <Link to="panel:services">see the status of every transport service</Link>.</Notice>
    </div>
  );
}
