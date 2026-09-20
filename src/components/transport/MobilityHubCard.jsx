import { Card } from '../common/ui';
import Icon from '../common/Icon';
import { HUBS } from '../../data/places';

export default function MobilityHubCard({ hubId }) {
  const h = HUBS[hubId];
  if (!h) return null;
  return (
    <Card>
      <div className="row">
        <span className="card-icon"><Icon name="building" size={22} /></span>
        <div className="grow">
          <h3 className="h3">{h.name}</h3>
          <p className="small muted">{h.elevators} lifts, step-free throughout, staffed help desk</p>
        </div>
      </div>
      <div className="row row--wrap" style={{ marginTop: 10, gap: 6 }}>
        {Object.entries(h.points).map(([k, v]) => <span key={k} className="badge">{v}</span>)}
      </div>
    </Card>
  );
}
