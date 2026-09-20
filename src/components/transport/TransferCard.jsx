import Icon from '../common/Icon';
import { Card, StatusBadge, Notice, KV } from '../common/ui';
import { clock } from '../../utils/time';
import { useSimple } from '../../context/AppContext';

const TONE = { safe: ['ok', 'Safe connection'], tight: ['warn', 'Tight connection'], 'at-risk': ['bad', 'At risk'], rebooked: ['info', 'Moved to next departure'] };

export default function TransferCard({ transfer: t, index, predictedDelay = 0, onAlternative }) {
  const simple = useSimple();
  const spareAfter = t.spareMin - predictedDelay;
  const risk = predictedDelay > 0 && spareAfter < 2;
  const [tone, label] = risk ? ['bad', 'At risk'] : TONE[t.status];
  return (
    <Card variant={risk ? 'bad' : t.status === 'tight' ? 'warn' : undefined}>
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="tiny faint">Change {String(index + 1).padStart(2, '0')}</p>
          <h3 className="h3">{t.hubName}</h3>
        </div>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
      <p style={{ margin: '10px 0' }}>{simple ? t.plainInstruction : t.instruction}</p>
      <div className="transfer-flow" aria-hidden="true">
        <span className="badge">{t.fromPoint}</span>
        <span className="transfer-flow__line"><Icon name="walk" size={16} /> {t.movementMin} min</span>
        <span className="badge badge--info">{t.toPoint}</span>
      </div>
      <KV rows={[
        ['You arrive', clock(t.arriveTime)],
        ['Next departure', clock(t.nextDepartTime)],
        ['Time to change', `${t.windowMin} min`],
        ['Walking / movement', `${t.movementMin} min`],
        ['Spare time', `${Math.max(spareAfter, 0)} min`],
        t.bufferMin ? ['Extra time you asked for', `${t.bufferMin} min included`] : null,
        ['Accessible path', t.accessiblePath, 'adv'],
        ['From', t.fromVehicle, 'adv'],
        ['To', t.toVehicle, 'adv'],
      ]} />
      {risk && (
        <Notice tone="bad" className="" role="alert">
          <strong>Warning: the current delay may cut your change time to {Math.max(spareAfter + t.movementMin, 0)} minutes.</strong> A recommended alternative is available.
          {onAlternative && <div style={{ marginTop: 8 }}><button type="button" className="btn btn--ai btn--sm" onClick={onAlternative}>See alternative</button></div>}
        </Notice>
      )}
      {!risk && t.status === 'tight' && <Notice tone="warn">You have only {t.spareMin} spare minutes here. NEXORA will hold your seat for up to 2 minutes if you are running late.</Notice>}
    </Card>
  );
}
