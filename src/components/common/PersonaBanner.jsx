import Icon from './Icon';
import { useApp } from '../../context/AppContext';
import { PERSONA_BY_ID } from '../../data/personas';

/** Shows which demo persona is active and restores the traveller's own settings in one tap. */
export default function PersonaBanner() {
  const { persona, clearPersona } = useApp();
  if (!persona) return null;
  const p = PERSONA_BY_ID[persona.id];
  if (!p) return null;
  return (
    <div className="persona-banner" role="status">
      <div className="container persona-banner__inner">
        <Icon name={p.icon} size={18} />
        <p className="grow small"><strong>Viewing as: {p.label}.</strong> <span className="muted">{p.settings}.</span></p>
        <button type="button" className="btn btn--sm" onClick={clearPersona}>Back to my settings</button>
      </div>
    </div>
  );
}
