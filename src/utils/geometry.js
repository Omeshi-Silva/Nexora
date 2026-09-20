export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Total length of a polyline. */
export const pathLength = (pts) => pts.slice(1).reduce((sum, p, i) => sum + dist(pts[i], p), 0);

/** Point at fraction t (0–1) along a polyline, plus heading in degrees. */
export const pointAt = (pts, t) => {
  if (!pts || pts.length === 0) return { x: 0, y: 0, angle: 0 };
  if (pts.length === 1) return { x: pts[0][0], y: pts[0][1], angle: 0 };
  const total = pathLength(pts);
  let target = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = dist(pts[i - 1], pts[i]);
    if (target <= seg || i === pts.length - 1) {
      const f = seg === 0 ? 0 : Math.min(target / seg, 1);
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      return { x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f, angle: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI };
    }
    target -= seg;
  }
  const last = pts[pts.length - 1];
  return { x: last[0], y: last[1], angle: 0 };
};

/** Road-like path: follows the grid (horizontal then vertical, with a soft corner). */
export const roadPath = (a, b) => {
  const mid = [b[0], a[1]];
  return [a, mid, b];
};

/** Curved flight/water path approximated with points. */
export const arcPath = (a, b, bend = 0.22, steps = 14) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0];
    const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
    pts.push([x, y]);
  }
  return pts;
};

export const toSvgPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
