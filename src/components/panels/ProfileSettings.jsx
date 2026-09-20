import { useState } from 'react';
import Link from '../../components/common/GoLink';
import { useApp } from '../../context/AppContext';
import { AccessibilityControls } from '../../components/accessibility/AccessibilityPanel';
import TravelPassCard from '../../components/booking/TravelPassCard';
import { Card, Section, Switch, Segmented, Notice } from '../../components/common/ui';
import { ConfirmationModal } from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { PLACES, PLACE_BY_ID } from '../../data/places';
import { FAMILIES } from '../../data/vehicles';
import { money } from '../../utils/format';

const COMFORT = [
  { value: 'standard', label: 'Standard', cabin: { temperature: 22, lighting: 'soft', audio: 'announcements', privacy: false, seating: 'standard' } },
  { value: 'quiet', label: 'Quiet', cabin: { temperature: 21, lighting: 'dim', audio: 'silent', privacy: true, seating: 'standard' } },
  { value: 'family', label: 'Family', cabin: { temperature: 23, lighting: 'bright', audio: 'announcements', privacy: false, seating: 'family' } },
  { value: 'accessibility', label: 'Accessibility', cabin: { temperature: 22, lighting: 'bright', audio: 'spoken + captions', privacy: false, seating: 'wheelchair space' } },
  { value: 'premium', label: 'Premium', cabin: { temperature: 21, lighting: 'ambient', audio: 'music', privacy: true, seating: 'reclining' } },
];

/** Profile: saved places, preferences, comfort, accessibility, language, notifications, privacy, payment, pass. */
export default function ProfileSettings() {
  const { profile, setProfile, pass, notify, resetAll } = useApp();
  const [reset, setReset] = useState(false);
  const setP = (patch) => setProfile((p) => ({ ...p, ...patch }));
  const cabin = profile.cabin;
  const setCabin = (patch, msg) => { setP({ cabin: { ...cabin, ...patch } }); if (msg) notify({ type: 'journey', severity: 'success', title: msg, body: 'Your next vehicle will be ready when you board.' }); };
  return (
    <div className="panel-body" >
      <Section title="Saved places">
        <div className="grid-3">
          {profile.savedPlaces.map((sp) => (
            <Card key={sp.id}>
              <div className="field">
                <label className="field__label" htmlFor={`sp-${sp.id}`}><Icon name={PLACE_BY_ID[sp.placeId]?.icon || 'pin'} size={16} style={{ display: 'inline', verticalAlign: '-3px' }} /> {sp.label}</label>
                <select id={`sp-${sp.id}`} className="select" value={sp.placeId} onChange={(e) => setP({ savedPlaces: profile.savedPlaces.map((x) => (x.id === sp.id ? { ...x, placeId: e.target.value } : x)) })}>
                  {PLACES.filter((p) => p.id !== 'here').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Travel preferences">
        <Card className="stack">
          <div>
            <p className="field__label">Preferred transport</p>
            <div className="chips" style={{ marginTop: 8 }}>
              {Object.entries(FAMILIES).map(([k, f]) => (
                <button key={k} type="button" className="chip" aria-pressed={profile.preferredModes.includes(k)} onClick={() => setP({ preferredModes: profile.preferredModes.includes(k) ? profile.preferredModes.filter((x) => x !== k) : [...profile.preferredModes, k] })}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="budget">Usual budget per journey: {money(profile.budget)}</label>
            <input id="budget" type="range" min="2" max="300" step="1" value={profile.budget} onChange={(e) => setP({ budget: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="lang">Language</label>
            <select id="lang" className="select" value={profile.language} onChange={(e) => setP({ language: e.target.value })}>
              <option value="en">English</option><option value="si">සිංහල (Sinhala) — voice</option><option value="ta">தமிழ் (Tamil) — voice</option>
            </select>
            <p className="tiny faint">In this prototype, language changes voice guidance. Screen text stays in English.</p>
          </div>
          <Switch checked={profile.privacy.personalization} onChange={(v) => setP({ privacy: { ...profile.privacy, personalization: v } })} label="Personalisation" hint="Use my past trips to improve recommendations" icon="sparkles" />
        </Card>
      </Section>

      <Section title="Smart comfort" subtitle="Your cabin is prepared before you board.">
        <Card className="stack">
          <Segmented label="Comfort mode" value={profile.comfortMode} options={COMFORT} onChange={(v) => { const c = COMFORT.find((x) => x.value === v); setP({ comfortMode: v, cabin: c.cabin }); notify({ type: 'journey', severity: 'success', title: `${c.label} comfort applied`, body: `Cabin set to ${c.cabin.temperature}°C with ${c.cabin.lighting} lighting.` }); }} />
          <div className="field">
            <label className="field__label" htmlFor="temp"><Icon name="thermo" size={16} style={{ display: 'inline', verticalAlign: '-3px' }} /> Temperature: {cabin.temperature}°C</label>
            <input id="temp" type="range" min="17" max="27" value={cabin.temperature} onChange={(e) => setCabin({ temperature: Number(e.target.value) })} onMouseUp={() => notify({ type: 'journey', severity: 'success', title: 'Your preferred cabin temperature has been applied', body: `${cabin.temperature}°C` })} onKeyUp={(e) => { if (e.key.startsWith('Arrow')) setCabin({}, 'Your preferred cabin temperature has been applied'); }} />
          </div>
          <div className="grid-2">
            <div className="field"><label className="field__label" htmlFor="light">Lighting</label><select id="light" className="select" value={cabin.lighting} onChange={(e) => setCabin({ lighting: e.target.value }, 'Lighting preference saved')}>{['soft', 'dim', 'bright', 'ambient'].map((x) => <option key={x}>{x}</option>)}</select></div>
            <div className="field"><label className="field__label" htmlFor="audio">Audio</label><select id="audio" className="select" value={cabin.audio} onChange={(e) => setCabin({ audio: e.target.value }, 'Audio preference saved')}>{['announcements', 'silent', 'music', 'spoken + captions'].map((x) => <option key={x}>{x}</option>)}</select></div>
            <div className="field"><label className="field__label" htmlFor="seat">Seating</label><select id="seat" className="select" value={cabin.seating} onChange={(e) => setCabin({ seating: e.target.value }, 'Seating preference saved')}>{['standard', 'family', 'wheelchair space', 'reclining'].map((x) => <option key={x}>{x}</option>)}</select></div>
            <Switch checked={cabin.privacy} onChange={(v) => setCabin({ privacy: v }, v ? 'Privacy glass will be on' : 'Privacy glass off')} label="Privacy glass" icon="eye" />
          </div>
        </Card>
      </Section>

      <Section title="Accessibility" subtitle="These change every screen and every recommendation.">
        <Card><AccessibilityControls /></Card>
      </Section>

      <Section title="Notifications" id="notifications">
        <Card className="grid-2">
          {[['delays', 'Delays and disruptions', 'alert'], ['arrivals', 'Vehicle arriving', 'clock'], ['transfers', 'Transfers, gates and platforms', 'swap'], ['safety', 'Safety alerts', 'shield'], ['booking', 'Bookings and payments', 'ticket'], ['offers', 'Offers', 'tag']].map(([k, l, i]) => (
            <Switch key={k} checked={profile.notifications[k]} onChange={(v) => setP({ notifications: { ...profile.notifications, [k]: v } })} label={l} icon={i} hint={k === 'safety' ? 'Urgent safety alerts always show' : undefined} />
          ))}
        </Card>
      </Section>

      <Section title="Payment and travel pass">
        <div className="grid-2">
          <TravelPassCard pass={pass} name={profile.name} />
          <Card>
            <ul className="stack stack--sm" style={{ listStyle: 'none' }}>
              {profile.payment.map((p) => <li key={p.id} className="row"><Icon name={p.id === 'pass' ? 'wallet' : p.id === 'card' ? 'card' : 'hand'} size={20} /><span><strong>{p.label}</strong><span className="small faint" style={{ display: 'block' }}>{p.detail}</span></span></li>)}
            </ul>
            <Notice className="" tone="ok">Payment details are fictional. NEXORA never shows full card numbers.</Notice>
          </Card>
        </div>
      </Section>

      <div className="section">
        <Button variant="danger-outline" icon="refresh" onClick={() => setReset(true)}>Reset demo data</Button>
      </div>
      <ConfirmationModal open={reset} onClose={() => setReset(false)} onConfirm={() => { resetAll(); setReset(false); }} title="Reset all demo data?" icon="refresh" tone="danger" confirmLabel="Reset" confirmVariant="danger">
        <p>Your preferences, journeys, alerts and Pass balance go back to the starting demo. The welcome screen will show again.</p>
      </ConfirmationModal>
    </div>
  );
}
