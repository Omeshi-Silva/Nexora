import Icon from '../common/Icon';
import { StatusBadge, Progress } from '../common/ui';
import { NETWORK_STATUS, STATE_LABEL } from '../../data/network';
import { networkHealth } from '../../services/realtimeService';

const TONE = { normal: 'ok', minor: 'warn', heavy: 'bad', down: 'bad' };

export default function NetworkStatus() {
  const health = networkHealth();
  const issues = NETWORK_STATUS.filter((n) => n.state !== 'normal').length;
  return (
    <div className="card net-status">
      <div className="spread">
        <div>
          <p className="tiny faint">Network health</p>
          <p className="big-time">{health}%</p>
        </div>
        <p className="small muted" style={{ textAlign: 'right', maxWidth: '22ch' }}>{issues ? `${issues} areas need attention. NEXORA routes around them for you.` : 'Everything is running normally.'}</p>
      </div>
      <Progress value={health} label="Network health" />
      <ul className="net-list">
        {NETWORK_STATUS.map((n) => (
          <li key={n.id} className="net-row">
            <span className="mode-icon mode-icon--sm"><Icon name={n.icon} size={18} /></span>
            <div className="grow">
              <strong>{n.label}</strong>
              <p className="small muted">{n.note}</p>
            </div>
            <StatusBadge tone={TONE[n.state]}>{STATE_LABEL[n.state]}</StatusBadge>
          </li>
        ))}
      </ul>
      <p className="tiny faint">Vacuum-Tube Express runs as a limited scheduled service.</p>
    </div>
  );
}
