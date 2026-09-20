import Link from '../../components/common/GoLink';
import { getVehicle } from '../../data/vehicles';
import { Card, KV, StatusBadge } from '../common/ui';
import Icon from '../common/Icon';
import { familyColor } from './JourneyRibbon';
import ServiceArt from './ServiceArt';
import { clock, duration } from '../../utils/time';
import { money, range, km } from '../../utils/format';
import { serviceLive } from '../../services/realtimeService';

/** Explains one transport mode used in the journey, with every key fact. */
export default function TransportModeCard({ leg, index, total, transferAfter }) {
  const v = getVehicle(leg.vehicleId);
  const live = serviceLive(v.id);
  return (
    <Card>
      <div style={{ marginBottom: 12 }}><ServiceArt vehicle={v} live={live} size="mode" /></div>
      <div className="mode-head">
        <span className="mode-icon" style={{ '--c': familyColor(leg.family) }}><Icon name={leg.icon} size={24} /></span>
        <div className="grow">
          <p className="mode-head__num">Mode {index + 1} of {total}</p>
          <h3 className="h3">{v.name}</h3>
          <p className="small muted">{v.type || v.category}</p>
        </div>
        <StatusBadge tone={leg.delayMin ? 'warn' : 'ok'}>{leg.delayMin ? `${leg.delayMin} min late` : 'On time'}</StatusBadge>
      </div>
      <div className="stats" style={{ marginTop: 14 }}>
        <div className="stat"><div className="stat__label">Departs</div><div className="stat__value">{clock(leg.departTime)}</div><div className="stat__note">{leg.fromPoint}</div></div>
        <div className="stat"><div className="stat__label">Arrives</div><div className="stat__value">{clock(leg.arriveTime)}</div><div className="stat__note">{leg.toName}</div></div>
        <div className="stat"><div className="stat__label">Travel time</div><div className="stat__value">{duration(leg.minutes + (leg.delayMin || 0))}</div><div className="stat__note">{km(leg.km)}</div></div>
        <div className="stat"><div className="stat__label">Price</div><div className="stat__value">{money(leg.price)}</div><div className="stat__note">{leg.priceEstimated ? 'Estimated' : v.booking || 'Pay as you go'}</div></div>
      </div>
      <details className="more">
        <summary><Icon name="down" size={18} />All details for this mode</summary>
        <KV two rows={[
          ['Purpose', v.purpose || v.bestFor],
          ['Suitable distance', range(v.distance, ' km')],
          ['Vehicle', `${leg.fleetId}`],
          ['Passengers', v.passengers],
          ['Estimated speed', v.speed ? range(v.speed, ' km/h') : v.speedNote],
          ['Availability', `${live.status}, next in ${live.eta} min`],
          ['Operating hours', live.hours],
          ['Current location', live.location],
          ['Energy source', v.energy],
          ['Environmental impact', v.eco || 'Not published'],
          ['Safety', v.safety || 'Autonomous safety systems'],
          ['Accessibility', v.accessibility || 'No published accessibility details'],
          ['Comfort', v.comfort ? `${v.comfort} out of 5` : 'Not rated'],
          ['Luggage', v.luggage || 'Not published'],
          ['Occupancy now', `${leg.occupancy}%`],
          ['Transfer after this', transferAfter ? `Yes, at ${transferAfter.hubName}` : 'No, this is the last mode'],
        ]} />
        <Link to={`panel:vehicle:${v.id}`} className="btn btn--ghost btn--sm">Open full service details</Link>
      </details>
    </Card>
  );
}
