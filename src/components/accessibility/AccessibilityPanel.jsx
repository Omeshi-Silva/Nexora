import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import { Switch, Notice } from '../common/ui';
import { A11Y_CONTROLS, A11Y_GROUPS } from './a11yControls';

/** Complete accessibility settings, reachable from the header on every page. */
export function AccessibilityControls({ compact }) {
  const { prefs, setPref } = useApp();
  const set = (key, value) => {
    setPref(key, value);
    if (key === 'screenReader' && value) setPref('mapAsList', true);
    if (key === 'wheelchair' && value) setPref('stepFree', true);
  };
  return (
    <div className="stack stack--lg">
      {A11Y_GROUPS.map((g) => (
        <fieldset key={g.id} className="stack stack--sm" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="h3" style={{ marginBottom: 8 }}>{g.label}</legend>
          <div className={compact ? 'stack stack--sm' : 'grid-2'}>
            {A11Y_CONTROLS.filter((c) => c.group === g.id).map((c) => (
              <Switch key={c.key} checked={prefs[c.key]} onChange={(v) => set(c.key, v)} label={c.label} hint={c.hint} icon={c.icon} />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export default function AccessibilityPanel() {
  const { a11yOpen, setA11yOpen } = useApp();
  return (
    <Modal open={a11yOpen} onClose={() => setA11yOpen(false)} title="Accessibility" icon="a11y">
      <div className="stack">
        <Notice tone="ai">Changes apply straight away across NEXORA. Step-free, wheelchair and extra-time settings also change which routes NEXORA recommends.</Notice>
        <AccessibilityControls compact />
      </div>
    </Modal>
  );
}

/* Named single-purpose controls (reusable anywhere). */
const Single = ({ k }) => {
  const { prefs, setPref } = useApp();
  const c = A11Y_CONTROLS.find((x) => x.key === k);
  return <Switch checked={prefs[k]} onChange={(v) => setPref(k, v)} label={c.label} hint={c.hint} icon={c.icon} />;
};
export const LargeTextControl = () => <Single k="largeText" />;
export const HighContrastControl = () => <Single k="highContrast" />;
export const VoiceGuidanceControl = () => <Single k="voiceGuidance" />;
export const SimplifiedModeControl = () => <Single k="simplified" />;
export const ReducedMotionControl = () => <Single k="reducedMotion" />;
