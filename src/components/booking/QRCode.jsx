import { useMemo } from 'react';
import { seeded } from '../../utils/format';

/** Decorative boarding code generated from the ticket id (prototype, not a scannable QR). */
export default function QRCode({ value, size = 168, label = 'Boarding code' }) {
  const cells = useMemo(() => {
    const n = 25;
    const out = [];
    const finder = (x, y) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (finder(x, y)) continue;
        if (seeded(`${value}-${x}-${y}`) > 0.52) out.push([x, y]);
      }
    }
    return out;
  }, [value]);
  const F = ({ x, y }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" fill="#050B1A" />
      <rect x="1" y="1" width="5" height="5" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" fill="#050B1A" />
    </g>
  );
  return (
    <svg viewBox="-2 -2 29 29" width={size} height={size} role="img" aria-label={`${label}: ${value}`} className="qr">
      <rect x="-2" y="-2" width="29" height="29" rx="2" fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#050B1A" />)}
      <F x={0} y={0} /><F x={18} y={0} /><F x={0} y={18} />
    </svg>
  );
}
