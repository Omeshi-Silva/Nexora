import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Segmented } from '../common/ui';
import ProfileSettings from './ProfileSettings';
import SavedJourneysSection from './SavedJourneysSection';
import TravelPassSection from './TravelPassSection';
import PrivacySection from './PrivacySection';
import HelpSection from './HelpSection';

const TABS = [
  { value: 'settings', label: 'Preferences' },
  { value: 'journeys', label: 'Saved journeys' },
  { value: 'pass', label: 'Travel pass' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'help', label: 'Help' },
];

/** Lightweight profile drawer: preferences, saved journeys, pass, privacy and help. */
export default function ProfilePanel({ initialTab }) {
  const { profile, pass } = useApp();
  const [tab, setTab] = useState(TABS.some((t) => t.value === initialTab) ? initialTab : 'settings');
  return (
    <div className="stack">
      <div className="profile-card">
        <span className="avatar avatar--lg" aria-hidden="true">{profile.initials}</span>
        <div className="grow">
          <p className="h3">{profile.name}</p>
          <p className="small muted">Member since {profile.memberSince}. {pass.tier} tier.</p>
        </div>
      </div>
      <div className="panel-tabs"><Segmented label="Profile sections" value={tab} onChange={setTab} options={TABS} /></div>
      {tab === 'settings' && <ProfileSettings />}
      {tab === 'journeys' && <SavedJourneysSection />}
      {tab === 'pass' && <TravelPassSection />}
      {tab === 'privacy' && <PrivacySection />}
      {tab === 'help' && <HelpSection />}
    </div>
  );
}
