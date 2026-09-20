/**
 * NEXORA line icon set (24 × 24, 1.8 stroke). Decorative by default (aria-hidden);
 * pass `label` when an icon carries meaning on its own.
 */
const C = (cx, cy, r) => ({ c: [cx, cy, r] });
const R = (x, y, w, h, rx = 2) => ({ r: [x, y, w, h, rx] });

const ICONS = {
  home: ['M3 11l9-7 9 7', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  search: [C(11, 11, 7), 'M20 20l-4-4'],
  mic: [R(9, 3, 6, 11, 3), 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
  map: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'],
  route: [C(6, 19, 2), C(18, 5, 2), 'M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7'],
  sparkles: ['M11 3l1.9 4.9L18 9.8l-5.1 1.9L11 17l-1.9-5.3L4 9.8l5.1-1.9z', 'M19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8z'],
  user: [C(12, 8, 4), 'M4 21a8 8 0 0 1 16 0'],
  bell: ['M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21a2 2 0 0 0 4 0'],
  a11y: [C(12, 4.5, 1.8), 'M5 8.5l7 1.5 7-1.5', 'M12 10v5l-3 6', 'M12 15l3 6'],
  back: ['M15 5l-7 7 7 7'],
  next: ['M9 5l7 7-7 7'],
  down: ['M5 9l7 7 7-7'],
  up: ['M5 15l7-7 7 7'],
  close: ['M6 6l12 12M18 6L6 18'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  clock: [C(12, 12, 9), 'M12 7v5l3 2'],
  calendar: [R(3, 5, 18, 16), 'M3 10h18M8 3v4M16 3v4'],
  pin: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', C(12, 10, 2.5)],
  locate: [C(12, 12, 4), 'M12 2v3M12 19v3M2 12h3M19 12h3'],
  swap: ['M7 4v16M3 8l4-4 4 4', 'M17 20V4M13 16l4 4 4-4'],
  alert: ['M12 3l10 18H2z', 'M12 10v5M12 18h.01'],
  info: [C(12, 12, 9), 'M12 11v6M12 7.5h.01'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M8.5 12l2.5 2.5 4.5-5'],
  heart: ['M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z'],
  star: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'],
  ticket: ['M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z', 'M14 6v12'],
  qr: ['M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z', 'M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2h2'],
  wallet: ['M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3 7l12-3v3', 'M16 13.5h.01'],
  card: [R(3, 5, 18, 14), 'M3 10h18M7 15h4'],
  leaf: ['M5 19c0-9 6-14 15-14 0 9-5 15-14 15', 'M5 19l8-8'],
  bolt: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  users: [C(9, 8, 3.5), 'M2 20a7 7 0 0 1 14 0', 'M16 4.5a3.5 3.5 0 0 1 0 7', 'M18 13.5a6.5 6.5 0 0 1 4 6.5'],
  luggage: [R(6, 7, 12, 13), 'M9 7V4h6v3M10 11v5M14 11v5'],
  wifiOff: ['M3 3l18 18', 'M8.5 16.5a5 5 0 0 1 7 0', 'M5 12.5a10 10 0 0 1 5-2.6', 'M19 12.5a10 10 0 0 0-3-2', 'M12 20h.01'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
  filter: ['M4 5h16l-6 8v5l-4 2v-7z'],
  sliders: ['M4 7h10M18 7h2M4 17h4M12 17h8', C(16, 7, 2), C(10, 17, 2)],
  send: ['M4 12l16-8-6 16-2.5-6.5z', 'M11.5 13.5L20 4'],
  volume: ['M4 9v6h4l5 4V5L8 9z', 'M16.5 8.5a5 5 0 0 1 0 7', 'M19 6a8.5 8.5 0 0 1 0 12'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', C(12, 12, 3)],
  text: ['M3 18L8 6l5 12M4.8 14h6.4', 'M15 18l3-7 3 7M15.8 16h4.4'],
  contrast: [C(12, 12, 9), 'M12 3v18', 'M12 7h5M12 11h6M12 15h5'],
  motion: ['M4 7h10M17 7h3M4 12h4M11 12h9M4 17h13M20 17h0'],
  hand: ['M8 13V5.5a1.5 1.5 0 0 1 3 0V12', 'M11 11V4.5a1.5 1.5 0 0 1 3 0V12', 'M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5l-1-3a1.5 1.5 0 0 1 2.7-1.2L8 15'],
  wheelchair: [C(11, 4, 1.8), 'M11 7v6h6l2 5', 'M11 10h5', 'M8 10.5A5.5 5.5 0 1 0 15 17'],
  stairs: ['M3 20h5v-5h5v-5h5V5h3'],
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  share: [C(18, 5, 2.5), C(6, 12, 2.5), C(18, 19, 2.5), 'M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4'],
  sos: [C(12, 12, 9), 'M12 7v6M12 16.5h.01'],
  gear: [C(12, 12, 3), 'M12 2v3M12 19v3M4.9 4.9L7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1'],
  briefcase: [R(3, 7, 18, 13), 'M9 7V5h6v2M3 13h18'],
  school: ['M2 9l10-5 10 5-10 5z', 'M6 11v5c3 2 9 2 12 0v-5', 'M22 9v6'],
  hospital: [R(4, 4, 16, 16, 3), 'M12 8v8M8 12h8'],
  plane: ['M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z'],
  building: ['M4 21V5l8-2v18M12 8h8v13', 'M2 21h20', 'M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2'],
  dumbbell: ['M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12'],
  bag: ['M5 8h14l-1 13H6z', 'M9 8V6a3 3 0 0 1 6 0v2'],
  utensils: ['M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10', 'M17 3c-2 1-3 4-3 7h3v11'],
  camera: [R(3, 7, 18, 13), 'M8 7l2-3h4l2 3', C(12, 13.5, 3.5)],
  sun: [C(12, 12, 4), 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5'],
  train: [R(6, 3, 12, 14, 4), 'M6 10h12', 'M9 20l-2 2M15 20l2 2', 'M9 14h.01M15 14h.01'],
  maglev: ['M3 17h13a5 5 0 0 0 5-5c0-3.5-7-6-13-6H3', 'M3 20h18', 'M8 9h5', 'M3 13h17'],
  bus: [R(4, 3, 16, 15, 3), 'M4 11h16', 'M7 18v2M17 18v2', 'M8 14.5h.01M16 14.5h.01'],
  pod: ['M5 16a7 7 0 0 1 14 0', 'M3 16h18', C(7.5, 19, 1.5), C(16.5, 19, 1.5), 'M9 11.5h6'],
  car: ['M5 11l2-5h10l2 5', R(3, 11, 18, 6), C(7.5, 18, 1.5), C(16.5, 18, 1.5)],
  drone: [C(5, 5, 2.5), C(19, 5, 2.5), 'M7 7l3 3M17 7l-3 3', R(9, 9, 6, 5, 1.5), 'M10 17l-1 3M14 17l1 3'],
  airtaxi: ['M2 6h8M14 6h8', 'M6 6v2M18 6v2', 'M5 11h14l-2 5H7z', 'M12 6v5', 'M9 19h6'],
  boat: ['M2 16l2 4h16l2-4z', 'M12 16V4l7 10h-7', 'M6 13h6'],
  sub: ['M3 13c0-3 4-5 9-5s9 2 9 5-4 5-9 5-9-2-9-5z', 'M10 8V5h4v3', 'M8 13h.01M12 13h.01M16 13h.01'],
  truck: [R(2, 6, 12, 10, 1), 'M14 10h4l3 3v3h-7', C(6, 18, 2), C(17, 18, 2)],
  box: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M4 7.5l8 4.5 8-4.5M12 12v9'],
  ambulance: [R(2, 7, 13, 10, 1), 'M15 10h4l3 3v4h-7', C(6.5, 18, 2), C(17.5, 18, 2), 'M8.5 9.5v5M6 12h5'],
  tube: ['M2 7h20M2 17h20', R(6, 10, 12, 4, 2), 'M4 12h1M19 12h1'],
  rover: ['M4 15h16l-2-6H6z', C(7, 18, 2), C(17, 18, 2), C(12, 18, 2), 'M13 9V5l3-1'],
  crown: ['M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z'],
  moon: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  refresh: ['M20 11a8 8 0 0 0-14.5-4.5L4 8', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.5 4.5L20 16', 'M20 20v-4h-4'],
  trash: ['M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  arrowUp: ['M12 19V5M6 11l6-6 6 6'],
  arrowDown: ['M12 5v14M6 13l6 6 6-6'],
  play: ['M7 4l13 8-13 8z'],
  pause: ['M7 4h3v16H7zM14 4h3v16h-3z'],
  skip: ['M5 4l10 8-10 8z', 'M19 4v16'],
  cube: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M12 12l8-4.5M12 12L4 7.5M12 12v9'],
  list: ['M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'],
  globe: [C(12, 12, 9), 'M3 12h18', 'M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18'],
  lock: [R(5, 11, 14, 10), 'M8 11V8a4 4 0 0 1 8 0v3'],
  signal: ['M4 20v-3M9 20v-7M14 20v-11M19 20V4'],
  tag: ['M3 12V4h8l10 10-8 8z', C(7.5, 8, 1.5)],
  thermo: ['M10 13V5a2 2 0 0 1 4 0v8a4 4 0 1 1-4 0z'],
  bulb: ['M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z'],
  captions: [R(3, 5, 18, 14), 'M10 10.5a2.5 2.5 0 1 0 0 3M17 10.5a2.5 2.5 0 1 0 0 3'],
  vibrate: [R(8, 4, 8, 16), 'M4 8v8M20 8v8'],
  elevator: [R(4, 3, 16, 18), 'M9 9l3-3 3 3M9 15l3 3 3-3'],
  walk: [C(13, 4, 1.8), 'M10 21l2-6 3 3v3', 'M8 12l2-4 3 1 2 4 3 1'],
  seat: ['M7 4v9h9l2 7', 'M7 13l-2 7', 'M11 13v7'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  save: ['M6 3h12v18l-6-4-6 4z'],
  flag: ['M5 21V4h11l-1.5 4L16 12H5'],
  target: [C(12, 12, 9), C(12, 12, 5), C(12, 12, 1)],
};

export default function Icon({ name, size = 20, label, className = '', strokeWidth = 1.8, style }) {
  const parts = ICONS[name] || ICONS.info;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {parts.map((p, i) => {
        if (typeof p === 'string') return <path key={i} d={p} />;
        if (p.c) return <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} />;
        return <rect key={i} x={p.r[0]} y={p.r[1]} width={p.r[2]} height={p.r[3]} rx={p.r[4]} />;
      })}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(ICONS);
