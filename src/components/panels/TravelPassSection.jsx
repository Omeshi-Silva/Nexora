import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useJourney } from '../../context/JourneyContext';
import Logo from '../layout/Logo';
import QRCode from '../../components/booking/QRCode';
import { Notice } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import { PLACE_BY_ID } from '../../data/places';
import { money } from '../../utils/format';

/** Digital travel pass: balance, membership, active ticket, QR/NFC boarding, recent journeys, rewards. */
export default function TravelPassSection() {
  const { pass, setPass, profile, journeys, notify } = useApp();
  const { trip } = useJourney();
  const [tapping, setTapping] = useState(false);
  const topUp = (n) => { setPass({ ...pass, balance: Math.round((pass.balance + n) * 100) / 100 }); notify({ type: 'booking', severity: 'success', title: `Added ${money(n)}`, body: 'Your NEXORA Pass has been topped up (demo, no real payment).' }); };
  const redeem = () => {
    if (pass.points < 1000) return;
    setPass({ ...pass, points: pass.points - 1000, balance: pass.balance + 10 });
    notify({ type: 'offer', severity: 'success', title: '$10 travel credit added', body: '1,000 points redeemed.' });
  };
  const deduct = (n) => { const amt = Math.min(n, pass.balance); setPass({ ...pass, balance: Math.round((pass.balance - amt) * 100) / 100 }); notify({ type: 'booking', severity: 'info', title: `Removed ${money(amt)}`, body: 'Simulated balance updated (testing only).' }); };
  const tap =() => { setTapping(true); setTimeout(() => { setTapping(false); notify({ type: 'journey', severity: 'success', title: 'Tap accepted', body: 'Gate open. Have a good journey.' }); }, 1200); };
  const recent = journeys.filter((j) => j.status === 'completed').slice(0, 4);
  const when = (t) => (t ? new Date(t).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
  const modeIcon = (j) => { const m = (j.modes || [])[0] || ''; return /pod|taxi|car/.test(m) ? 'car' : /metro|train/.test(m) ? 'train' : 'bus'; };
  const next = Math.max(0, 1000 - (pass.points % 1000));
  return (
    <div className="panel-body stack stack--lg tp">
      <section className="tp-hero" role="group" aria-label="NEXORA Travel Pass">
        <div className="tp-hero__top">
          <Logo size={56} />
          <div className="tp-tier"><strong><Icon name="crown" size={18} />{pass.tier}</strong><span className="tiny">Current member tier</span></div>
        </div>
        <p className="tiny tp-tagline">YOUR JOURNEY. A BRIGHTER TOMORROW.</p>
        <div>
          <h2 className="h2">{profile.name}</h2>
          <p className="muted">Member since 2094</p>
        </div>
      </section>

      <section className="tp-card">
        <h2 className="h3">Travel Pass Balance</h2>
        <p className="muted small">Use this balance to pay for your journeys.</p>
        <div className="tp-balance">
          <div>
            <p className="tp-amount num">{money(pass.balance)}</p>
            <span className="tp-chip"><Icon name="info" size={14} /> Simulated balance</span>
          </div>
          <div className="tp-actions">
            <div><Button variant="ghost" icon="minus" onClick={() => deduct(5)} disabled={pass.balance <= 0}>Deduct</Button><p className="tiny faint">Remove an amount (for testing)</p></div>
            <div><Button variant="primary" icon="plus" onClick={() => topUp(20)}>Top up</Button><p className="tiny faint">Add money to your pass</p></div>
          </div>
        </div>
      </section>

      <section className={`tp-card tp-card--board${trip ? ' is-live' : ''}`}>
        <h2 className="h3">{trip ? 'Your active journey ticket' : 'Your boarding code'}</h2>
        <p className="muted small">{trip ? `${trip.route.fromName} to ${trip.route.toShort}. Show this code or tap your phone at the gate.` : 'Show this code to board NEXORA buses, trains and other services.'}</p>
        <div className="tp-board">
          <div className="tp-qr"><QRCode value={trip ? trip.id : pass.id} size={180} label={trip ? 'Boarding code for your active journey' : 'NEXORA Pass code'} /></div>
          <div className="tp-nfc">
            <span className="tp-nfc__icon"><Icon name="signal" size={28} /></span>
            <div className="stack stack--sm">
              <strong>Tap to board (NFC)</strong>
              <span className="muted small">Hold your phone near the reader.</span>
              <button type="button" className="tp-ready" onClick={tap} disabled={tapping}><Icon name="check" size={16} /> {tapping ? 'Hold near the reader' : 'Ready to use'}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="tp-card">
        <h2 className="h3">How rewards work</h2>
        <div className="tp-rewards">
          <div className="tp-reward">
            <span className="tp-reward__icon tp-reward__icon--gold"><Icon name="star" size={24} /></span>
            <strong>Earn points</strong>
            <p className="muted small">You get points every time you travel.</p>
            <p className="tp-note">10 points = $1 spent</p>
            <p className="tiny faint">You have {pass.points.toLocaleString()} points</p>
          </div>
          <div className="tp-reward">
            <span className="tp-reward__icon tp-reward__icon--violet"><Icon name="tag" size={24} /></span>
            <strong>Redeem rewards</strong>
            <p className="muted small">Use your points for travel credits and special offers.</p>
            <p className="tp-note">e.g. 1,000 points = $10 credit</p>
            <Button onClick={redeem} disabled={pass.points < 1000}>{pass.points < 1000 ? `${next} pts to go` : 'Redeem 1,000 points'}</Button>
          </div>
          <div className="tp-reward">
            <span className="tp-reward__icon tp-reward__icon--green"><Icon name="shield" size={24} /></span>
            <strong>Member benefits</strong>
            <p className="muted small">As an {pass.tier} member, you get 10% off every journey.</p>
            <p className="tp-note">Higher tiers unlock more benefits.</p>
          </div>
        </div>
      </section>

      <section className="tp-card">
        <h2 className="h3">Recent journeys</h2>
        <ul className="stack stack--sm" style={{ listStyle: 'none' }}>
          {recent.length ? recent.map((j) => (
            <li key={j.id} className="tp-journey">
              <span className="tp-journey__icon"><Icon name={modeIcon(j)} size={22} /></span>
              <span className="tp-journey__text"><strong>{j.title}</strong><span className="tiny faint">{when(j.depart)}</span></span>
              <span className="num">{money(j.price)}</span>
            </li>
          )) : <Notice>No completed journeys yet.</Notice>}
        </ul>
      </section>
      <p className="tiny faint">Home station: {PLACE_BY_ID.home.label}.</p>
    </div>
  );
}
