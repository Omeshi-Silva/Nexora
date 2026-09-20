import { useLocation } from 'react-router-dom';

/** Subtle fade between pages; disabled automatically for reduced motion. */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  return <div key={pathname.split('/').slice(0, 2).join('/')} className="page-transition">{children}</div>;
}
