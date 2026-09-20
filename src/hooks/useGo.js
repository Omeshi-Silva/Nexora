import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { withTransition } from '../utils/viewTransition';

/**
 * Navigates to one of the three primary routes (with a page morph where supported), or opens a panel.
 * Targets: '/journey?view=delays', '/live', 'panel:vehicle:metro', 'panel:profile:pass'.
 */
export default function useGo() {
  const nav = useNavigate();
  const navRef = useRef(nav);
  navRef.current = nav;
  const { openPanel, closePanel } = useApp();
  return useCallback((to, opts) => {
    if (typeof to === 'number') { navRef.current(to); return; }
    if (typeof to === 'string' && to.startsWith('panel:')) {
      const [, type, ...rest] = to.split(':');
      openPanel(type, rest.join(':') || null);
      return;
    }
    withTransition(() => { closePanel(); navRef.current(to, opts); });
  }, [openPanel, closePanel]);
}
