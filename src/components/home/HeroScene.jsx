import { useEffect, useMemo, useRef, useState } from 'react';
import { pointAt, pathLength, roadPath, toSvgPath } from '../../utils/geometry';
import { seeded } from '../../utils/format';
import { FAMILIES } from '../../data/vehicles';

// The hero journey: City Pod from Lotus to Central Hub, then Metro to Meridian University.
const LEGS = [
  { id: 'ground', color: FAMILIES.ground.color, pts: [[170, 560], [300, 560], [300, 470], [500, 470], [500, 360]] },
  { id: 'rail', color: FAMILIES.rail.color, pts: [[500, 360], [560, 250], [620, 150]] },
];
const ALL = [...LEGS[0].pts, ...LEGS[1].pts.slice(1)];
const TOTAL = pathLength(ALL);
const LEG_LEN = LEGS.map((l) => pathLength(l.pts));
const ROADS_H = [130, 250, 360, 470, 560];
const ROADS_V = [170, 300, 500, 640, 760, 880];
const HUBS = [[170, 560, 'GROUND'], [300, 470, 'SMART ROADS'], [500, 360, 'RAIL'], [880, 108, 'AIR']];
const AIR = 'M500 360 C 620 230, 760 90, 880 108';
const SMART = 'M300 470 L640 470 L640 250 L880 250';
const RAIL_PATH = 'M-200 360 L500 360 L955 372';
const clamp = (x) => Math.min(1, Math.max(0, x));

/**
 * Decorative 3D city behind the Home hero. As you scroll, the city tilts from a steep
 * perspective towards a flatter map view and the route draws itself. Reduced motion
 * shows a static, fully drawn scene. Purely decorative (aria-hidden).
 */
export default function HeroScene() {
  const [still] = useState(() => typeof document !== 'undefined' && (document.documentElement.dataset.motion === 'reduce' || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)));
  const rootRef = useRef(null);
  const legRefs = useRef([]);
  const haloRefs = useRef([]);
  const dotRef = useRef(null);

  const buildings = useMemo(() => {
    const out = [];
    ROADS_H.forEach((y, yi) => ROADS_V.forEach((x, xi) => {
      for (let k = 0; k < 3; k += 1) {
        const s = seeded(`h${yi}-${xi}-${k}`);
        out.push({ x: x + 16 + k * 30, y: y + 16 + (s > 0.5 ? 26 : 0), w: 18 + s * 14, h: 14 + s * 16, lit: s > 0.78 });
      }
    }));
    return out;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduced = document.documentElement.dataset.motion === 'reduce' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let intro = reduced ? 1 : 0;
    let frame = 0;
    const draw = (p) => {
      const progress = reduced ? 1 : Math.min(1, 0.38 * intro + p * 0.75);
      root.style.setProperty('--p', reduced ? '0.55' : String(p));
      let remaining = progress * TOTAL;
      LEGS.forEach((leg, i) => {
        const el = legRefs.current[i];
        if (!el) return;
        const f = clamp(remaining / LEG_LEN[i]);
        el.style.strokeDashoffset = String(1 - f);
        if (haloRefs.current[i]) haloRefs.current[i].style.strokeDashoffset = String(1 - f);
        remaining -= LEG_LEN[i];
      });
      const pt = pointAt(ALL, progress);
      dotRef.current?.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => draw(clamp(window.scrollY / Math.max(360, root.offsetHeight * 0.85))));
    };
    if (!reduced) {
      const start = performance.now();
      const tick = (t) => {
        intro = clamp((t - start) / 1100);
        draw(clamp(window.scrollY / Math.max(360, root.offsetHeight * 0.85)));
        if (intro < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    } else {
      draw(0);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div className="hero-scene" ref={rootRef} aria-hidden="true">
      <div className="hero-scene__plane">
        <svg className="hero-scene__layer hero-scene__ground" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
          <rect x="-200" y="-200" width="1400" height="1100" fill="#04101f" />
          <path d="M520 760 L540 650 Q640 596 760 612 Q880 626 940 590 Q990 560 1400 540 L1400 760 Z" fill="#05233a" />
          {ROADS_H.map((y) => <line key={`h${y}`} x1="-200" y1={y} x2="1200" y2={y} className="hs-road" />)}
          {ROADS_V.map((x) => <line key={`v${x}`} x1={x} y1="-200" x2={x} y2="900" className="hs-road" />)}
          <path d="M-200 360 L500 360 L955 372 L1200 380 M500 360 L560 250 L620 150 L660 -200" className="hs-rail" />
          <path d={SMART} className="hs-smart" />
          <path d={AIR} className="hs-air" />
        </svg>
        <svg className="hero-scene__layer hero-scene__route" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
          {LEGS.map((leg, i) => (
            <g key={leg.id}>
              <path d={toSvgPath(leg.pts)} pathLength="1" className="hs-halo" style={{ strokeDasharray: 1, strokeDashoffset: 1 }} ref={(el) => { haloRefs.current[i] = el; }} />
              <path d={toSvgPath(leg.pts)} pathLength="1" className="hs-line" stroke={leg.color} style={{ strokeDasharray: 1, strokeDashoffset: 1 }} ref={(el) => { legRefs.current[i] = el; }} />
            </g>
          ))}
          {!still && (
            <g>
              <circle r="7" className="hs-amb hs-amb--air"><animateMotion dur="9s" repeatCount="indefinite" path={AIR} /></circle>
              <circle r="6" className="hs-amb hs-amb--rail"><animateMotion dur="7s" repeatCount="indefinite" path={RAIL_PATH} /></circle>
              <circle r="6" className="hs-amb hs-amb--smart"><animateMotion dur="8s" repeatCount="indefinite" path={SMART} /></circle>
            </g>
          )}
          <g ref={dotRef} transform="translate(170 560)">
            <circle r="26" className="hs-pulse" />
            <circle r="11" className="hs-dot" />
          </g>
        </svg>
        <svg className="hero-scene__layer hero-scene__buildings" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
          {buildings.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" className={b.lit ? 'hs-bld hs-bld--lit' : 'hs-bld'} />)}
          {HUBS.map(([x, y, label]) => (
            <g key={label} transform={`translate(${x} ${y})`}>
              <rect x="-12" y="-12" width="24" height="24" rx="7" className="hs-hub" />
              <text y="42" textAnchor="middle" className="hs-label">{label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
