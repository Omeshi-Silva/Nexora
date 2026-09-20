import { memo, useMemo } from 'react';
import { seeded } from '../../utils/format';

/**
 * The cinematic night-city base layer of the Live map.
 * Pure scenery: it draws in the same 1000 x 700 map space as the routes, hubs and vehicles,
 * so every coordinate, click target and route stays exactly where it was.
 * Depth comes from extruded buildings (front, side and roof faces), lit windows, water with
 * reflections, bridges and glowing hub structures. Nothing here is interactive.
 */

const ROADS_H = [130, 250, 360, 470, 592];
const ROADS_V = [170, 300, 500, 640, 760, 880];
// Extra streets outside the routed area so the city fills the whole view.
const BLOCKS_H = [-110, 10, ...ROADS_H, 710, 830];
const BLOCKS_V = [-90, 40, ...ROADS_V, 1010, 1140];
const BRIDGES_V = [170, 300, 500, 640, 760, 880];

const RIVER = 'M-400 640 Q0 630 520 650 Q640 596 760 612 Q880 626 940 590 Q990 560 1400 540 L1400 705 Q1100 725 800 712 Q500 740 -400 725 Z';
const BAY = 'M790 -240 L1500 -240 L1500 215 Q1300 235 1150 205 Q1040 185 960 212 Q840 228 800 160 Q780 100 790 -240 Z';

const PARKS = [[196, 270, 88, 70], [660, 270, 84, 60], [40, 500, 90, 70], [1030, 500, 90, 70]];
// [x, y, clear radius, tower height]. Buildings keep out of these zones; hub structures are drawn there.
const HUB_ZONES = [[500, 360, 84], [430, 130, 40], [955, 372, 52], [300, 470, 34], [188, 548, 26]];
// Districts get taller towers.
const TOWER_ZONES = [[560, 120, 120, 84], [770, 220, 110, 76], [500, 300, 130, 64], [300, 220, 100, 44]];

const riverTop = (x) => (x < 520 ? 640 : x < 760 ? 650 - (x - 520) * (38 / 240) : x < 940 ? 612 - (x - 760) * (22 / 180) : 590 - (x - 940) * (50 / 460));
const riverBottom = (x) => (x < 800 ? 725 : 725 - (x - 800) * (25 / 600));

const inWater = (cx, cy) => (cy > riverTop(cx) - 10 && cy < riverBottom(cx) + 10) || (cx > 805 && cy < 200);
const inPark = (cx, cy) => PARKS.some(([x, y, w, h]) => cx > x - 8 && cx < x + w + 8 && cy > y - 8 && cy < y + h + 8);
const inHub = (cx, cy) => HUB_ZONES.some(([x, y, r]) => Math.hypot(cx - x, cy - y) < r);

const towerBoost = (cx, cy) => TOWER_ZONES.reduce((m, [x, y, r, h]) => {
  const d = Math.hypot(cx - x, cy - y);
  return d < r ? Math.max(m, h * (1 - d / r / 1.6)) : m;
}, 0);

function makeCity() {
  const out = [];
  for (let yi = 0; yi < BLOCKS_H.length - 1; yi += 1) {
    for (let xi = 0; xi < BLOCKS_V.length - 1; xi += 1) {
      const x0 = BLOCKS_V[xi] + 14;
      const x1 = BLOCKS_V[xi + 1] - 14;
      const y0 = BLOCKS_H[yi] + 13;
      const y1 = BLOCKS_H[yi + 1] - 13;
      const cols = x1 - x0 > 150 ? 3 : 2;
      const rows = 2;
      const cw = (x1 - x0) / cols;
      const rh = (y1 - y0) / rows;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const key = `c${yi}-${xi}-${r}-${c}`;
          const s = seeded(key);
          const s2 = seeded(`${key}h`);
          const s3 = seeded(`${key}w`);
          const w = cw * (0.68 + s * 0.26);
          const d = rh * (0.66 + s3 * 0.28);
          const x = x0 + c * cw + (cw - w) / 2;
          const y = y0 + r * rh + (rh - d) / 2;
          const cx = x + w / 2;
          const cy = y + d / 2;
          if (inWater(cx, cy) || inPark(cx, cy) || inHub(cx, cy)) continue;
          const boost = towerBoost(cx, cy);
          const tall = s2 > 0.9;
          const h = 7 + s2 * s2 * 24 + (tall ? 14 : 0) + boost * (0.3 + s * 0.5);
          out.push({
            x, y, w, d, h, key,
            tone: Math.floor(s * 3) % 3,
            lit: h > 34 && s3 > 0.55,
            hue: s3 > 0.8 ? 'm' : 'c',
            crown: h > 56,
          });
        }
      }
    }
  }
  // Painter's order: farthest (smallest base y) first.
  return out.sort((a, b) => a.y + a.d - (b.y + b.d) || a.x - b.x);
}

const fx = (h) => -h * 0.1;

function Building({ b }) {
  const { x, y, w, d, h } = b;
  const ox = fx(h);
  const oy = -h;
  const top = `${x + ox},${y + oy} ${x + w + ox},${y + oy} ${x + w + ox},${y + d + oy} ${x + ox},${y + d + oy}`;
  const front = `${x + ox},${y + d + oy} ${x + w + ox},${y + d + oy} ${x + w},${y + d} ${x},${y + d}`;
  const side = `${x + w + ox},${y + oy} ${x + w + ox},${y + d + oy} ${x + w},${y + d} ${x + w},${y}`;
  return (
    <g className={`bld bld--t${b.tone}`}>
      <polygon points={side} className="bld__side" />
      <polygon points={front} className="bld__front" />
      {b.h > 22 && <polygon points={front} className={`bld__win bld__win--${b.hue}`} />}
      <polygon points={top} className="bld__top" />
      {b.crown && <polygon points={top} className={`bld__crown bld__crown--${b.hue}`} />}
      {b.lit && <line x1={x + ox} y1={y + d + oy} x2={x + w + ox} y2={y + d + oy} className={`bld__rim bld__rim--${b.hue}`} />}
    </g>
  );
}

function Pill({ x, y, title, sub, w, icon }) {
  const width = w || Math.max(title.length, (sub || '').length * 0.92) * 6.6 + (icon ? 44 : 22);
  const height = sub ? 34 : 24;
  return (
    <g className="scene-pill" transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width={width} height={height} rx="11" />
      {icon && (
        <g transform={`translate(8 ${height / 2 - 8})`} className="scene-pill__icon">
          <rect x="2" y="7" width="4" height="9" rx="0.6" /><rect x="7" y="1" width="5" height="15" rx="0.6" /><rect x="13" y="5" width="3" height="11" rx="0.6" />
        </g>
      )}
      <text x={icon ? 30 : 11} y={sub ? 15 : 16} className="scene-pill__title">{title}</text>
      {sub && <text x={icon ? 30 : 11} y="27" className="scene-pill__sub">{sub}</text>}
    </g>
  );
}

const Trees = ({ x, y, w, h, seed }) => {
  const items = [];
  for (let i = 0; i < 16; i += 1) {
    const s = seeded(`${seed}${i}`);
    const s2 = seeded(`${seed}${i}y`);
    items.push([x + 8 + s * (w - 16), y + 8 + s2 * (h - 16), 3 + s * 3.2]);
  }
  return (
    <g>
      <rect className="scene-park" x={x} y={y} width={w} height={h} rx="16" />
      {items.map(([tx, ty, r], i) => (
        <g key={i}>
          <ellipse cx={tx + 1.5} cy={ty + r * 0.9} rx={r * 1.1} ry={r * 0.5} className="scene-tree__shadow" />
          <circle cx={tx} cy={ty} r={r} className="scene-tree" />
          <circle cx={tx - r * 0.3} cy={ty - r * 0.35} r={r * 0.5} className="scene-tree__hi" />
        </g>
      ))}
    </g>
  );
};

/** Circular hub structures: central dome, skyport island, vertiport pad, rail canopy, smart hub. */
function HubStructures() {
  return (
    <g className="scene-hubs" aria-hidden="true">
      {/* Central Multi-Modal Hub: layered plaza with a glowing dome */}
      <g transform="translate(500 360)">
        <circle r="86" className="hub-glow hub-glow--cyan" />
        <circle r="66" className="hub-plaza" />
        <circle r="60" className="hub-ring hub-ring--cyan" />
        <circle r="50" className="hub-ring hub-ring--cyan hub-ring--dash" />
        <circle cx="0" cy="-2" r="38" className="hub-wall" />
        <rect x="-38" y="-16" width="76" height="14" className="hub-wall" />
        <ellipse cx="0" cy="-16" rx="38" ry="38" className="hub-roof" />
        <circle cx="0" cy="-18" r="28" className="hub-dome" />
        <ellipse cx="-9" cy="-28" rx="13" ry="7" className="hub-dome__hi" />
        <circle cx="0" cy="-18" r="28" className="hub-dome__rim" />
      </g>
      {/* Skyport island */}
      <g transform="translate(880 108)">
        <ellipse cx="0" cy="6" rx="86" ry="82" className="hub-shore" />
        <circle r="70" className="hub-plaza hub-plaza--air" />
        <circle r="62" className="hub-ring hub-ring--air" />
        <circle r="46" className="hub-ring hub-ring--air hub-ring--dash" />
        <circle r="26" className="hub-pad" />
        <circle r="16" className="hub-pad hub-pad--core" />
        <path d="M-6 -7 V7 M6 -7 V7 M-6 0 H6" className="hub-pad__h" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 54} cy={Math.sin((a * Math.PI) / 180) * 54} r="2.4" className="hub-lamp hub-lamp--air" />
        ))}
      </g>
      {/* North Vertiport */}
      <g transform="translate(430 130)">
        <circle r="34" className="hub-glow hub-glow--air" />
        <circle r="24" className="hub-plaza hub-plaza--air" />
        <circle r="19" className="hub-ring hub-ring--air" />
        <circle r="10" className="hub-pad hub-pad--core" />
      </g>
      {/* East Maglev Portal: covered station */}
      <g transform="translate(955 372)">
        <rect x="-44" y="-20" width="88" height="40" rx="18" className="hub-plaza hub-plaza--rail" />
        <rect x="-38" y="-24" width="76" height="26" rx="13" className="hub-wall hub-wall--rail" />
        <rect x="-38" y="-24" width="76" height="26" rx="13" className="hub-canopy" />
        <line x1="-26" y1="-11" x2="26" y2="-11" className="hub-canopy__ridge" />
      </g>
      {/* Smart Mobility Hub B */}
      <g transform="translate(300 470)">
        <circle r="30" className="hub-glow hub-glow--smart" />
        <circle r="20" className="hub-plaza hub-plaza--smart" />
        <circle r="15" className="hub-ring hub-ring--smart" />
      </g>
    </g>
  );
}

/** Layers 1, 2 and 4: the night city, water, roads, bridges and the elevated rail viaduct. */
export const MapBackground = memo(function MapBackground({ accessible, hideHere }) {
  const city = useMemo(makeCity, []);
  const rows = useMemo(() => {
    const out = [];
    for (let y = 640; y < 720; y += 11) out.push(y);
    return out;
  }, []);

  return (
    <g className="map-bg">
      <defs>
        <linearGradient id="sc-land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050b1d" />
          <stop offset="55%" stopColor="#071229" />
          <stop offset="100%" stopColor="#040a1a" />
        </linearGradient>
        <linearGradient id="sc-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3a52" />
          <stop offset="55%" stopColor="#06243a" />
          <stop offset="100%" stopColor="#031523" />
        </linearGradient>
        <radialGradient id="sc-glow-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,229,255,0.45)" />
          <stop offset="60%" stopColor="rgba(0,160,255,0.12)" />
          <stop offset="100%" stopColor="rgba(0,160,255,0)" />
        </radialGradient>
        <radialGradient id="sc-glow-air" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,175,255,0.5)" />
          <stop offset="100%" stopColor="rgba(0,175,255,0)" />
        </radialGradient>
        <radialGradient id="sc-glow-smart" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,230,0,0.4)" />
          <stop offset="100%" stopColor="rgba(255,230,0,0)" />
        </radialGradient>
        <radialGradient id="sc-dome" cx="42%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#d9fbff" />
          <stop offset="35%" stopColor="#3ad1ff" />
          <stop offset="100%" stopColor="#0a4fa8" />
        </radialGradient>
        <linearGradient id="sc-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2d5c" />
          <stop offset="100%" stopColor="#0a1330" />
        </linearGradient>
        <linearGradient id="sc-front1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16394f" />
          <stop offset="100%" stopColor="#08172a" />
        </linearGradient>
        <linearGradient id="sc-front2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b2358" />
          <stop offset="100%" stopColor="#0d0e2c" />
        </linearGradient>
        <linearGradient id="sc-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0c1738" />
          <stop offset="100%" stopColor="#050a1c" />
        </linearGradient>
        <linearGradient id="sc-shore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,229,255,0.5)" />
          <stop offset="100%" stopColor="rgba(0,229,255,0)" />
        </linearGradient>
        <pattern id="sc-win-c" width="5" height="6" patternUnits="userSpaceOnUse">
          <rect x="1" y="1.2" width="1.5" height="2" fill="#bfefff" opacity="0.9" />
          <rect x="3.2" y="4" width="1.3" height="1.6" fill="#ffd98a" opacity="0.6" />
        </pattern>
        <pattern id="sc-win-m" width="5" height="6" patternUnits="userSpaceOnUse">
          <rect x="1" y="1.2" width="1.5" height="2" fill="#f2c4ff" opacity="0.9" />
          <rect x="3.2" y="4" width="1.3" height="1.6" fill="#8fe8ff" opacity="0.6" />
        </pattern>
        <pattern id="sc-win-s" width="5" height="6" patternUnits="userSpaceOnUse">
          <rect x="1" y="2" width="1.3" height="1.8" fill="#9fdcff" opacity="0.5" />
        </pattern>
        <linearGradient id="mv-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id="sc-clip-river"><path d={RIVER} /></clipPath>
        <clipPath id="sc-clip-bay"><path d={BAY} /></clipPath>
      </defs>

      <rect x="-400" y="-300" width="1800" height="1300" fill="url(#sc-land)" />
      <circle cx="500" cy="360" r="330" fill="url(#sc-glow-cyan)" opacity="0.5" />

      {PARKS.map(([x, y, w, h], i) => <Trees key={i} x={x} y={y} w={w} h={h} seed={`p${i}`} />)}

      {/* streets: asphalt, kerb light and lane dashes */}
      <g className="scene-roads">
        {BLOCKS_H.map((y) => <line key={`h${y}`} className="map-road" x1="-400" y1={y} x2="1400" y2={y} />)}
        {BLOCKS_V.map((x) => <line key={`v${x}`} className="map-road" x1={x} y1="-300" x2={x} y2="1000" />)}
        {BLOCKS_H.map((y) => <line key={`hc${y}`} className="map-road-core" x1="-400" y1={y} x2="1400" y2={y} />)}
        {BLOCKS_V.map((x) => <line key={`vc${x}`} className="map-road-core" x1={x} y1="-300" x2={x} y2="1000" />)}
      </g>

      {/* water: harbour river and the Skyport bay, with reflections */}
      <g className="scene-water">
        <path d={RIVER} className="scene-water__body" />
        <path d={BAY} className="scene-water__body" />
        <g clipPath="url(#sc-clip-river)" className="scene-water__shimmer">
          {rows.map((y, i) => <line key={y} x1="-400" y1={y} x2="1400" y2={y + (i % 2 ? 3 : -2)} strokeDasharray={`${18 + i * 3} ${40 + i * 5}`} style={{ animationDelay: `${i * -1.3}s` }} />)}
        </g>
        <g clipPath="url(#sc-clip-bay)" className="scene-water__shimmer">
          {[-40, -10, 20, 50, 80, 110, 140, 170, 195].map((y, i) => <line key={y} x1="760" y1={y} x2="1400" y2={y + (i % 2 ? 3 : -2)} strokeDasharray={`${16 + i * 3} ${38 + i * 4}`} style={{ animationDelay: `${i * -1.1}s` }} />)}
        </g>
        <path d={RIVER} className="scene-water__edge" />
        <path d={BAY} className="scene-water__edge" />
      </g>

      {/* bridges: the streets that carry on over the water */}
      <g className="scene-bridges">
        {BRIDGES_V.map((x) => (
          <g key={x} clipPath="url(#sc-clip-river)">
            <line x1={x} y1="560" x2={x} y2="780" className="bridge__deck" />
            <line x1={x - 9} y1="560" x2={x - 9} y2="780" className="bridge__rail" />
            <line x1={x + 9} y1="560" x2={x + 9} y2="780" className="bridge__rail" />
            <line x1={x} y1="560" x2={x} y2="780" className="bridge__lane" />
          </g>
        ))}
        {[880].map((x) => (
          <g key={`bay${x}`} clipPath="url(#sc-clip-bay)">
            <line x1={x} y1="150" x2={x} y2="260" className="bridge__deck" />
            <line x1={x - 9} y1="150" x2={x - 9} y2="260" className="bridge__rail" />
            <line x1={x + 9} y1="150" x2={x + 9} y2="260" className="bridge__rail" />
            <line x1={x} y1="150" x2={x} y2="260" className="bridge__lane" />
          </g>
        ))}
        <g clipPath="url(#sc-clip-bay)">
          <line x1="780" y1="130" x2="890" y2="130" className="bridge__deck" />
          <line x1="780" y1="121" x2="890" y2="121" className="bridge__rail" />
          <line x1="780" y1="139" x2="890" y2="139" className="bridge__rail" />
          <line x1="780" y1="130" x2="890" y2="130" className="bridge__lane" />
        </g>
      </g>

      {/* elevated rail viaduct (purple) */}
      <path className="map-rail-shadow" d="M-400 366 L500 366 L955 378 L1400 386" />
      <path className="map-rail-shadow" d="M500 366 L560 256 L620 156 L660 -294" />
      <path className="map-rail" d="M-400 360 L500 360 L955 372 L1400 380" />
      <path className="map-rail" d="M500 360 L560 250 L620 150 L660 -300" />
      <path className="map-rail-ties" d="M-400 360 L500 360 L955 372 L1400 380" />

      <HubStructures />

      {/* the city: extruded towers in painter's order */}
      <g className="scene-city">
        {city.map((b) => <Building key={b.key} b={b} />)}
      </g>

      {/* district labels */}
      <g className="scene-labels">
        <Pill x="330" y="186" title="Old Town" icon />
        <Pill x="560" y="78" title="Meridian" sub="Business District" icon />
        <Pill x="690" y="176" title="Aurora District" sub="Innovation Zone" icon />
        <text className="map-label map-label--water" x="720" y="676">Aurora Harbour</text>
        <g className="map-edge" transform="translate(986 372)">
          <path d="M-10 -12 L4 0 L-10 12" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <text x="-18" y="30" textAnchor="end" className="map-label map-label--sm">To Kandara and Lagoon City</text>
        </g>
        {!hideHere && (
          <g className="scene-here" transform="translate(188 548)">
            <ellipse cx="0" cy="3" rx="22" ry="9" className="scene-here__ring scene-here__ring--outer" />
            <ellipse cx="0" cy="3" rx="13" ry="5.5" className="scene-here__ring" />
            <path d="M0 0 C-9 -12 -11 -17 -11 -21 A11 11 0 0 1 11 -21 C11 -17 9 -12 0 0 Z" className="scene-here__pin" />
            <circle cx="0" cy="-21" r="4.5" className="scene-here__dot" />
            <g transform="translate(20 -44)">
              <rect width="94" height="34" rx="11" className="scene-pill__bg scene-here__label" />
              <text x="11" y="15" className="scene-pill__title scene-here__title">You are here</text>
              <text x="11" y="27" className="scene-pill__sub">Lotus</text>
            </g>
          </g>
        )}
        {hideHere && <text className="map-label" x="92" y="610">Lotus</text>}
        {accessible && <text className="map-label map-label--sm" x="20" y="690">Accessibility map: step-free hubs and lifts shown</text>}
      </g>
    </g>
  );
});
