import Icon from '../common/Icon';
import { FAMILIES } from '../../data/vehicles';
import { useSimple } from '../../context/AppContext';

export const familyColor = (f) => FAMILIES[f]?.color || '#00E5FF';

/**
 * The journey ribbon: each leg as a segment sized by its duration, with icon,
 * name and minutes. Colour supports but never replaces the icon and label.
 */
export default function JourneyRibbon({ route, activeIdx = -1, doneBefore = -1, size, showNames = true }) {
  const simple = useSimple();
  if (!route) return null;
  const total = route.legs.reduce((s, l) => s + l.minutes + (l.delayMin || 0), 0) || 1;
  const label = route.legs.map((l) => `${l.name}, ${l.minutes + (l.delayMin || 0)} minutes`).join(', then ');
  return (
    <div className={`ribbon ${size === 'lg' ? 'ribbon--lg' : ''}`} role="img" aria-label={`Journey: ${label}`}>
      {route.legs.map((leg, i) => {
        const mins = leg.minutes + (leg.delayMin || 0);
        return (
          <div key={`${leg.vehicleId}-${i}`} style={{ display: 'contents' }}>
            {i > 0 && <span className="ribbon__gap" aria-hidden="true" />}
            <div
              className={`ribbon__seg ${i === activeIdx ? 'is-active' : ''} ${i < doneBefore ? 'is-done' : ''}`}
              style={{ '--c': familyColor(leg.family), flexGrow: Math.max(mins / total, 0.18) }}
            >
              <Icon name={leg.icon} size={18} />
              {showNames && <span className="ribbon__label">{simple ? shortName(leg.name) : shortName(leg.name)}</span>}
              <span className="ribbon__min">{mins}m</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact vehicle name for tight spaces. */
export function shortName(name) {
  return name
    .replace(/^Autonomous /, '')
    .replace(/ Autonomous /, ' ')
    .replace('High-Speed Maglev Express', 'Maglev Express')
    .replace('eVTOL City-to-City Vehicle', 'eVTOL')
    .replace('Private Air Mobility Vehicle', 'Private Air')
    .replace('Smart-Road Vehicle', 'Smart-Road')
    .replace(' Mobility Vehicle', '')
    .replace(' Mobility Pod', ' Pod');
}
