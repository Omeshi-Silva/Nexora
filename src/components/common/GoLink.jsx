import { Link } from 'react-router-dom';
import useGo from '../../hooks/useGo';

/** A link that understands both routes and panels ("panel:profile"), with page morphing for routes. */
export default function GoLink({ to, onClick, children, ...rest }) {
  const go = useGo();
  const handle = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();
    go(to);
  };
  if (typeof to === 'string' && to.startsWith('panel:')) {
    return <a href="#main" onClick={handle} {...rest}>{children}</a>;
  }
  return <Link to={to} onClick={handle} {...rest}>{children}</Link>;
}
