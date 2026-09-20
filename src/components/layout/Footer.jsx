import Link from '../common/GoLink';
import { useApp } from '../../context/AppContext';

export default function Footer() {
  const { setA11yOpen } = useApp();
  return (
    <footer className="footer">
      <div className="container stack">
        <nav className="footer__links" aria-label="Footer">
          <Link to="panel:profile:help">Help</Link>
          <button type="button" onClick={() => setA11yOpen(true)}>Accessibility</button>
          <Link to="panel:services">Services</Link>
          <Link to="panel:profile:privacy">Privacy</Link>
          <Link to="panel:profile:privacy" className="adv-link">Terms</Link>
          <Link to="panel:profile:help" className="adv-link">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
