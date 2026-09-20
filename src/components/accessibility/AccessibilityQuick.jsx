import { useApp } from '../../context/AppContext';
import Icon from '../common/Icon';
import { A11Y_CONTROLS } from './a11yControls';

/** Visible accessibility quick access on Home: one tap, no settings menu. */
export default function AccessibilityQuick() {
  const { prefs, setPref, setA11yOpen } = useApp();
  const toggle = (key) => {
    const value = !prefs[key];
    setPref(key, value);
    if (key === 'screenReader' && value) setPref('mapAsList', true);
    if (key === 'wheelchair' && value) setPref('stepFree', true);
  };
  const active = A11Y_CONTROLS.filter((c) => prefs[c.key] && c.quick).length;
  return (
    <section className="card a11y-quick" aria-labelledby="a11y-quick-title">
      <div className="spread">
        <div>
          <h2 className="h3" id="a11y-quick-title">Make NEXORA work for you</h2>
          <p className="small muted">{active ? `${active} setting${active === 1 ? '' : 's'} on. Routes and screens adapt instantly.` : 'Tap any setting. Routes and screens adapt instantly.'}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setA11yOpen(true)}>All settings</button>
      </div>
      <div className="a11y-quick__grid">
        {A11Y_CONTROLS.filter((c) => c.quick).map((c) => (
          <button key={c.key} type="button" className="a11y-tile" aria-pressed={Boolean(prefs[c.key])} onClick={() => toggle(c.key)}>
            <Icon name={c.icon} size={22} />
            <span>{c.label}</span>
            {c.routing && <span className="a11y-tile__ai" title="Changes your routes"><Icon name="sparkles" size={12} /></span>}
          </button>
        ))}
      </div>
    </section>
  );
}
