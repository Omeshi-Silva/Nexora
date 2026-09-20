import Icon from '../common/Icon';
import { PERSONAS } from '../../data/personas';
import { useApp } from '../../context/AppContext';

/** "Try NEXORA as…": one tap applies a traveller's settings and plans their trip. */
export default function PersonaSwitcher({ onTry }) {
  const { persona, applyPersona } = useApp();
  return (
    <ul className="persona-grid">
      {PERSONAS.map((p) => (
        <li key={p.id}>
          <button type="button" className={`persona-card ${persona?.id === p.id ? 'is-on' : ''}`} aria-pressed={persona?.id === p.id} onClick={() => { applyPersona(p); onTry(p); }}>
            <span className="card-icon card-icon--ai"><Icon name={p.icon} size={20} /></span>
            <span className="persona-card__text">
              <strong>{p.label}</strong>
              <small>{p.summary}</small>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
