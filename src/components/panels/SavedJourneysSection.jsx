import { useState } from 'react';
import useGo from '../../hooks/useGo';
import { useApp } from '../../context/AppContext';
import { useJourney } from '../../context/JourneyContext';
import { ConfirmationModal } from '../../components/common/Modal';
import { Card, StatusBadge, EmptyState } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { getVehicle } from '../../data/vehicles';
import { money } from '../../utils/format';
import { duration } from '../../utils/time';

const TABS = [['upcoming', 'Upcoming'], ['active', 'Active'], ['completed', 'Completed'], ['cancelled', 'Cancelled'], ['saved', 'Saved']];
const TONE = { upcoming: 'info', active: 'ok', completed: 'ok', cancelled: 'bad', saved: 'ai' };
const fmt = (ms) => (ms ? new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(/\d{4}/, '2100') : 'Any time');

export default function SavedJourneysSection() {
  const navigate = useGo();
  const { journeys, upsertJourney, notify } = useApp();
  const { plan, trip, endTrip } = useJourney();
  const [tab, setTab] = useState(trip && !trip.completed ? 'active' : 'upcoming');
  const [cancelling, setCancelling] = useState(null);
  const list = journeys.filter((j) => j.status === tab);

  const repeat = (j) => { plan({ fromId: j.fromId, toId: j.toId, purpose: j.purpose || 'everyday', needs: [], whenMode: 'now' }); navigate('/journey'); };
  const doCancel = () => {
    if (cancelling.status === 'active') endTrip('cancelled');
    upsertJourney({ id: cancelling.id, status: 'cancelled' });
    notify({ type: 'booking', severity: 'info', title: 'Journey cancelled', body: `${cancelling.title}. Any payment is refunded to your NEXORA Pass.` });
    setCancelling(null);
  };

  return (
    <div className="panel-body">
      
      <div className="scroller" role="tablist" aria-label="Journey status" style={{ marginTop: 12 }}>
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className="chip" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label} <span className="faint">({journeys.filter((j) => j.status === id).length})</span>
          </button>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 12 }} role="tabpanel">
        {list.length === 0 ? (
          <EmptyState icon="ticket" title={`No ${tab} journeys`} action={<Button variant="primary" to="/">Plan a journey</Button>}>Journeys you {tab === 'saved' ? 'save' : 'start'} will appear here.</EmptyState>
        ) : list.map((j) => (
          <Card key={j.id}>
            <div className="spread" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <h2 className="h3">{j.title}</h2>
                <p className="small muted">{fmt(j.depart)}, {duration(j.durationMin)}, {money(j.price)}</p>
              </div>
              <StatusBadge tone={TONE[j.status]}>{j.status.replace(/^\w/, (c) => c.toUpperCase())}</StatusBadge>
            </div>
            <div className="row row--wrap" style={{ margin: '10px 0', gap: 6 }}>
              {(j.modes || []).map((m, i) => { const v = getVehicle(m); return v ? <span key={i} className="badge"><Icon name={v.icon} size={14} />{v.name}</span> : null; })}
            </div>
            <div className="btn-row">
              {j.status === 'active' && <Button size="sm" variant="primary" icon="map" to="/live">Track</Button>}
              {j.status === 'active' && <Button size="sm" icon="route" to="/journey?view=selected">View</Button>}
              {j.status !== 'active' && <Button size="sm" icon="refresh" onClick={() => repeat(j)}>{j.status === 'cancelled' ? 'Plan again' : j.status === 'completed' ? 'Repeat' : 'View'}</Button>}
              {j.status !== 'saved' && j.status !== 'cancelled' && j.status !== 'completed' && <Button size="sm" variant="danger-outline" onClick={() => setCancelling(j)}>Cancel</Button>}
              {j.status !== 'saved' && j.status !== 'active' && <Button size="sm" icon="save" onClick={() => { upsertJourney({ ...j, id: `saved-${j.id}`, status: 'saved' }); notify({ type: 'journey', severity: 'success', title: 'Journey saved', body: j.title }); }}>Save</Button>}
            </div>
          </Card>
        ))}
      </div>
      <ConfirmationModal open={Boolean(cancelling)} onClose={() => setCancelling(null)} onConfirm={doCancel} title="Cancel this journey?" icon="alert" tone="danger" confirmLabel="Yes, cancel" confirmVariant="danger" cancelLabel="Keep journey">
        <p>{cancelling?.title}. Cancellation is free and {money(cancelling?.price || 0)} goes back to your NEXORA Pass.</p>
      </ConfirmationModal>
    </div>
  );
}
