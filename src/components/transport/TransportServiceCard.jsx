import Link from '../../components/common/GoLink';
import ServiceArt from './ServiceArt';
import { range, money } from '../../utils/format';
import { serviceLive } from '../../services/realtimeService';
import { FAMILIES } from '../../data/vehicles';

const ECO = { 'Very Low': 'Very low', Low: 'Low' };

/** Service card for Popular Services and the Transportation Explorer. */
export default function TransportServiceCard({ vehicle: v, detailed, wide }) {
  const live = serviceLive(v.id);
  const time = v.travelTime || (v.speed ? 'Depends on distance' : 'Priority');
  return (
    <article className={`card svc-card ${wide ? 'svc-card--wide' : ''}`}>
      <ServiceArt vehicle={v} live={live} />
      <div>
        <p className="tiny faint">{v.category}</p>
        <h3 className="h3">{v.name}</h3>
        <p className="small muted" style={{ marginTop: 2 }}>{v.purpose || v.bestFor}</p>
      </div>
      <dl className="svc-card__facts">
        <div><dt>Distance</dt><dd>{range(v.distance, ' km')}</dd></div>
        <div><dt>From</dt><dd>{v.price != null ? money(v.price) : v.priceNote || 'Price on request'}</dd></div>
        <div><dt>Best for</dt><dd>{v.bestFor || v.purpose || '—'}</dd></div>
        <div><dt>{v.standard ? 'Nearest' : 'Status'}</dt><dd>{v.standard ? `${live.eta} min away` : v.status}</dd></div>
        {detailed && (
          <>
            <div><dt>Capacity</dt><dd>{v.passengers}</dd></div>
            <div><dt>Speed</dt><dd>{v.speed ? range(v.speed, ' km/h') : v.speedNote}</dd></div>
            <div><dt>Travel time</dt><dd>{time}</dd></div>
            <div><dt>Energy</dt><dd>{v.energy}</dd></div>
            <div><dt>Safety</dt><dd>{v.safety || 'Autonomous safety systems'}</dd></div>
            <div><dt>Accessibility</dt><dd>{v.accessibility || 'Not published'}</dd></div>
            <div><dt>Comfort</dt><dd>{v.comfort ? `${v.comfort} of 5` : '—'}</dd></div>
            <div><dt>Environment</dt><dd>{v.eco ? `${ECO[v.eco] || v.eco} impact` : '—'}</dd></div>
            <div><dt>Type</dt><dd>{FAMILIES[v.family]?.label}</dd></div>
          </>
        )}
      </dl>
      <Link to={`panel:vehicle:${v.id}`} className="btn btn--sm" style={{ marginTop: 'auto' }} aria-label={`Explore ${v.name}`}>Explore</Link>
    </article>
  );
}
