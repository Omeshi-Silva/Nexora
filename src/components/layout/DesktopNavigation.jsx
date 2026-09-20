import { NavLink } from 'react-router-dom';
import Icon from '../common/Icon';
import useGo from '../../hooks/useGo';
import { NAV_ITEMS } from './navItems';
import { useApp } from '../../context/AppContext';

export default function DesktopNavigation() {
  const { panel, openPanel, closePanel } = useApp();
  const go = useGo();
  return (
    <nav className="desk-nav" aria-label="Main">
      {NAV_ITEMS.filter((i) => i.desktop).map((item) => (item.to ? (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={(e) => { e.preventDefault(); go(item.to); }} className={({ isActive }) => (isActive && !panel ? 'active' : undefined)}>
          <Icon name={item.icon} size={18} />{item.desktopLabel || item.label}
        </NavLink>
      ) : (
        <button key={item.panel} type="button" className={panel?.type === item.panel ? 'active' : undefined} aria-pressed={panel?.type === item.panel} onClick={() => openPanel(item.panel)}>
          <Icon name={item.icon} size={18} />{item.label}
        </button>
      )))}
    </nav>
  );
}
