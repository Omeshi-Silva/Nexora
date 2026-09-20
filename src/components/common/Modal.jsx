import { useEffect, useId, useRef } from 'react';
import Icon from './Icon';
import Button from './Button';

/** Accessible dialog: bottom sheet on mobile, centred on larger screens. Esc closes, focus is trapped. */
export default function Modal({ open, onClose, title, icon, tone, children, footer, labelledBy, size }) {
  const ref = useRef(null);
  const hid = useId();
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const el = ref.current;
    const focusables = () => el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (focusables()[1] || focusables()[0] || el).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const f = [...focusables()];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={ref} className={`modal ${tone ? `modal--${tone}` : ''} ${size ? `modal--${size}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy || hid} tabIndex={-1}>
        <div className="modal__grip" aria-hidden="true" />
        <div className="modal__head">
          {icon && <span className={`card-icon ${tone === 'ai' ? 'card-icon--ai' : tone === 'danger' ? 'card-icon--bad' : ''}`}><Icon name={icon} size={22} /></span>}
          <h2 className="h2" id={hid} style={{ paddingTop: 8 }}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div>{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/** Confirmation before bookings, cancellations, route changes and emergencies. */
export function ConfirmationModal({ open, onClose, onConfirm, title, icon = 'check', tone, confirmLabel = 'Confirm', cancelLabel = 'Cancel', confirmVariant = 'primary', loading, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={icon}
      tone={tone}
      footer={(
        <>
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      {children}
    </Modal>
  );
}
