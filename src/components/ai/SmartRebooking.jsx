import Modal from '../common/Modal';
import Button from '../common/Button';
import Icon from '../common/Icon';
import { StatusBadge } from '../common/ui';
import JourneyRibbon from '../transport/JourneyRibbon';
import { clock } from '../../utils/time';
import { money } from '../../utils/format';

/**
 * Smart rebooking: explains what changed, why, the new route, the time and price
 * difference and whether accessibility still fits. Nothing changes without consent.
 */
export default function SmartRebooking({ disruption: d, open, onSwitch, onKeep, onClose }) {
  if (!d) return null;
  const alt = d.alternative;
  const priceDiff = d.impact.priceDiff;
  return (
    <Modal open={open} onClose={onClose} title="Your journey has changed" icon="sparkles" tone="ai">
      <div className="stack">
        <div className="rebook-block">
          <h3 className="h3">What changed?</h3>
          <p><strong>{d.vehicleName} {d.fleetId}</strong> is running {d.delayMin} minutes late.</p>
        </div>
        <div className="rebook-block">
          <h3 className="h3">Why?</h3>
          <p>{d.reason}.</p>
          {d.impact.spareBefore != null && (
            <p className="notice notice--warn" style={{ marginTop: 8 }}><Icon name="alert" size={18} /><span>Your change time drops from {d.impact.spareBefore + (d.original.transfers[0]?.movementMin || 0)} to {Math.max(0, d.impact.spareAfter + (d.original.transfers[0]?.movementMin || 0))} minutes{d.impact.missedConnection ? ', so you would miss your connection.' : '.'}</span></p>
          )}
        </div>
        <div className="grid-2">
          <div className="card card--flat">
            <p className="tiny faint">Keep current route</p>
            <p className="h3 num">Arrive {clock(d.impact.keptArrive)}</p>
            <p className="small muted">{d.impact.missedConnection ? 'Moved to the next departure automatically.' : `${d.delayMin} min later than planned.`}</p>
            <div style={{ marginTop: 8 }}><JourneyRibbon route={d.kept} showNames={false} /></div>
          </div>
          {alt ? (
            <div className="card card--live">
              <p className="tiny faint">Alternative</p>
              <p className="h3 num">Arrive {clock(d.impact.altArrive)}</p>
              <p className="small muted">{alt.detour || alt.summary}</p>
              <div style={{ marginTop: 8 }}><JourneyRibbon route={alt} showNames={false} /></div>
            </div>
          ) : (
            <div className="card card--flat"><p className="small muted">No faster alternative right now. NEXORA will keep checking and tell you if one appears.</p></div>
          )}
        </div>
        {alt && (
          <div className="row row--wrap" style={{ gap: 8 }}>
            <StatusBadge tone="ok" icon="clock">Saves {d.impact.timeSaved} min</StatusBadge>
            <StatusBadge tone={priceDiff > 0 ? 'warn' : 'ok'} icon="wallet">{priceDiff > 0 ? `${money(priceDiff)} extra` : priceDiff < 0 ? `${money(-priceDiff)} cheaper` : 'Same price'}</StatusBadge>
            <StatusBadge tone={d.impact.accessOk ? 'ok' : 'warn'} icon="a11y">{d.impact.accessOk ? 'Still meets your accessibility needs' : 'Check accessibility'}</StatusBadge>
          </div>
        )}
        <p className="small muted">You decide. NEXORA never changes an important journey without asking you first.</p>
        <div className="btn-row">
          {alt && <Button variant="primary" onClick={onSwitch}>Switch route</Button>}
          <Button onClick={onKeep}>Keep current route</Button>
        </div>
      </div>
    </Modal>
  );
}
