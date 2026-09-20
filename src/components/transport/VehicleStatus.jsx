import { StatusBadge } from '../common/ui';

export default function VehicleStatus({ delayMin, status }) {
  if (status === 'cancelled') return <StatusBadge tone="bad">Cancelled</StatusBadge>;
  if (status === 'full') return <StatusBadge tone="warn">Full, next in 6 min</StatusBadge>;
  if (delayMin) return <StatusBadge tone="warn">{delayMin} min late</StatusBadge>;
  return <StatusBadge tone="ok">On time</StatusBadge>;
}
