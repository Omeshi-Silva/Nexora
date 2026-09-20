import { NavLink } from 'react-router-dom';
import Icon from '../common/Icon';
import useGo from '../../hooks/useGo';
import { NAV_ITEMS } from './navItems';
import { useJourney } from '../../context/JourneyContext';
import { useApp } from '../../context/AppContext';

export default function MobileBottomNavigation() {
  const { trip } = useJourney();
  const { panel, openPanel, closePanel } = useApp();
  const go = useGo();
  const live = trip && !trip.completed;
  return (
    <nav className="bottom-nav" aria-label="Main">
      {NAV_ITEMS.filter((i) => i.mobile).map((item) => {
        const inner = (
          <>
            <span className="bottom-nav__icon">
              <Icon name={item.icon} size={22} />
              {item.to === '/live' && live && <span className="bottom-nav__live" aria-hidden="true" />}
            </span>
            <span>{item.label}{item.to === '/live' && live ? <span className="sr-only"> (journey in progress)</span> : null}</span>
          </>
        );
        if (item.panel) {
          const on = panel?.type === item.panel;
          return (
            <button key={item.panel} type="button" className={`bottom-nav__item ${item.ai ? 'bottom-nav__item--ai' : ''} ${on ? 'active' : ''}`} aria-pressed={on} onClick={() => (on ? closePanel() : openPanel(item.panel))}>{inner}</button>
          );
        }
        return (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={(e) => { e.preventDefault(); go(item.to); }} className={({ isActive }) => `bottom-nav__item ${isActive && !panel ? 'active' : ''}`}>{inner}</NavLink>
        );
      })}
    </nav>
  );
}
