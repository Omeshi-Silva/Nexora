import { useState } from 'react';
import useGo from '../../hooks/useGo';
import { ConfirmationModal } from '../common/Modal';
import { Notice, KV } from '../common/ui';
import JourneyRibbon from '../transport/JourneyRibbon';
import { fareTotal } from '../transport/FareBreakdown';
import { useApp } from '../../context/AppContext';
import { useJourney } from '../../context/JourneyContext';
import { clock, duration } from '../../utils/time';
import { money } from '../../utils/format';

/** What the traveller pays for a route with their NEXORA Pass. Shared by the CTA and this modal so they always match. */
export const payableFare = (route) => fareTotal(route.fare, true);

/** Button label for the primary journey action. The fare is shown in the confirmation step. */
export const payStartLabel = (route) => {
  const total = payableFare(route);
  return total > 0 ? 'Pay & start journey' : 'Start journey — free';
};

/** The one confirmation step: shows the fare and balance, charges the Pass only when confirmed, then opens live tracking. */
export default function ConfirmTripModal({ route, open, onClose }) {
  const navigate = useGo();
  const { pass, setPass, notify } = useApp();
  const { startTrip, needs } = useJourney();
  const [loading, setLoading] = useState(false);
  if (!route) return null;
  const total = payableFare(route);
  const short = pass.balance < total;
  const after = Math.round((pass.balance - total) * 100) / 100;
  const mobility = needs.wheelchair || needs.stepFree;
  const confirm = () => {
    if (loading) return;
    if (short) {
      onClose();
      navigate('panel:profile:pass');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setPass({ ...pass, balance: after, points: pass.points + Math.round(total * 10) });
      if (total > 0) notify({ type: 'booking', severity: 'success', title: 'Payment successful', body: `${money(total)} paid with your NEXORA Pass. New balance ${money(after)}.`, silent: true });
      startTrip(route, { paid: total });
      setLoading(false);
      onClose();
      navigate('/live');
    }, 700);
  };
  return (
    <ConfirmationModal
      open={open}
      onClose={loading ? () => {} : onClose}
      onConfirm={confirm}
      loading={loading}
      title="Ready to start?"
      icon="ticket"
      confirmVariant="primary"
      cancelLabel="Go back"
      confirmLabel={short ? 'Add funds' : total > 0 ? 'Pay & start journey' : 'Start journey'}
    >
      <div className="stack">
        <JourneyRibbon route={route} />
        <KV rows={[
          ['From', route.fromId === 'here' ? 'Current location' : route.fromName],
          ['To', route.toName],
          ['Leave', clock(route.departTime)],
          ['Arrive', clock(route.arriveTime)],
          ['Duration', duration(route.durationMin)],
          ['Fare', money(total)],
          ['Payment', 'NEXORA Pass'],
          ['Pass balance', money(pass.balance)],
          [short ? 'Balance after' : 'Remaining balance', short ? '—' : money(after)],
        ]} />
        {mobility && route.access.warnings.length > 0 && <Notice tone="warn">{route.access.warnings[0]} An accessible alternative is available under Other ways.</Notice>}
        {short && (
          <Notice tone="bad" role="alert">
            <strong>Not enough NEXORA Pass balance.</strong> Fare {money(total)}, available {money(pass.balance)}. Add funds to your Pass to start this journey.
          </Notice>
        )}
        {!short && <p className="small muted">{total > 0 ? `Pressing “Pay & start journey” charges ${money(total)} to your NEXORA Pass, starts your journey and opens live tracking.` : 'This journey is free. Pressing “Start journey” opens live tracking.'} Nothing is charged until you press it. Simulated payment only.</p>}
      </div>
    </ConfirmationModal>
  );
}
