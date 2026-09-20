import Link from './GoLink';
import Icon from './Icon';

/**
 * Button with loading and success states. Renders a Link when `to` is given.
 * variant: primary | secondary | ai | ghost | danger | danger-outline | success
 */
export default function Button({ variant = 'secondary', size, block, icon, iconRight, loading, success, to, children, className = '', ...rest }) {
  const cls = ['btn', variant !== 'secondary' && `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className].filter(Boolean).join(' ');
  const content = (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : success ? <Icon name="check" /> : icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
      {iconRight && !loading && <Icon name={iconRight} />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  return (
    <button type="button" className={cls} aria-busy={loading || undefined} disabled={loading || rest.disabled} {...rest}>
      {content}
    </button>
  );
}
