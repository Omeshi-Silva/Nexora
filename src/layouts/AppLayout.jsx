import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileBottomNavigation from '../components/layout/MobileBottomNavigation';
import Toasts from '../components/common/Toasts';
import PageTransition from '../components/common/PageTransition';
import AccessibilityPanel from '../components/accessibility/AccessibilityPanel';
import OnboardingSheet from '../components/accessibility/OnboardingSheet';
import PanelHost from '../components/panels/PanelHost';
import PersonaBanner from '../components/common/PersonaBanner';

/** Global shell: header, the current primary page, navigation, panels, alerts. */
export default function AppLayout() {
  const { pathname, search } = useLocation();
  const isMap = pathname === '/live';
  useEffect(() => { window.scrollTo(0, 0); }, [pathname, search]);
  const skip = (e) => { e.preventDefault(); document.getElementById('main')?.focus(); };
  return (
    <div className={`app ${isMap ? 'app--map' : ''}`}>
      <a href="#main" className="skip-link" onClick={skip}>Skip to main content</a>
      <Header />
      {!isMap && <PersonaBanner />}
      <main id="main" className="main" tabIndex={-1}>
        <PageTransition><Outlet /></PageTransition>
      </main>
      {!isMap && <Footer />}
      <MobileBottomNavigation />
      <PanelHost />
      <Toasts />
      <AccessibilityPanel />
      <OnboardingSheet />
    </div>
  );
}
