import { money } from '../../utils/format';
import Logo from '../layout/Logo';

export default function TravelPassCard({ pass, name }) {
  return (
    <div className="pass-card" role="group" aria-label="NEXORA Pass">
      <div className="spread">
        <span className="row"><Logo size={44} /><strong>Pass</strong></span>
        <span className="badge badge--ai">{pass.tier}</span>
      </div>
      <div>
        <p className="tiny">Balance</p>
        <p className="big-time">{money(pass.balance)}</p>
      </div>
      <div className="spread small">
        <span>{name}</span>
        <span className="num">{pass.points.toLocaleString()} points</span>
      </div>
      <p className="tiny pass-card__id">{pass.id}, valid until {pass.validUntil}</p>
    </div>
  );
}
