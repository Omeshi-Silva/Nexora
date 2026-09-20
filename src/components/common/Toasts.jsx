import Link from './GoLink';
import { useApp } from '../../context/AppContext';
import Icon from './Icon';

const ICON = { success: 'check', warning: 'alert', critical: 'sos', info: 'bell' };

/** On-screen notifications. Always text (captions), announced to screen readers. */
export default function Toasts() {
  const { toasts, dismissToast, flash, prefs } = useApp();
  return (
    <>
      {flash && prefs.visualAlerts && <div className="flash" aria-hidden="true" />}
      <div className="toasts" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.severity}`} role={t.severity === 'critical' ? 'alert' : 'status'}>
            <span className={`card-icon ${t.severity === 'warning' ? 'card-icon--warn' : t.severity === 'critical' ? 'card-icon--bad' : t.severity === 'success' ? 'card-icon--ok' : ''}`} style={{ width: 38, height: 38, borderRadius: 12 }}>
              <Icon name={ICON[t.severity] || 'bell'} size={18} />
            </span>
            <div className="toast__body">
              <strong>{t.title}</strong>
              {t.body && <p>{t.body}</p>}
              {t.action && (
                <Link to={t.action.to} className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }} onClick={() => dismissToast(t.id)}>{t.action.label}</Link>
              )}
            </div>
            <button type="button" className="icon-btn" style={{ width: 40, height: 40 }} onClick={() => dismissToast(t.id)} aria-label={`Dismiss: ${t.title}`}>
              <Icon name="close" size={18} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
