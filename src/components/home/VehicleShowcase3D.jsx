import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../common/Icon';
import { CATEGORIES, FAMILIES, vehiclesIn } from '../../data/vehicles';
import { vehicleImage } from '../../data/vehicleImages';
import { vehicleAccess } from '../../services/accessibilityService';
import { useApp } from '../../context/AppContext';
import { money } from '../../utils/format';

const WORLD_TAG = {
  ground: 'City streets and autonomous pods',
  smart: 'Intelligent roads, connected vehicles',
  rail: 'Maglev lines and mobility stations',
  air: 'Sky corridors and vertiports',
};
const WORLD_LINE = {
  ground: 'Autonomous city travel',
  smart: 'Connected intelligent mobility',
  rail: 'High-speed clean travel',
  air: 'Urban and regional flight',
};
const WORLD_NAME = { ground: 'Ground', smart: 'Smart Roads', rail: 'Rail', air: 'Air' };

/** A typical trip for this vehicle, from its published distance and speed ranges. No invented data. */
function typicalTrip(v) {
  if (!Array.isArray(v.distance) || !Array.isArray(v.speed)) return null;
  const km = Math.min(v.distance[1], Math.max(v.distance[0], 10));
  const kmh = (v.speed[0] + v.speed[1]) / 2;
  return { km, min: Math.max(1, Math.round((km / kmh) * 60)) };
}

function useStill() {
  const { prefs } = useApp();
  const [mq, setMq] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return undefined;
    const on = () => setMq(m.matches);
    m.addEventListener?.('change', on);
    return () => m.removeEventListener?.('change', on);
  }, []);
  return prefs.reducedMotion || mq;
}

/** A transparent cutout, sized by CSS. No frame, no background: the scene supplies the light. */
function Cutout({ item, main, reflect = false }) {
  const img = vehicleImage(item.id);
  if (!img) {
    return <span className="vs__img vs__img--icon" role={main && !reflect ? 'img' : undefined} aria-label={main && !reflect ? item.name : undefined}><Icon name={item.icon} size={main ? 96 : 48} strokeWidth={1.3} /></span>;
  }
  return (
    <img
      className={reflect ? 'vs__img vs__img--reflect' : 'vs__img'}
      src={img.sm}
      srcSet={`${img.sm} 640w, ${img.lg} 1200w`}
      sizes={main ? '(min-width: 900px) 760px, 92vw' : '(min-width: 900px) 360px, 52vw'}
      alt={main && !reflect ? `${item.name}, concept illustration` : ''}
      aria-hidden={reflect ? 'true' : undefined}
      loading={main && !reflect ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
    />
  );
}

/**
 * The NEXORA Future Garage: one large transparent vehicle floating above a lit platform,
 * its neighbours receding behind it, and the facts that matter beside it.
 * CSS-3D only. Everything is also reachable with plain buttons and the arrow keys.
 */
export default function VehicleShowcase3D({ category, vehicles, selectedVehicleId, recommendedIds = [], onSelectVehicle, onChooseVehicle, onCategoryChange, onDetails, chooseLabel = 'Choose this vehicle' }) {
  const still = useStill();
  const rootRef = useRef(null);
  const swipe = useRef(null);
  const idx = Math.max(0, vehicles.findIndex((v) => v.id === selectedVehicleId));
  const v = vehicles[idx] || vehicles[0];
  const cat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const [aimed, setAimed] = useState(null);

  const go = useCallback((delta) => {
    if (!vehicles.length) return;
    const next = vehicles[(idx + delta + vehicles.length) % vehicles.length];
    onSelectVehicle(next.id);
  }, [vehicles, idx, onSelectVehicle]);

  // Preload the neighbours' large images so the next swipe is instant.
  useEffect(() => {
    [-1, 1].forEach((d) => {
      const n = vehicles[(idx + d + vehicles.length) % vehicles.length];
      const src = n && vehicleImage(n.id)?.lg;
      if (src) { const im = new Image(); im.src = src; }
    });
  }, [idx, vehicles]);

  // A few relevant vehicles as thumbnails: a window around the selected one.
  const thumbs = useMemo(() => {
    const n = vehicles.length;
    const count = Math.min(5, n);
    const start = Math.min(Math.max(0, idx - Math.floor(count / 2)), n - count);
    return vehicles.slice(start, start + count);
  }, [vehicles, idx]);

  const worldPreview = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, vehiclesIn(c.id)[0]])), []);

  const onKeyDown = (e) => {
    if (e.target.closest?.('.vs__worlds') || e.target.closest?.('.vs__thumbs')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  };

  const onPointerDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
  };
  const onPointerMove = (e) => {
    if (still || e.pointerType !== 'mouse' || !rootRef.current) return;
    const r = rootRef.current.getBoundingClientRect();
    rootRef.current.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
    rootRef.current.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
  };
  const onPointerLeave = () => {
    rootRef.current?.style.setProperty('--px', '0');
    rootRef.current?.style.setProperty('--py', '0');
  };

  if (!v) return null;
  const trip = typicalTrip(v);
  const access = vehicleAccess(v);
  const perks = (v.accessibilityList || []).slice(0, 3);
  const recommended = recommendedIds.includes(v.id);

  return (
    <section
      ref={rootRef}
      className={`vs vs--${cat.id} ${still ? 'is-still' : ''}`}
      style={{ '--c': cat.color }}
      aria-roledescription="carousel"
      aria-label={`${cat.label} vehicles`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="vs__worlds" role="tablist" aria-label="Transport worlds">
        {CATEGORIES.map((c) => {
          const rep = worldPreview[c.id];
          const img = rep && vehicleImage(rep.id);
          return (
            <button key={c.id} type="button" role="tab" aria-selected={c.id === cat.id} className="vs__world" style={{ '--c': c.color }} onClick={() => onCategoryChange(c.id)}>
              {img ? <img src={img.sm} alt="" loading="lazy" decoding="async" draggable="false" /> : <Icon name={c.icon} size={28} />}
              <span className="vs__world-text">
                <strong>{WORLD_NAME[c.id] || FAMILIES[c.id].label}</strong>
                <small>{WORLD_LINE[c.id]}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="vs__scene">
        <div className="vs__sky" aria-hidden="true" />
        <svg className="vs__route" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-10 96 C 90 30, 160 118, 250 60 S 380 20, 410 44" />
        </svg>
        <div className="vs__grid" aria-hidden="true" />
        <p className="vs__worldtag"><Icon name={cat.icon} size={18} /><span><strong>{cat.label}</strong><small>{WORLD_TAG[cat.id]}</small></span></p>

        <div className="vs__stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null; }}>
          <div className="vs__floor" aria-hidden="true"><span className="vs__ring vs__ring--a" /><span className="vs__ring vs__ring--b" /><span className="vs__pool" /></div>
          {vehicles.map((item, i) => {
            const o = i - idx;
            if (Math.abs(o) > 2) return null;
            const main = o === 0;
            return main ? (
              <div key={item.id} className="vs__slide is-main" style={{ '--o': 0, '--a': 0 }} aria-roledescription="slide" aria-label={`${idx + 1} of ${vehicles.length}: ${item.name}`}>
                <span className="vs__shadow" aria-hidden="true" />
                <div className="vs__body"><Cutout item={item} main /></div>
                <div className="vs__mirror" aria-hidden="true"><Cutout item={item} main reflect /></div>
              </div>
            ) : (
              <button key={item.id} type="button" className="vs__slide" style={{ '--o': o, '--a': Math.abs(o) }} aria-label={`Show ${item.name}`} onClick={() => onSelectVehicle(item.id)}>
                <span className="vs__body"><Cutout item={item} main={false} /></span>
              </button>
            );
          })}
        </div>

        <button type="button" className="vs__nav vs__nav--prev" onClick={() => go(-1)} aria-label="Previous vehicle"><Icon name="back" size={24} /></button>
        <button type="button" className="vs__nav vs__nav--next" onClick={() => go(1)} aria-label="Next vehicle"><Icon name="next" size={24} /></button>

        <ul className="vs__thumbs" aria-label={`${cat.label} vehicles`}>
          {thumbs.map((t) => (
            <li key={t.id}>
              <button type="button" className={t.id === v.id ? 'is-on' : ''} aria-label={`Show ${t.name}`} aria-current={t.id === v.id ? 'true' : undefined} onClick={() => onSelectVehicle(t.id)} onFocus={() => setAimed(t.id)} onBlur={() => setAimed(null)}>
                {vehicleImage(t.id) ? <img src={vehicleImage(t.id).sm} alt="" loading="lazy" decoding="async" draggable="false" /> : <Icon name={t.icon} size={22} />}
                <span className="sr-only">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <span className="sr-only" aria-live="polite">{aimed ? '' : `${v.name}, ${idx + 1} of ${vehicles.length}`}</span>
      </div>

      <div className="vs__info">
        <div className="vs__head" aria-live="polite">
          {recommended && <p className="vs__rec"><Icon name="sparkles" size={14} />NEXORA recommends</p>}
          <h3 className="vs__name">{v.name}</h3>
          <p className="vs__purpose">{v.purpose}</p>
        </div>
        <dl className="vs__facts">
          <div><dt><Icon name="route" size={16} />Max speed</dt><dd>{v.speed?.[1]} <small>km/h</small></dd></div>
          <div><dt><Icon name="users" size={16} />Passengers</dt><dd>{v.passengers}</dd></div>
          <div><dt><Icon name="bolt" size={16} />Power</dt><dd className="vs__dd-sm">{v.power}</dd></div>
        </dl>
        <ul className="vs__perks" aria-label="Accessibility highlights">
          <li className="vs__perk vs__perk--score"><Icon name="a11y" size={14} />{access.score}% accessible{access.stepFree ? ', step-free' : ''}</li>
          {perks.map((p) => <li key={p} className="vs__perk"><Icon name="check" size={14} />{p}</li>)}
        </ul>
        <dl className="vs__trip">
          {trip && <div><dt><Icon name="clock" size={18} /></dt><dd><strong>{trip.min} min</strong><small>typical {trip.km} km trip</small></dd></div>}
          {v.price != null && <div><dt><Icon name="ticket" size={18} /></dt><dd><strong>{money(v.price)}</strong><small>fare from</small></dd></div>}
        </dl>
        <div className="vs__actions">
          <button type="button" className="btn btn--primary btn--lg vs__cta" onClick={() => onDetails(v.id)}><Icon name="info" /><span>View vehicle details</span></button>
        </div>
      </div>
    </section>
  );
}
