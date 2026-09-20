import useGo from '../../hooks/useGo';
import { getVehicle } from '../../data/vehicles';
import { PLACES } from '../../data/places';
import ServiceArt from '../../components/transport/ServiceArt';
import { Card, KV, Notice, StatusBadge, ErrorState } from '../../components/common/ui';
import Button from '../../components/common/Button';
import { serviceLive } from '../../services/realtimeService';
import { planJourney, kmBetween, point } from '../../services/routeEngine';
import { vehicleAccess } from '../../services/accessibilityService';
import { useJourney } from '../../context/JourneyContext';
import useNow from '../../hooks/useNow';
import { range, money } from '../../utils/format';
import { clock, MIN } from '../../utils/time';


/** L. Transport Service Details. */
export default function VehicleDetailPanel({ id }) {
  const navigate = useGo();
  const { plan, previewRoute, routes, query } = useJourney();
  const now = useNow(5000);
  const v = getVehicle(id);
  if (!v) return <div className="panel-body"><ErrorState title="Service not found" why="This link does not match any NEXORA service." next="Open the explorer to browse every service." action={<Button to="panel:services">Open explorer</Button>} /></div>;
  const live = serviceLive(v.id, now);
  const access = vehicleAccess(v);
  const purpose = v.id === 'child-safe-vehicle' ? 'school' : v.id === 'step-free-vehicle' ? 'accessibility' : v.id === 'corporate-shuttle' ? 'work' : v.id === 'luxury-vehicle' || v.id === 'private-air' ? 'special' : 'everyday';
  const target = PLACES.find((p) => p.id !== 'here' && (() => { const k = kmBetween(point('here'), point(p.id)); return k >= v.distance[0] && k <= v.distance[1] && k > 2; })());
  const sample = target ? planJourney({ fromId: 'here', toId: target.id, purpose, needs: {} }) : null;
  const sampleRoute = sample?.routes.find((r) => r.legs.some((l) => l.vehicleId === v.id));
  const start = sampleRoute ? sampleRoute.departTime : now + (live.eta || 5) * MIN;

  // Prefer a route on the traveller's current journey that uses this vehicle.
  const currentRoute = routes.find((r) => r.legs.some((l) => l.vehicleId === v.id));

  const useIt = () => {
    if (currentRoute) {
      previewRoute(currentRoute.id);
      navigate('/journey');
      return;
    }
    // Plan the current journey again with this vehicle offered, so start and destination stay the same.
    if (query.toId) {
      const res = plan({ ...query, preferVehicle: v.id });
      const own = res.routes?.find((r) => r.legs.some((l) => l.vehicleId === v.id));
      if (own) {
        previewRoute(own.id);
        navigate('/journey');
        return;
      }
    }
    if (!sample) return;
    plan({ fromId: sample.query.fromId, toId: target.id, purpose, needs: [] });
    if (sampleRoute) previewRoute(sampleRoute.id);
    navigate(sampleRoute ? '/journey?view=selected' : '/journey');
  };

  return (
    <div className="panel-body stack stack--lg">
      <ServiceArt vehicle={v} live={live} size="hero" />
      <div>
        <p className="tiny faint">{v.category}</p>
        <h1 className="h1">{v.name}</h1>
        <p className="lead">{v.purpose || v.bestFor}</p>
      </div>
      {!v.standard && <Notice tone="ai"><strong>{v.status}.</strong> This vehicle is shown as a future concept. It is not available for booking and is {v.hiddenFromJourneys ? 'hidden from' : 'not used in'} everyday journeys.</Notice>}
      <Card variant="live">
        <div className="spread"><h2 className="h3">Live status</h2><StatusBadge tone={live.tone === 'ok' ? 'ok' : live.tone === 'concept' ? 'concept' : 'warn'}>{live.status}</StatusBadge></div>
        <KV two rows={[
          ['Nearest vehicle', live.fleetId],
          ['Current location', live.location],
          ['ETA to you', live.eta ? `${live.eta} min` : 'Not in service'],
          ['Departure', v.standard ? clock(start) : '—'],
          ['Arrival', sampleRoute ? `${clock(sampleRoute.arriveTime)} at ${target.label}` : '—'],
          ['Delay information', live.delayMin ? `${live.delayMin} min late, extra vehicles sent` : 'No delays'],
          ['Cancellation information', live.cancellations],
          ['Route availability', v.standard ? 'Available on the NEXORA network' : 'Test routes only'],
          ['Operating hours', live.hours],
        ]} />
      </Card>
      <Card>
        <h2 className="h3">Service information</h2>
        <KV two rows={[
          ['Recommended use', v.bestFor || v.purpose],
          ['Suitable distance', range(v.distance, ' km')],
          ['Vehicle type', v.type || v.category],
          ['Passenger capacity', v.passengers],
          ['Estimated speed', v.speed ? range(v.speed, ' km/h') : v.speedNote],
          ['Estimated travel time', v.travelTime || 'Depends on distance'],
          ['Estimated price', v.price != null ? `From ${money(v.price)}` : v.priceNote || 'Not published'],
          ['Booking', v.booking || 'Through NEXORA, on demand'],
          ['Energy source', v.energy],
          ['Environmental impact', v.eco || 'Not published'],
          ['Comfort level', v.comfort ? `${v.comfort} out of 5` : 'Not rated'],
          ['Safety level', v.safety || 'Autonomous safety systems'],
          ['Accessibility', `${v.accessibility || 'No details published'} (match ${access.score}%)`],
          ['Luggage', v.luggage || 'Not published'],
          ['Transfers', 'Direct, or combined with other modes by NEXORA'],
          ['Live tracking', v.tracking ? 'Yes' : 'Not published'],
          ['Smart feature', v.ai || 'Included in NEXORA route planning'],
        ]} />
        {v.features.length > 0 && (
          <div className="chips" style={{ marginTop: 12 }}>{v.features.map((f) => <span key={f} className="badge">{f}</span>)}</div>
        )}
      </Card>
      <Card variant="ai">
        <h2 className="h3">Recommendation</h2>
        <p className="muted" style={{ margin: '6px 0 12px' }}>
          {v.standard
            ? `Best for ${(v.bestFor || v.purpose || 'this kind of trip').toLowerCase()} between ${range(v.distance, ' km')}. ${access.stepFree ? 'Step-free, so NEXORA suggests it for travellers who need level boarding.' : access.score < 70 ? 'NEXORA avoids it when you ask for step-free travel.' : ''}${sampleRoute ? ` Example: ${target.label} in ${sampleRoute.durationMin} min for ${money(sampleRoute.price)}.` : ''}`
            : 'Not recommended for journeys yet. It is a concept NEXORA is testing for the future.'}
        </p>
        <div className="btn-row">
          <Button variant="primary" disabled={!v.standard} onClick={useIt}>{v.standard ? 'Plan a trip with this' : 'Not bookable'}</Button>
          <Button to="panel:services">Back to explorer</Button>
        </div>
      </Card>
    </div>
  );
}
