import Icon from '../common/Icon';
import Button from '../common/Button';
import { Progress } from '../common/ui';
import { FAMILIES, PROBLEM, getVehicle } from '../../data/vehicles';
import { vehicleAccess } from '../../services/accessibilityService';
import { vehicleImage } from '../../data/vehicleImages';
import { clock } from '../../utils/time';

const AIR_ROUTE = { air1: 'Skyport corridor', air2: 'Hospital corridor' };

/** Glass panel for a selected vehicle. The accent is the category colour; problems add red, never replace it. */
export default function VehicleInfoPanel({ v, onClose, onTrack, tracking, issue }) {
  if (!v) return null;
  const spec = getVehicle(v.vehicleId);
  const fam = FAMILIES[v.family];
  const late = /delay|late/i.test(v.status || '') || issue;
  const access = vehicleAccess(v.vehicleId);
  const eta = v.etaMin != null ? clock(Date.now() + v.etaMin * 60000) : null;
  const rows = [
    ['Speed', `${v.speedKmh} km/h`],
    ['ETA', eta ? `${eta} (${v.etaMin} min)` : '—'],
    ['Destination', v.destination || v.nextStop],
    ['Next stop', v.nextStop],
  ];
  if (v.family === 'air') rows.push(['Altitude', v.altitudeM ? `${v.altitudeM} m` : 'Ground level'], ['Air route', AIR_ROUTE[v.loop] || 'Aerial corridor'], ['Landing point', v.destination || v.nextStop]);
  if (v.family === 'rail') rows.push(['Current station', v.currentLocation || '—'], ['Passengers', `${v.occupancy ?? 40}% full`]);
  if (v.family === 'smart') rows.push(['Road intelligence', 'Connected to road nodes'], ['Network link', 'Active']);
  rows.push(['Accessibility', access.stepFree ? 'Step-free' : access.wheelchair ? 'Wheelchair-friendly' : 'Boarding help available']);
  rows.push(['Route', late ? 'Re-checking' : 'Optimized']);
  return (
    <div className="vehicle-panel card" style={{ '--c': late ? PROBLEM.color : fam.color, '--cat': fam.color, '--g': fam.glow }} role="dialog" aria-label={`${v.fleetId} details`}>
      <div className="row">
        <span className="vp-icon"><Icon name={v.icon} size={22} /></span>
        <div className="grow">
          <p className="vp-cat">{fam.label.toUpperCase()}</p>
          <h2 className="h3">{v.name}</h2>
          <p className="small muted">{v.fleetId}</p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close vehicle details"><Icon name="close" /></button>
      </div>
      {vehicleImage(v.vehicleId) && <img className="vehicle-panel__img" src={vehicleImage(v.vehicleId).sm} alt={`${v.name}, concept illustration`} loading="lazy" />}
      <p className={`vp-status ${late ? 'is-late' : ''}`}><span className="dot" aria-hidden="true" />{late ? (v.status || 'Delayed') : v.concept ? v.status : 'ON TIME'}</p>
      {v.progress != null && <Progress value={v.progress * 100} label="Route progress" />}
      <dl className="vp-grid">
        {rows.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}
      </dl>
      {spec && <p className="tiny faint">{spec.category}</p>}
      {!v.mine && <Button variant="primary" icon="locate" onClick={() => onTrack(v)}>{tracking ? 'Tracking this vehicle' : 'Track vehicle'}</Button>}
    </div>
  );
}
