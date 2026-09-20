/**
 * Small, top-down miniature vehicles for the Live map. Each of the 20 NEXORA vehicles maps to a
 * model that matches its real type: pods and cars on roads, vans and buses, multi-car trains,
 * capsules, and rotor or fixed-wing aircraft. Models face +x and are rotated to their heading.
 * Colour comes from --c (the category colour); fills live in livemap.css.
 */

const MODEL = {
  'city-pod': 'pod',
  'shared-pod': 'pod',
  'autonomous-taxi': 'car',
  'micro-shuttle': 'van',
  'regional-bus': 'bus',
  'smart-road-vehicle': 'car',
  'child-safe-vehicle': 'van',
  'step-free-vehicle': 'van',
  'corporate-shuttle': 'van',
  'luxury-vehicle': 'limo',
  metro: 'metro',
  'maglev-train': 'maglev',
  'maglev-express': 'express',
  'intercity-train': 'intercity',
  'vacuum-tube': 'capsule',
  'air-taxi': 'evtol',
  'passenger-drone': 'drone',
  'air-shuttle': 'shuttle',
  evtol: 'evtol',
  'private-air': 'jet',
};

export const modelFor = (vehicleId, family) => MODEL[vehicleId] || ({ ground: 'car', smart: 'car', rail: 'metro', air: 'evtol' }[family] || 'car');

/** Headlight beam, drawn ahead of road vehicles so they read as moving at night. */
const Beam = ({ x, w = 6, len = 12 }) => <path d={`M${x} ${-w / 2} L${x + len} ${-w} L${x + len} ${w} L${x} ${w / 2} Z`} className="mv-beam" />;

const Car = ({ l = 15, w = 7, roof = 0.5, lux }) => (
  <g>
    <Beam x={l / 2 - 1} w={w * 0.7} len={l * 0.8} />
    <rect x={-l / 2} y={-w / 2} width={l} height={w} rx={w * 0.42} className="mv-body" />
    <rect x={-l * 0.3} y={-w * 0.36} width={l * roof} height={w * 0.72} rx={w * 0.3} className="mv-glass" />
    <rect x={-l / 2} y={-w / 2} width={l} height={w} rx={w * 0.42} className="mv-sheen" />
    <rect x={-l * 0.42} y={-0.6} width={l * 0.84} height="1.2" rx="0.6" className="mv-accent" />
    <rect x={l / 2 - 1.8} y={-w / 2 + 0.9} width="1.4" height="1.3" rx="0.5" className="mv-lamp" />
    <rect x={l / 2 - 1.8} y={w / 2 - 2.2} width="1.4" height="1.3" rx="0.5" className="mv-lamp" />
    {lux && <rect x={-l * 0.5} y={-w / 2 + 0.4} width={l} height="0.7" className="mv-chrome" />}
  </g>
);

const Pod = () => (
  <g>
    <Beam x={5} w={4} len={9} />
    <rect x={-6} y={-4} width="12" height="8" rx="4" className="mv-body" />
    <ellipse cx="0" cy="0" rx="3.8" ry="2.9" className="mv-glass mv-glass--dome" />
    <rect x={-6} y={-4} width="12" height="8" rx="4" className="mv-sheen" />
    <rect x="-4.6" y="-0.55" width="9.2" height="1.1" rx="0.55" className="mv-accent" />
    <rect x="4.2" y="-2.6" width="1.2" height="1.1" rx="0.5" className="mv-lamp" />
    <rect x="4.2" y="1.5" width="1.2" height="1.1" rx="0.5" className="mv-lamp" />
  </g>
);

const Van = () => (
  <g>
    <Beam x={9} w={5} len={11} />
    <rect x={-9} y={-4} width="18" height="8" rx="2.4" className="mv-body" />
    <rect x={-6.6} y={-3} width="11.6" height="6" rx="1.6" className="mv-glass" />
    <rect x={-9} y={-4} width="18" height="8" rx="2.4" className="mv-sheen" />
    <rect x="-8" y="-0.55" width="15.5" height="1.1" rx="0.55" className="mv-accent" />
    <rect x="7.6" y="-3.2" width="1.3" height="1.2" rx="0.4" className="mv-lamp" />
    <rect x="7.6" y="2" width="1.3" height="1.2" rx="0.4" className="mv-lamp" />
  </g>
);

const Bus = () => (
  <g>
    <Beam x={12} w={5} len={12} />
    <rect x={-12} y={-4.4} width="24" height="8.8" rx="2.6" className="mv-body" />
    {[-9, -3, 3].map((x) => <rect key={x} x={x} y="-3.4" width="5.2" height="6.8" rx="1" className="mv-glass" />)}
    <rect x={-12} y={-4.4} width="24" height="8.8" rx="2.6" className="mv-sheen" />
    <rect x="-11" y="-0.55" width="20" height="1.1" rx="0.55" className="mv-accent" />
    <rect x="10.4" y="-3.6" width="1.3" height="1.2" rx="0.4" className="mv-lamp" />
    <rect x="10.4" y="2.4" width="1.3" height="1.2" rx="0.4" className="mv-lamp" />
  </g>
);

/** A train: n cars in a line, the lead car shaped by `nose`. */
const Train = ({ cars, len, w, nose = 'round', accent = true }) => {
  const total = cars * len + (cars - 1) * 0.9;
  const x0 = -total / 2;
  return (
    <g>
      {Array.from({ length: cars }, (_, i) => {
        const cx = x0 + i * (len + 0.9);
        const lead = i === cars - 1;
        const tail = i === 0;
        return (
          <g key={i}>
            {lead && nose === 'point' ? (
              <path d={`M${cx} ${-w / 2} H${cx + len - 2} Q${cx + len + 4} ${-w / 4} ${cx + len + 5} 0 Q${cx + len + 4} ${w / 4} ${cx + len - 2} ${w / 2} H${cx} Z`} className="mv-body" />
            ) : (
              <rect x={cx} y={-w / 2} width={len} height={w} rx={lead || tail ? 1.8 : 0.6} className="mv-body" />
            )}
            <rect x={cx + 1.4} y={-w * 0.2} width={len - 2.8} height={w * 0.4} rx="0.8" className="mv-glass" />
            <rect x={cx} y={-w / 2} width={len} height={w} rx="1" className="mv-sheen" />
          </g>
        );
      })}
      {accent && <rect x={x0 + 1} y="-0.5" width={total - 2} height="1" rx="0.5" className="mv-accent" />}
      <rect x={x0 + total - (nose === 'point' ? -3.8 : 1.6)} y={-w / 2 + 1} width="1.3" height="1.1" rx="0.4" className="mv-lamp" />
      <rect x={x0 + total - (nose === 'point' ? -3.8 : 1.6)} y={w / 2 - 2.1} width="1.3" height="1.1" rx="0.4" className="mv-lamp" />
    </g>
  );
};

const Capsule = () => (
  <g>
    <path d="M-15 0 Q-15 -3.4 -10 -3.4 H10 Q17 -3.4 17 0 Q17 3.4 10 3.4 H-10 Q-15 3.4 -15 0 Z" className="mv-body mv-body--capsule" />
    <rect x="-9" y="-2" width="20" height="4" rx="2" className="mv-glass" />
    <rect x="-13" y="-0.5" width="28" height="1" rx="0.5" className="mv-accent" />
    <path d="M-15 0 Q-15 -3.4 -10 -3.4 H10 Q17 -3.4 17 0 Q17 3.4 10 3.4 H-10 Q-15 3.4 -15 0 Z" className="mv-sheen" />
  </g>
);

const Rotor = ({ x, y, r = 3.6 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} className="mv-rotor" />
    <line x1={-r} y1="0" x2={r} y2="0" className="mv-blade" />
    <circle r="0.9" className="mv-hub" />
  </g>
);

const Evtol = () => (
  <g>
    <line x1="-5" y1="-5.4" x2="5" y2="5.4" className="mv-arm" />
    <line x1="-5" y1="5.4" x2="5" y2="-5.4" className="mv-arm" />
    <Rotor x={-5} y={-5.4} /><Rotor x={-5} y={5.4} /><Rotor x={5} y={-5.4} /><Rotor x={5} y={5.4} />
    <rect x="-6.5" y="-2.7" width="13" height="5.4" rx="2.7" className="mv-body" />
    <path d="M1.4 -2 Q5.6 -1.8 6 0 Q5.6 1.8 1.4 2 Z" className="mv-glass" />
    <rect x="-6.5" y="-2.7" width="13" height="5.4" rx="2.7" className="mv-sheen" />
    <rect x="-5" y="-0.45" width="7" height="0.9" rx="0.45" className="mv-accent" />
  </g>
);

const Drone = () => (
  <g>
    <line x1="-4" y1="-4" x2="4" y2="4" className="mv-arm" />
    <line x1="-4" y1="4" x2="4" y2="-4" className="mv-arm" />
    <Rotor x={-4} y={-4} r={3} /><Rotor x={-4} y={4} r={3} /><Rotor x={4} y={-4} r={3} /><Rotor x={4} y={4} r={3} />
    <rect x="-3.6" y="-2.4" width="7.2" height="4.8" rx="2.2" className="mv-body" />
    <ellipse cx="1" cy="0" rx="1.7" ry="1.4" className="mv-glass" />
    <rect x="-3.6" y="-2.4" width="7.2" height="4.8" rx="2.2" className="mv-sheen" />
  </g>
);

const Shuttle = () => (
  <g>
    <path d="M-3 -1.6 L-6 -13 L-1.6 -13 L4 -1.6 Z" className="mv-wing" />
    <path d="M-3 1.6 L-6 13 L-1.6 13 L4 1.6 Z" className="mv-wing" />
    <path d="M-12 0 L-14.5 -4.6 L-12.4 -4.6 L-9 -0.8 Z M-12 0 L-14.5 4.6 L-12.4 4.6 L-9 0.8 Z" className="mv-wing" />
    <Rotor x={-2} y={-9} r={2.6} /><Rotor x={-2} y={9} r={2.6} />
    <path d="M-13 0 Q-13 -2.6 -9 -2.6 H8 Q15 -2.4 15 0 Q15 2.4 8 2.6 H-9 Q-13 2.6 -13 0 Z" className="mv-body" />
    <path d="M6 -1.6 Q10.4 -1.4 11 0 Q10.4 1.4 6 1.6 Z" className="mv-glass" />
    <rect x="-9" y="-0.5" width="14" height="1" rx="0.5" className="mv-accent" />
    <path d="M-13 0 Q-13 -2.6 -9 -2.6 H8 Q15 -2.4 15 0 Q15 2.4 8 2.6 H-9 Q-13 2.6 -13 0 Z" className="mv-sheen" />
  </g>
);

const Jet = () => (
  <g>
    <path d="M2 -1.4 L-6 -12 L-3.4 -12 L7 -1.4 Z" className="mv-wing" />
    <path d="M2 1.4 L-6 12 L-3.4 12 L7 1.4 Z" className="mv-wing" />
    <path d="M-10 0 L-13 -4.4 L-11 -4.4 L-7 -0.8 Z M-10 0 L-13 4.4 L-11 4.4 L-7 0.8 Z" className="mv-wing" />
    <path d="M-12 0 Q-12 -2.2 -8 -2.2 H6 Q14 -1.4 16 0 Q14 1.4 6 2.2 H-8 Q-12 2.2 -12 0 Z" className="mv-body" />
    <path d="M6 -1.2 Q10 -1 11 0 Q10 1 6 1.2 Z" className="mv-glass" />
    <rect x="-8" y="-0.4" width="12" height="0.8" rx="0.4" className="mv-accent" />
    <path d="M-12 0 Q-12 -2.2 -8 -2.2 H6 Q14 -1.4 16 0 Q14 1.4 6 2.2 H-8 Q-12 2.2 -12 0 Z" className="mv-sheen" />
    <circle cx="-13" cy="0" r="1.6" className="mv-thrust" />
  </g>
);

const RENDER = {
  pod: <Pod />,
  car: <Car />,
  limo: <Car l={19} w={7.4} roof={0.42} lux />,
  van: <Van />,
  bus: <Bus />,
  metro: <Train cars={3} len={8.5} w={6.2} />,
  maglev: <Train cars={4} len={8.5} w={5.8} nose="point" />,
  express: <Train cars={5} len={8.2} w={5.4} nose="point" />,
  intercity: <Train cars={4} len={9} w={6.2} />,
  capsule: <Capsule />,
  evtol: <Evtol />,
  drone: <Drone />,
  shuttle: <Shuttle />,
  jet: <Jet />,
};

export default function Miniature({ vehicleId, family, angle = 0 }) {
  const model = modelFor(vehicleId, family);
  return (
    <g className={`mv mv--${model}`} transform={`rotate(${angle.toFixed(1)})`} aria-hidden="true">
      {RENDER[model]}
    </g>
  );
}
