import { useApp } from '../../context/AppContext';
import { Card, Section, Switch } from '../../components/common/ui';

const ITEMS = [
  ['location', 'Location sharing', 'pin', 'Used to find vehicles near you and track your journey. Never sold. Deleted 24 hours after each trip.'],
  ['personalization', 'Personalisation', 'sparkles', 'Lets NEXORA learn from your trips to suggest better routes. Turn off and it treats you as a new traveller every time.'],
  ['history', 'Journey history', 'clock', 'Keeps your past trips so you can repeat them. Stored for 12 months unless you delete it.'],
  ['notifications', 'Notifications', 'bell', 'Lets NEXORA send you alerts. Urgent safety alerts are always shown.'],
  ['emergencyShare', 'Emergency data sharing', 'shield', 'Shares your location and accessibility needs with responders only during an emergency you confirm.'],
];

/** Transparent privacy controls: what is used, why, and a switch for each. */
export default function PrivacySection() {
  const { profile, setProfile } = useApp();
  return (
    <div className="panel-body" >
      
      <p className="lead" style={{ marginTop: 6 }}>You decide what NEXORA uses. Here is exactly what each setting does.</p>
      <div className="stack section">
        {ITEMS.map(([k, l, i, why]) => (
          <Card key={k}>
            <Switch checked={profile.privacy[k]} onChange={(v) => setProfile((p) => ({ ...p, privacy: { ...p.privacy, [k]: v } }))} label={l} icon={i} />
            <p className="small muted" style={{ marginTop: 8 }}>{why}</p>
          </Card>
        ))}
        <Card>
          <h2 className="h3">Payment information</h2>
          <p className="small muted" style={{ marginTop: 6 }}>Card details are held by your bank, not by NEXORA. We only see the last four digits.</p>
        </Card>
        <Card>
          <h2 className="h3">Accessibility preferences</h2>
          <p className="small muted" style={{ marginTop: 6 }}>Used only to plan suitable routes and book assistance. Never used for advertising or shared with vehicle operators beyond what is needed to help you board.</p>
        </Card>
      </div>
      <Section title="Terms" id="terms">
        <Card><p className="small muted">NEXORA is a student design prototype for the Cre8x 3.0 designathon. All services, vehicles, prices and data are fictional and simulated. No real payments, locations or personal data are collected; preferences are stored only in this browser.</p></Card>
      </Section>
    </div>
  );
}
