import Icon from '../common/Icon';
import { PLACE_BY_ID } from '../../data/places';

/** Four one-tap destinations, as simple pills. */
export const HOME_QUICK = ['work', 'station', 'airport', 'university'];

export default function QuickDestinations({ onPick, ids = HOME_QUICK }) {
  return (
    <ul className="nx-quick" aria-label="Quick destinations">
      {ids.map((id) => {
        const p = PLACE_BY_ID[id];
        return (
          <li key={id}>
            <button type="button" onClick={() => onPick(id)} aria-label={`Plan a trip to ${p.name}: ${p.label}`}>
              <Icon name={p.icon} size={18} />
              <span>{p.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
