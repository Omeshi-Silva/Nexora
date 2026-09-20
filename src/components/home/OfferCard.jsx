import Icon from '../common/Icon';
import { StatusBadge } from '../common/ui';
import { money } from '../../utils/format';

export default function OfferCard({ offer: o, onUse, used }) {
  const saving = o.original ? o.original - o.price : null;
  return (
    <article className={`card offer-card ${o.expired ? 'is-expired' : ''}`}>
      <div className="spread">
        <span className="card-icon"><Icon name={o.icon} size={22} /></span>
        {o.expired ? <StatusBadge tone="bad">Expired</StatusBadge> : saving ? <StatusBadge tone="ok" icon="tag">Save {money(saving)}</StatusBadge> : <StatusBadge tone="info">Always on</StatusBadge>}
      </div>
      <h3 className="h3">{o.title}</h3>
      {o.original ? (
        <p className="offer-price"><s aria-label={`Was ${money(o.original)}`}>{money(o.original)}</s> <strong>{money(o.price)}</strong></p>
      ) : <p className="offer-price"><strong>Free to join</strong></p>}
      <p className="small muted">{o.conditions}</p>
      <dl className="svc-card__facts">
        <div><dt>Valid</dt><dd>{o.validity}</dd></div>
        {o.eligibility && <div><dt>Who can use it</dt><dd>{o.eligibility}</dd></div>}
      </dl>
      <button type="button" className={`btn btn--sm ${used ? 'btn--success' : ''}`} disabled={o.expired} onClick={() => onUse(o)} style={{ marginTop: 'auto' }}>
        {o.expired ? 'No longer available' : used ? 'Added to your Pass' : 'Add to my Pass'}
      </button>
    </article>
  );
}
