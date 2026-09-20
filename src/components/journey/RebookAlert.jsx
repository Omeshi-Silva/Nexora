import Icon from '../common/Icon';
import Button from '../common/Button';
import { clock } from '../../utils/time';

/**
 * Smart rebooking, only when something actually changes:
 * what changed, the arrival time before and after, and one clear action.
 */
export default function RebookAlert({ disruption: d, onSwitch, onKeep, onWhy }) {
  if (!d) return null;
  const alt = d.alternative;
  return (
    <section className="rebook-alert" role="alert" aria-labelledby="rebook-h">
      <h2 id="rebook-h"><Icon name="alert" size={20} />{d.vehicleName} delayed +{d.delayMin} min</h2>
      {alt ? (
        <>
          <p><strong>NEXORA found another way.</strong> {d.impact.missedConnection ? 'Your connection would be missed, so this keeps you moving.' : 'You can still arrive close to plan.'}</p>
          <p className="rebook-alert__times num" aria-label={`Arrival changes from ${clock(d.impact.keptArrive)} to ${clock(d.impact.altArrive)}`}>
            <s>{clock(d.impact.keptArrive)}</s><Icon name="next" size={20} /><span>{clock(d.impact.altArrive)}</span>
          </p>
          <div className="btn-row">
            <Button variant="primary" size="lg" icon="swap" onClick={onSwitch}>Switch route</Button>
            <Button onClick={onKeep}>Keep current route</Button>
          </div>
        </>
      ) : (
        <>
          <p>No faster route right now. Your new arrival is <strong className="num">{clock(d.impact.keptArrive)}</strong>. NEXORA keeps watching and will tell you if one appears.</p>
          <div className="btn-row"><Button variant="primary" size="lg" onClick={onKeep}>OK, continue</Button></div>
        </>
      )}
      {onWhy && <button type="button" className="btn btn--ghost btn--sm" onClick={onWhy}>See the details</button>}
    </section>
  );
}
