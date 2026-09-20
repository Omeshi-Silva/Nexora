import { money } from '../../utils/format';

/** Transparent fare: every item, fee and tax visible. */
export default function FareBreakdown({ fare, usePass, discount = 0 }) {
  const passSaving = usePass ? fare.passSaving : 0;
  const total = Math.max(0, Math.round((fare.total - passSaving - discount) * 100) / 100);
  return (
    <table className="fare-table">
      <caption className="sr-only">Fare breakdown</caption>
      <tbody>
        {fare.items.map((i, idx) => (
          <tr key={`${i.label}-${idx}`}><td>{i.label}{i.estimated && <span className="tiny faint"> (estimated)</span>}</td><td>{money(i.amount)}</td></tr>
        ))}
        {fare.fees.map((f) => (
          <tr key={f.label}><td>{f.label}{f.note && <span className="tiny faint"> ({f.note})</span>}</td><td>{f.amount ? money(f.amount) : 'Free'}</td></tr>
        ))}
        <tr><td>Mobility tax (5%)</td><td>{money(fare.tax)}</td></tr>
        {passSaving > 0 && <tr className="saving"><td>NEXORA Pass discount (10%)</td><td>−{money(passSaving)}</td></tr>}
        {discount > 0 && <tr className="saving"><td>Offer discount</td><td>−{money(discount)}</td></tr>}
        <tr className="total"><td>Total</td><td>{money(total)}</td></tr>
      </tbody>
    </table>
  );
}

export const fareTotal = (fare, usePass, discount = 0) => Math.max(0, Math.round((fare.total - (usePass ? fare.passSaving : 0) - discount) * 100) / 100);
