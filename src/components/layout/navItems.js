/** Three routes plus one panel (Profile). */
export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', mobile: true, desktop: true },
  { to: '/journey', label: 'Journey', icon: 'route', mobile: true, desktop: true },
  { to: '/live', label: 'Track', desktopLabel: 'Track', icon: 'map', mobile: true, desktop: true },
  { panel: 'profile', label: 'Profile', icon: 'user', mobile: true, desktop: false },
];
