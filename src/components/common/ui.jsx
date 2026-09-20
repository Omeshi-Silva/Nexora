/** Small reusable UI primitives. */
import { useId, useState } from 'react';
import Icon from './Icon';

export function Card({ as: Tag = 'section', variant, pad, className = '', children, ...rest }) {
  const cls = ['card', variant && `card--${variant}`, pad && 'card--pad', className].filter(Boolean).join(' ');
  return <Tag className={cls} {...rest}>{children}</Tag>;
}

export function Section({ title, subtitle, action, children, id, className = '' }) {
  const hid = useId();
  return (
    <section className={`section ${className}`} aria-labelledby={hid} id={id}>
      <div className="section__head">
        <div>
          <h2 className="h2" id={hid}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Status badge: always icon + text, never colour alone. */
const TONE_ICON = { ok: 'check', warn: 'alert', bad: 'alert', info: 'info', ai: 'sparkles', concept: 'flag' };
export function StatusBadge({ tone = 'info', icon, children, className = '' }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      <Icon name={icon || TONE_ICON[tone]} size={14} strokeWidth={2.2} />
      {children}
    </span>
  );
}

export function Chip({ pressed, icon, children, className = '', ...rest }) {
  return (
    <button type="button" className={`chip ${className}`} aria-pressed={pressed === undefined ? undefined : Boolean(pressed)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function Switch({ checked, onChange, label, hint, icon }) {
  return (
    <button type="button" role="switch" aria-checked={Boolean(checked)} className="switch" onClick={() => onChange(!checked)}>
      {icon && <span className="card-icon" style={{ width: 38, height: 38, borderRadius: 12 }}><Icon name={icon} size={18} /></span>}
      <span className="switch__label">
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <span className="switch__state" aria-hidden="true">{checked ? 'On' : 'Off'}</span>
      <span className="switch__track" aria-hidden="true" />
    </button>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Stat({ label, value, note, icon }) {
  return (
    <div className="stat">
      <div className="stat__label">{icon && <Icon name={icon} size={15} />}{label}</div>
      <div className="stat__value">{value}</div>
      {note && <div className="stat__note">{note}</div>}
    </div>
  );
}

export function Progress({ value, label }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label}>
      <div className="progress__bar" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Meter({ value, label, tone }) {
  const color = tone || (value >= 90 ? 'var(--ok)' : value >= 75 ? 'var(--cyan)' : value >= 60 ? 'var(--warn)' : 'var(--bad)');
  return (
    <div className="meter" style={{ '--v': value, '--c': color }} role="img" aria-label={`${label}: ${value} out of 100`}>
      <span>{value}</span>
    </div>
  );
}

export function KV({ rows, two }) {
  return (
    <dl className={`kv ${two ? 'kv--two' : ''}`}>
      {rows.filter((r) => r && r[1] !== undefined && r[1] !== null && r[1] !== false).map(([k, v, cls]) => (
        <div className={`kv__row ${cls || ''}`} key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone, icon, children, className = '', role }) {
  const ic = icon || { warn: 'alert', bad: 'alert', ai: 'sparkles', ok: 'check' }[tone] || 'info';
  return (
    <div className={`notice ${tone ? `notice--${tone}` : ''} ${className}`} role={role}>
      <Icon name={ic} size={18} />
      <div className="grow">{children}</div>
    </div>
  );
}

export function CheckList({ items, tone }) {
  return (
    <ul className={`check-list ${tone ? `check-list--${tone}` : ''}`}>
      {items.map((t) => (
        <li key={t}><Icon name={tone === 'warn' ? 'alert' : tone === 'ai' ? 'sparkles' : 'check'} size={18} /><span>{t}</span></li>
      ))}
    </ul>
  );
}

export function Skeleton({ height = 18, width = '100%', style }) {
  return <div className="skeleton" style={{ height, width, ...style }} aria-hidden="true" />;
}

/** Empty state: explains what is missing and offers the next action. */
export function EmptyState({ icon = 'route', title, children, action }) {
  return (
    <div className="card empty">
      <span className="card-icon"><Icon name={icon} size={26} /></span>
      <h2 className="h3">{title}</h2>
      {children && <p className="muted" style={{ maxWidth: '44ch' }}>{children}</p>}
      {action}
    </div>
  );
}

/** Error state: what happened, why, and what to do next. */
export function ErrorState({ title, why, next, action }) {
  return (
    <div className="card card--bad" role="alert">
      <div className="row row--top">
        <span className="card-icon card-icon--bad"><Icon name="alert" size={22} /></span>
        <div className="stack stack--sm grow">
          <h2 className="h3">{title}</h2>
          {why && <p className="muted"><strong>Why: </strong>{why}</p>}
          {next && <p className="muted"><strong>What you can do: </strong>{next}</p>}
          {action}
        </div>
      </div>
    </div>
  );
}

/** Tap/click/focus tooltip (never hover-only). */
export function Tooltip({ text, label = 'More information' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} aria-label={label} aria-expanded={open} aria-describedby={open ? id : undefined} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)}>
        <Icon name="info" size={18} />
      </button>
      {open && (
        <span id={id} role="tooltip" className="card" style={{ position: 'absolute', zIndex: 20, top: 40, right: 0, width: 240, padding: 12, fontSize: '0.9rem', background: 'var(--glass-strong)' }}>
          {text}
        </span>
      )}
    </span>
  );
}
