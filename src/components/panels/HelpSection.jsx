import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useJourney } from '../../context/JourneyContext';
import { ConfirmationModal } from '../../components/common/Modal';
import { Card, Section, Switch, Notice } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';

const FAQS = [
  ['What if I miss my connection?', 'NEXORA books you onto the next departure automatically and tells you the new time. If there is a faster alternative, it asks before switching.'],
  ['Can someone help me board?', 'Yes. Turn on “Help boarding” when you plan, or tell NEXORA. Staff or a robot assistant meet you at every stop, free of charge.'],
  ['What happens if the app loses signal?', 'Your ticket works offline, and the map shows the last known position and scheduled times until the connection returns.'],
  ['How do children travel alone?', 'Child-Safe Autonomous Vehicles verify the child and guardian, lock child-safe doors, and send boarding and arrival notifications.'],
];

/** Safety and help: emergency, sharing, support, incidents, lost property, FAQs and contact. */
export default function HelpSection() {
  const { hash } = useLocation();
  const { notify, profile, setProfile } = useApp();
  const { trip } = useJourney();
  const [confirm, setConfirm] = useState(null);
  const [report, setReport] = useState({ type: 'Safety concern', text: '' });
  const [reportErr, setReportErr] = useState('');
  const [reported, setReported] = useState(false);
  const [lost, setLost] = useState('');
  const [lostSent, setLostSent] = useState(false);
  const [sharing, setSharing] = useState(false);
  useEffect(() => { if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60); }, [hash]);

  const ACTIONS = {
    emergency: { title: 'Get urgent help now?', body: 'NEXORA will connect you to emergency services, share your live location and stop your vehicle at the nearest safe point if you are travelling.', done: ['Emergency services contacted', 'Help is on the way. Stay where you are. A responder will speak to you in a moment.'] },
    vehicle: { title: 'Stop your vehicle safely?', body: 'Your vehicle will pull over at the next safe point and open a voice link to NEXORA support.', done: ['Vehicle stopping safely', 'Pulling over in about 30 seconds. Support is joining the call.'] },
    support: { title: 'Call NEXORA support?', body: 'You will be connected to a person, 24 hours a day. You can also type if you cannot speak.', done: ['Connecting you to support', 'Average wait: under 1 minute. You can type or talk.'] },
  };
  const run = () => {
    const a = ACTIONS[confirm];
    notify({ type: 'safety', severity: confirm === 'support' ? 'info' : 'critical', title: a.done[0], body: a.done[1] });
    setConfirm(null);
  };
  const submitReport = (e) => {
    e.preventDefault();
    if (report.text.trim().length < 10) { setReportErr('Please describe what happened in at least 10 characters so the team can help.'); return; }
    setReportErr(''); setReported(true);
    notify({ type: 'safety', severity: 'success', title: 'Report received', body: 'Reference SR-2100-7741. The safety team will reply within 30 minutes.' });
  };

  return (
    <div className="panel-body" >
      
      <div className="section" id="emergency">
        <button type="button" className="sos-btn" onClick={() => setConfirm('emergency')}>
          <Icon name="sos" size={34} />
          <span><strong>Emergency</strong><small>Get help now. You will confirm first.</small></span>
        </button>
      </div>
      <div className="grid-2 section">
        <Card>
          <div className="row"><span className="card-icon card-icon--warn"><Icon name="car" size={20} /></span><h2 className="h3">Vehicle emergency</h2></div>
          <p className="small muted" style={{ margin: '8px 0' }}>{trip ? 'Stop your current vehicle at the next safe point.' : 'Use this while travelling to stop your vehicle safely.'}</p>
          <Button size="sm" onClick={() => setConfirm('vehicle')} disabled={!trip}>Stop vehicle safely</Button>
        </Card>
        <Card>
          <div className="row"><span className="card-icon"><Icon name="share" size={20} /></span><h2 className="h3">Share my location</h2></div>
          <p className="small muted" style={{ margin: '8px 0' }}>{sharing ? 'Sharing live with your trusted contact until you arrive.' : 'Send your live journey to a trusted contact.'}</p>
          <Switch checked={sharing} onChange={(v) => { setSharing(v); notify({ type: 'safety', severity: 'info', title: v ? 'Location sharing on' : 'Location sharing off', body: v ? 'Your trusted contact can see your journey until you arrive.' : 'No one can see your location now.' }); }} label="Share live location" icon="pin" />
        </Card>
        <Card>
          <div className="row"><span className="card-icon"><Icon name="phone" size={20} /></span><h2 className="h3">Contact support</h2></div>
          <p className="small muted" style={{ margin: '8px 0' }}>A person, 24 hours a day, by voice or text.</p>
          <Button size="sm" onClick={() => setConfirm('support')}>Contact support</Button>
        </Card>
      </div>

      <Section title="Safe routes">
        <Card>
          <Switch checked={profile.privacy.emergencyShare} onChange={(v) => setProfile((p) => ({ ...p, privacy: { ...p.privacy, emergencyShare: v } }))} label="Prefer well-lit, staffed routes at night" hint="NEXORA may add a few minutes to keep you on busier routes" icon="shield" />
          <ul className="check-list" style={{ marginTop: 12 }}>
            <li><Icon name="check" size={18} /><span>Every vehicle has an emergency button and a two-way voice link.</span></li>
            <li><Icon name="check" size={18} /><span>All hubs are staffed, step-free and monitored around the clock.</span></li>
            <li><Icon name="check" size={18} /><span>Vehicles check their own health before every trip.</span></li>
          </ul>
        </Card>
      </Section>

      <Section title="Report an incident">
        <Card as="form" onSubmit={submitReport} noValidate className="stack">
          {reported ? <Notice tone="ok" role="status">Report received. Reference SR-2100-7741. We will reply within 30 minutes.</Notice> : (
            <>
              <div className="field"><label className="field__label" htmlFor="rtype">What kind of problem?</label>
                <select id="rtype" className="select" value={report.type} onChange={(e) => setReport({ ...report, type: e.target.value })}>{['Safety concern', 'Vehicle problem', 'Accessibility problem', 'Harassment', 'Other'].map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="field"><label className="field__label" htmlFor="rtext">What happened?</label>
                <textarea id="rtext" className="textarea" value={report.text} aria-invalid={Boolean(reportErr)} aria-describedby={reportErr ? 'rtext-err' : undefined} onChange={(e) => setReport({ ...report, text: e.target.value })} />
                {reportErr && <p className="field__error" id="rtext-err" role="alert"><Icon name="alert" size={16} />{reportErr}</p>}</div>
              <Button type="submit" variant="primary">Send report</Button>
            </>
          )}
        </Card>
      </Section>

      <Section title="Lost and found">
        <Card className="stack">
          {lostSent ? <Notice tone="ok" role="status">Search started. We check the last 3 vehicles you used and will message you.</Notice> : (
            <>
              <div className="field"><label className="field__label" htmlFor="lost">What did you lose?</label><input id="lost" className="input" value={lost} onChange={(e) => setLost(e.target.value)} placeholder="e.g. Blue umbrella" /></div>
              <Button disabled={!lost.trim()} onClick={() => setLostSent(true)}>Search my recent vehicles</Button>
            </>
          )}
        </Card>
      </Section>

      <Section title="Questions" id="help">
        <div className="stack stack--sm">
          {FAQS.map(([q, a]) => (
            <details key={q} className="card faq"><summary><span className="grow strong">{q}</span><Icon name="down" size={18} /></summary><p className="muted" style={{ marginTop: 8 }}>{a}</p></details>
          ))}
        </div>
      </Section>

      <Section title="Contact" id="contact">
        <Card><p>NEXORA Care: call <strong>2100</strong> from any vehicle or hub, text “HELP” to 2100, or use the Help section. Sign language video support is available at every hub.</p></Card>
      </Section>

      <ConfirmationModal open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={run} title={ACTIONS[confirm]?.title} icon={confirm === 'support' ? 'phone' : 'sos'} tone={confirm === 'support' ? undefined : 'danger'} confirmVariant={confirm === 'support' ? 'primary' : 'danger'} confirmLabel={confirm === 'support' ? 'Call support' : 'Yes, do it now'}>
        <p>{ACTIONS[confirm]?.body}</p>
      </ConfirmationModal>
    </div>
  );
}
