import { useState } from 'react';
import Link from '../../components/common/GoLink';
import { useApp } from '../../context/AppContext';
import { StatusBadge, EmptyState } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { relative } from '../../utils/time';

const FILTERS = [['all', 'All'], ['delay', 'Delays'], ['arrival', 'Arrivals'], ['transfer', 'Transfers'], ['safety', 'Safety'], ['booking', 'Booking'], ['offer', 'Offers']];
const ICON = { disruption: 'alert', delay: 'alert', arrival: 'clock', transfer: 'swap', safety: 'shield', booking: 'ticket', offer: 'tag', journey: 'route' };
const TONE = { warning: 'warn', critical: 'bad', success: 'ok', info: 'info' };
const SAMPLES = [
  { type: 'transfer', severity: 'warning', title: 'Platform changed', body: 'Your Maglev now leaves from Platform B-09, one level down. Lifts are on your left.' },
  { type: 'arrival', severity: 'info', title: 'Child-Safe vehicle arriving in 4 minutes', body: 'Guardian notification sent. Boarding will be confirmed when your child is on board.' },
  { type: 'safety', severity: 'critical', title: 'Service suspended', body: 'Air Mobility paused over North Vertiport for 10 minutes due to high winds. Affected journeys have alternatives ready.' },
  { type: 'transfer', severity: 'warning', title: 'Gate changed', body: 'Air Shuttle now boards at Gate S-14. You still have 9 minutes.' },
  { type: 'journey', severity: 'info', title: 'Travel tip', body: 'Leave 5 minutes earlier tomorrow: the Metro is quieter at 08:10.' },
];

export default function AlertsPanel() {
  const { notifications, markRead, removeNotification, notify } = useApp();
  const [f, setF] = useState('all');
  const [n, setN] = useState(0);
  const list = notifications.filter((x) => f === 'all' || x.type === f || (f === 'delay' && x.type === 'disruption'));
  return (
    <div className="panel-body" >
      <div className="spread">
        <span />
        <Button size="sm" onClick={() => markRead('all')}>Mark all read</Button>
      </div>
      <p className="muted" style={{ margin: '6px 0 12px' }}>Every alert is shown as text. Voice, vibration and screen flashes follow your <Link to="panel:profile:settings">notification settings</Link>.</p>
      <div className="scroller" role="group" aria-label="Filter alerts">
        {FILTERS.map(([id, l]) => <button key={id} type="button" className="chip" aria-pressed={f === id} onClick={() => setF(id)}>{l}</button>)}
      </div>
      <ul className="stack" style={{ listStyle: 'none', marginTop: 12 }}>
        {list.length === 0 && <li><EmptyState icon="bell" title="No alerts here">When something changes on your journey, you will see it here first.</EmptyState></li>}
        {list.map((x) => (
          <li key={x.id} className={`card alert-item ${x.read ? '' : 'is-unread'}`}>
            <div className="row row--top">
              <span className={`card-icon card-icon--${x.severity === 'warning' ? 'warn' : x.severity === 'critical' ? 'bad' : x.severity === 'success' ? 'ok' : ''}`}><Icon name={ICON[x.type] || 'bell'} size={20} /></span>
              <div className="grow stack stack--sm">
                <div className="spread"><strong>{x.title}</strong><span className="tiny faint">{relative(x.at)}</span></div>
                {x.body && <p className="small muted">{x.body}</p>}
                <div className="row row--wrap">
                  <StatusBadge tone={TONE[x.severity] || 'info'}>{x.severity === 'critical' ? 'Urgent' : x.severity === 'warning' ? 'Needs attention' : x.severity === 'success' ? 'Done' : 'Info'}</StatusBadge>
                  {!x.read && <button type="button" className="btn btn--ghost btn--sm" onClick={() => markRead(x.id)}>Mark read</button>}
                  {x.action && <Link className="btn btn--ghost btn--sm" to={x.action.to}>{x.action.label}</Link>}
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeNotification(x.id)} aria-label={`Delete alert: ${x.title}`}>Delete</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="card card--flat" style={{ marginTop: 16 }}>
        <p className="small muted">Try it: send an example alert to see text, voice, vibration and visual alerts together.</p>
        <Button size="sm" icon="bell" style={{ marginTop: 8 }} onClick={() => { notify(SAMPLES[n % SAMPLES.length]); setN(n + 1); }}>Send example alert</Button>
      </div>
    </div>
  );
}
