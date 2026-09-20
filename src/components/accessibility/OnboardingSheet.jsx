import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Icon from '../common/Icon';

const OPTIONS = [
  { id: 'standard', label: 'Just get me there', icon: 'route', set: {} },
  { id: 'text', label: 'Bigger, clearer text', icon: 'text', set: { largeText: true, highContrast: true } },
  { id: 'simple', label: 'Keep it simple', icon: 'list', set: { simplified: true, largeText: true, reducedMotion: true } },
  { id: 'stepfree', label: 'No stairs or steps', icon: 'stairs', set: { stepFree: true, extraTime: true } },
  { id: 'wheelchair', label: 'I use a wheelchair', icon: 'wheelchair', set: { wheelchair: true, stepFree: true, extraTime: true } },
  { id: 'voice', label: 'Talk to me', icon: 'volume', set: { voiceGuidance: true, voiceInput: true, screenReader: true, mapAsList: true } },
  { id: 'deaf', label: 'Show, don\u2019t tell', icon: 'captions', set: { captions: true, visualAlerts: true, vibration: true } },
];

/** First-visit personalisation: universal by default, personal in one step. */
export default function OnboardingSheet() {
  const { onboarded, setOnboarded, setPrefs } = useApp();
  const [picked, setPicked] = useState(['standard']);
  const toggle = (id) => {
    if (id === 'standard') return setPicked(['standard']);
    setPicked((p) => {
      const rest = p.filter((x) => x !== 'standard');
      const next = rest.includes(id) ? rest.filter((x) => x !== id) : [...rest, id];
      return next.length ? next : ['standard'];
    });
    return undefined;
  };
  const finish = () => {
    const merged = OPTIONS.filter((o) => picked.includes(o.id)).reduce((acc, o) => ({ ...acc, ...o.set }), {});
    setPrefs((p) => ({ ...p, ...merged }));
    setOnboarded(true);
  };
  return (
    <Modal open={!onboarded} onClose={() => setOnboarded(true)} title="Welcome to NEXORA" icon="sparkles" tone="ai">
      <div className="stack">
        <p className="muted">One app for every bus, train, pod and flight. How would you like to travel? Choose any that help. You can change them any time with the <Icon name="a11y" size={16} style={{ display: 'inline', verticalAlign: '-3px' }} /> button.</p>
        <div className="onboard-grid" role="group" aria-label="Travel preferences">
          {OPTIONS.map((o) => (
            <button key={o.id} type="button" className="a11y-tile" aria-pressed={picked.includes(o.id)} onClick={() => toggle(o.id)}>
              <Icon name={o.icon} size={22} />
              <span>{o.label}</span>
            </button>
          ))}
        </div>
        <Button variant="primary" size="lg" block onClick={finish}>Start travelling</Button>
      </div>
    </Modal>
  );
}
