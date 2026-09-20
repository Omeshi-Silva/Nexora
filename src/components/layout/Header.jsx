import { useLocation } from 'react-router-dom';
import Link from '../common/GoLink';
import Icon from '../common/Icon';
import BackButton from '../common/BackButton';
import Logo from './Logo';
import DesktopNavigation from './DesktopNavigation';
import { useApp } from '../../context/AppContext';

const TITLES = {
  '/': ['Where to?', 'Travel Beyond Limits.'],
  '/journey': ['Your journey', 'The simplest way there'],
  '/live': ['Live journey', 'Just follow along'],
};

export default function Header() {
  const { pathname } = useLocation();
  const { unread, profile, openPanel } = useApp();
  const [title, sub] = TITLES[pathname] || TITLES['/'];
  const back = pathname === '/live' ? '/journey' : pathname === '/journey' ? '/' : null;

  return (
    <header className={`header ${back ? 'header--sub' : ''}`}>
      <div className="container header__inner">
        {back && <BackButton to={back} label={`Back to ${back === '/' ? 'Home' : 'Journey details'}`} />}
        <Link to="/" className="brand" aria-label="NEXORA home">
          <Logo />
        </Link>
        <div className="header__title" aria-live="polite">
          <strong>{title}</strong>
          <small>{sub}</small>
        </div>
        <DesktopNavigation />
        <div className="header__actions">
          <button type="button" className="icon-btn" onClick={() => openPanel('alerts')} aria-label={`Alerts${unread ? `, ${unread} unread` : ''}`}>
            <Icon name="bell" size={22} />
            {unread > 0 && <span className="icon-btn__badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
          </button>
          <button type="button" className="icon-btn header__profile" onClick={() => openPanel('profile')} aria-label="Profile">
            <span className="avatar" aria-hidden="true">{profile.initials}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
