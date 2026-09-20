import { Card, StatusBadge } from '../common/ui';
import Icon from '../common/Icon';

/** Predictive safety, in plain language. */
export default function SafetyCard({ safety }) {
  return (
    <Card variant={safety.status === 'Clear' ? 'ok' : 'warn'}>
      <div className="row">
        <span className={`card-icon ${safety.status === 'Clear' ? 'card-icon--ok' : 'card-icon--warn'}`}><Icon name="shield" size={22} /></span>
        <div className="grow">
          <p className="tiny faint">Safety status</p>
          <h3 className="h3">{safety.status}</h3>
        </div>
        <StatusBadge tone={safety.status === 'Clear' ? 'ok' : 'warn'}>{safety.status === 'Clear' ? 'Safe to travel' : 'Take care'}</StatusBadge>
      </div>
      <p className="muted" style={{ margin: '10px 0' }}>{safety.summary}</p>
      <ul className="check-list">
        {safety.items.map((i) => (
          <li key={i.label}><Icon name={i.ok ? 'check' : 'alert'} size={18} style={{ color: i.ok ? 'var(--ok)' : 'var(--warn)' }} /><span><strong>{i.label}:</strong> {i.value}</span></li>
        ))}
      </ul>
    </Card>
  );
}
