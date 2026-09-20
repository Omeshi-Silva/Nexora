import Icon from '../common/Icon';
import Button from '../common/Button';
import { FAMILIES } from '../../data/vehicles';

const SEV = { low: 'LOW', medium: 'MEDIUM', critical: 'CRITICAL' };

/** Alert card for a red problem marker. It stays red: problems never take a category colour. */
export default function IncidentPanel({ inc, affected, onClose, onAlternative }) {
  if (!inc) return null;
  return (
    <div className={`vehicle-panel card incident-panel sev-${inc.severity}`} role="alertdialog" aria-label={`Problem: ${inc.title}`}>
      <div className="row">
        <span className="vp-icon"><Icon name="alert" size={22} /></span>
        <div className="grow">
          <p className="vp-cat">{inc.kind.toUpperCase()} · {SEV[inc.severity]}</p>
          <h2 className="h3">{inc.title}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close problem details"><Icon name="close" /></button>
      </div>
      <dl className="vp-grid">
        <div><dt>Location</dt><dd>{inc.location}</dd></div>
        <div><dt>Network</dt><dd>{FAMILIES[inc.category].label}</dd></div>
        <div><dt>Expected delay</dt><dd>+{inc.delayMin} min</dd></div>
        <div><dt>Affected</dt><dd>{affected.length ? affected.slice(0, 3).join(', ') : 'No vehicles right now'}</dd></div>
      </dl>
      <p className="incident-panel__advice"><Icon name="sparkles" size={16} /><span><strong>Recommendation.</strong> {inc.advice}</span></p>
      <Button variant="primary" icon="swap" onClick={onAlternative}>View alternative</Button>
    </div>
  );
}
