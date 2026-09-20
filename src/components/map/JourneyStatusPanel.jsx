import { useRef, useState } from 'react';
import Icon from '../common/Icon';
import Button from '../common/Button';
import { Progress, StatusBadge } from '../common/ui';
import JourneyRibbon, { familyColor } from '../transport/JourneyRibbon';
import RebookAlert from '../journey/RebookAlert';
import { payStartLabel } from '../booking/ConfirmTripModal';
import { vehicleImage } from '../../data/vehicleImages';
import { FAMILIES, PROBLEM } from '../../data/vehicles';
import { clock, duration } from '../../utils/time';
import useIsMobile from '../../hooks/useIsMobile';
import { journeyConfidence } from '../journey/JourneyCorridor';
import { useSimple, useApp } from '../../context/AppContext';

const SPEEDS = [{ v: 5, l: 'Slow' }, { v: 20, l: 'Demo' }, { v: 60, l: 'Fast' }];

/** What the traveller should do now, and what comes after, in plain words. */
function nextActions(live, route) {
  const leg = live.current;
  const after = live.nextLeg;
  const tr = live.upcomingTransfer;
  if (live.phase === 'arrived') return { now: 'You have arrived', then: null, cta: 'Finish' };
  if (live.phase === 'pickup') return { now: leg.onDemand ? `Your ${leg.name} is coming to you` : `Go to ${leg.fromPoint}`, then: `Board at ${leg.fromPoint}`, cta: 'Continue journey' };
  if (live.phase === 'transfer') return { now: `Go to ${tr?.toPoint || 'your next platform'}`, then: after ? `Board ${after.name}` : 'Arrive', cta: 'Go to platform' };
  const soon = live.minutesToNext <= 1;
  return {
    now: soon ? `Get ready to exit at ${live.nextStopName}` : 'Stay onboard',
    then: after ? `Exit at ${live.nextStopName}, then ${tr ? `walk ${tr.movementMin} min to ` : 'board '}${after.name}` : `Exit at ${route.toShort || route.toName}`,
    cta: 'Continue journey',
  };
}

/** Only the accessibility preferences that are switched on, as short reassurances. */
function a11yTags(prefs) {
  return [[prefs.stepFree, 'Step-free'], [prefs.wheelchair, 'Wheelchair access'], [prefs.extraTime, 'Extra boarding time'], [prefs.lessWalking, 'Less walking'], [prefs.quiet, 'Quiet journey'], [prefs.voiceGuidance, 'Voice guidance']].filter(([on]) => on).map(([, label]) => label);
}

/** Bottom sheet on mobile, side panel on desktop: the vehicle, the time, the next action. */
export default function JourneyStatusPanel({ live, route, trip, onContinue, onChangeRoute, onEmergency, onSpeed, onPause, onDisrupt, onStart, selected, suggested, pendingRebook, onSwitch, onKeep, onRebookDetails }) {
  const simple = useSimple();
  const { prefs, setA11yOpen } = useApp();
  const mobile = useIsMobile();
  // Phones: -1 peek (map first), 0 compact, 1 expanded, 2 full details. Short screens start in peek so the map keeps the space.
  // Desktop always shows everything (2).
  const [step, setStep] = useState(() => (typeof window !== 'undefined' && window.innerHeight <= 640 ? -1 : 0));
  const level = mobile ? step : 2;
  const open = level >= 1;
  const peek = level < 0;
  const drag = useRef(null);
  const tags = a11yTags(prefs);
  const tagLine = tags.length > 0 && <p className="sheet__tags"><Icon name="check" size={16} /><span>{tags.join(' · ')}</span></p>;
  // Tap cycles compact > expanded > full > compact. Swiping the handle up or down moves one level.
  const onTouchStart = (e) => { drag.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (drag.current == null) return;
    const dy = e.changedTouches[0].clientY - drag.current;
    drag.current = null;
    if (Math.abs(dy) < 24) return;
    e.preventDefault();
    setStep((v) => Math.max(-1, Math.min(2, v + (dy < 0 ? 1 : -1))));
  };
  const handle = (
    <button type="button" className="sheet__handle" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={() => setStep((v) => (v < 0 || v === 2 ? 0 : v + 1))} aria-expanded={!peek} aria-label={peek ? 'Show journey details' : level === 2 ? 'Collapse journey panel' : 'Show more in journey panel'}>
      <span aria-hidden="true" />
      <small className="sheet__handle-label">{level === 2 ? 'Less' : 'More'}</small>
    </button>
  );
  const sheetCls = `sheet ${open ? 'is-open' : ''} ${level === 2 ? 'is-full' : ''} ${peek ? 'is-peek' : ''}`;

  if (!live) {
    return (
      <section className={sheetCls} aria-label="Journey status">
        {handle}
        <div className="live-idle">
          <p className="nx-eyebrow">Live journey</p>
          <h2>{selected ? 'Ready when you are.' : suggested ? 'Route not selected yet.' : 'Tell NEXORA where you want to go.'}</h2>
          {selected ? (
            <>
              {mobile ? (
                <div className="live-idle__route">
                  <strong>{selected.fromName} → {selected.toShort}</strong>
                  <span>{duration(selected.durationMin)} · Arrive {clock(selected.arriveTime)}</span>
                </div>
              ) : <p className="muted">{selected.fromName} to {selected.toShort}. {duration(selected.durationMin)}, arrive {clock(selected.arriveTime)}.</p>}
              <JourneyRibbon route={selected} />
              {mobile && level >= 1 && <p className="sheet__conf"><Icon name="shield" size={16} /><span>Journey confidence {journeyConfidence(selected)}%</span></p>}
              {mobile && tagLine}
              <Button variant="primary" size="lg" onClick={onStart}>{payStartLabel(selected)}</Button>
              <Button variant={mobile ? 'ghost' : 'secondary'} to="/">Plan a different journey</Button>
            </>
          ) : suggested ? (
            <>
              <p className="muted">Select a route to continue.</p>
              <Button variant="primary" size="lg" to="/journey">View suggested route</Button>
            </>
          ) : <Button variant="primary" size="lg" to="/">Plan my journey</Button>}
        </div>
      </section>
    );
  }

  const leg = live.phase === 'transfer' && live.nextLeg ? live.nextLeg : live.current;
  const img = vehicleImage(leg.vehicleId);
  const tr = live.upcomingTransfer;
  const act = nextActions(live, route);
  const eyebrow = { pickup: 'GETTING READY', leg: 'ON YOUR WAY', transfer: 'CHANGING VEHICLE', arrived: 'ARRIVED' }[live.phase];
  const late = route.delayMin > 0;
  // Accent = the category of the current vehicle. A problem turns it red without changing the category label.
  const accent = pendingRebook ? PROBLEM.color : FAMILIES[leg.family].color;
  const currentIdx = live.phase === 'transfer' ? live.legIdx + 1 : live.legIdx;
  const remainingKm = route.legs.slice(live.legIdx).reduce((sum, l, i) => sum + (i === 0 && live.phase === 'leg' ? l.km * (1 - live.segProgress) : l.km), 0);
  return (
    <section className={`${sheetCls} ${pendingRebook ? 'has-issue' : ''}`} style={{ '--accent': accent, '--accent-ink': pendingRebook || leg.family === 'rail' ? '#fff' : '#02101c', '--accent-glow': pendingRebook ? PROBLEM.glow : FAMILIES[leg.family].glow }} aria-label="Journey status">
      {handle}
      <div className="live-card">
        {pendingRebook && <RebookAlert disruption={pendingRebook} onSwitch={onSwitch} onKeep={onKeep} onWhy={onRebookDetails} />}

        <div className="live-eyebrow">
          <span className="nx-eyebrow">{eyebrow}</span>
          <StatusBadge tone={live.stale ? 'warn' : late ? 'warn' : 'ok'}>{live.stale ? 'Last known' : late ? `${route.delayMin} min late` : 'On time'}</StatusBadge>
        </div>

        <div className="live-now" style={{ '--c': familyColor(leg.family) }}>
          <div className="live-now__media">
            {img ? <img src={img.sm} alt={`${leg.name}, concept illustration`} /> : <Icon name={leg.icon} size={40} strokeWidth={1.4} />}
          </div>
          <div>
            <p className="live-cat" style={{ '--c': FAMILIES[leg.family].color }}><span className="dot" aria-hidden="true" />{FAMILIES[leg.family].label.toUpperCase()}</p>
            <h2>{leg.name}</h2>
            <p aria-live="polite">{live.phase === 'arrived' ? `You are at ${route.toShort || route.toName}.` : simple ? live.plainHeadline : `${live.phase === 'transfer' ? 'Heading to' : 'Arriving at'} ${live.nextStopName}`}</p>
          </div>
        </div>

        <div className="live-eta">
          <b className="num">{live.phase === 'arrived' ? clock(route.arriveTime) : `${live.minutesToNext} min`}</b>
          <span>{live.phase === 'arrived' ? 'Arrived' : mobile ? `to ${live.nextStopName} · Arrive ${clock(live.etaMs)}` : `to next stop. Arrive ${clock(live.etaMs)}, ${duration(live.remainingMin)} left.`}</span>
        </div>

        <div className="live-next">
          <span className="nx-eyebrow">Next action</span>
          <strong>{act.now}</strong>
          {act.then && level >= 1 && <p>Then: {act.then}</p>}
        </div>

        {level >= 1 && <Progress value={live.progress * 100} label="Journey progress" />}
        {level >= 1 && <ol className="leg-steps" aria-label="Journey sections">
          {route.legs.map((l, i) => (
            <li key={`${l.vehicleId}-${i}`} className={i < currentIdx ? 'is-done' : i === currentIdx ? 'is-current' : 'is-next'} style={{ '--c': FAMILIES[l.family].color, '--g': FAMILIES[l.family].glow }}>
              <span className="dot" aria-hidden="true" />{FAMILIES[l.family].label.replace('Autonomous ', '').replace(' Mobility', '')}
              <span className="sr-only"> {i < currentIdx ? 'completed' : i === currentIdx ? 'current' : 'upcoming'}</span>
            </li>
          ))}
        </ol>}

        {mobile && level >= 1 && tr && live.phase !== 'arrived' && (
          <div className={`protected ${tr.status === 'safe' ? '' : 'is-warn'}`}>
            <Icon name="shield" size={22} />
            <div><strong>{tr.status === 'safe' ? 'TRANSFER PROTECTED' : 'TRANSFER TIGHT, WATCHING'}</strong><p>{tr.windowMin} min at {tr.hubName}. NEXORA is monitoring your connection.</p></div>
          </div>
        )}
        {mobile && level >= 1 && <p className="sheet__conf"><Icon name="shield" size={16} /><span>Journey confidence {journeyConfidence(route)}%</span></p>}
        {mobile && tagLine}

        {level >= 1 && !pendingRebook && !late && live.phase !== 'arrived' && <p className="calm"><Icon name="check" size={20} /><span><strong>You’re on track.</strong>No action required.</span></p>}

        <div className="live-actions">
          <Button variant="primary" size="lg" icon={live.phase === 'arrived' ? 'flag' : 'skip'} onClick={onContinue}>{act.cta}</Button>
        </div>

        {level >= 2 && (
          <div className="live-more">
            {!mobile && tr && live.phase !== 'arrived' && (
              <div className={`protected ${tr.status === 'safe' ? '' : 'is-warn'}`}>
                <Icon name="shield" size={22} />
                <div><strong>{tr.status === 'safe' ? 'TRANSFER PROTECTED' : 'TRANSFER TIGHT, WATCHING'}</strong><p>{tr.windowMin} min at {tr.hubName}. NEXORA is monitoring your connection.</p></div>
              </div>
            )}
            <dl className="vp-grid">
              <div><dt>Current location</dt><dd>{live.phase === 'transfer' ? tr?.hubName || live.nextStopName : live.nextStopName}</dd></div>
              <div><dt>Destination</dt><dd>{route.toShort || route.toName}</dd></div>
              <div><dt>Distance left</dt><dd>{Math.round(remainingKm * 10) / 10} km</dd></div>
              <div><dt>Route status</dt><dd>{pendingRebook ? 'Problem detected' : late ? 'Slightly delayed' : 'Normal'}</dd></div>
            </dl>
            <JourneyRibbon route={route} activeIdx={live.phase === 'leg' ? live.legIdx : -1} doneBefore={live.phase === 'transfer' ? live.legIdx + 1 : live.legIdx} />
            {prefs.captions && prefs.voiceGuidance && <p className="caption-bar" aria-hidden="true"><Icon name="captions" size={16} /> {live.plainHeadline}</p>}
            <div className="btn-row">
              <Button size="sm" onClick={onChangeRoute} icon="swap">Other ways</Button>
              <Button size="sm" onClick={() => setA11yOpen(true)} icon="a11y">Preferences</Button>
              <Button size="sm" variant="danger-outline" onClick={onEmergency} icon="sos">Help</Button>
            </div>
            <details className="more">
              <summary><Icon name="down" size={18} />Demo controls</summary>
              <div className="stack stack--sm">
                <div className="seg" role="group" aria-label="Simulation speed">
                  {SPEEDS.map((s) => <button key={s.v} type="button" aria-pressed={trip.speed === s.v} onClick={() => onSpeed(s.v)}>{s.l}</button>)}
                  <button type="button" aria-pressed={trip.paused} onClick={onPause}>{trip.paused ? 'Resume' : 'Pause'}</button>
                </div>
                <Button size="sm" variant="ai" icon="alert" onClick={onDisrupt} disabled={trip.rebooked}>Simulate a disruption</Button>
                <p className="tiny faint">Live data is simulated: 1 second on screen is {trip.speed} seconds of travel.</p>
              </div>
            </details>
          </div>
        )}
      </div>
    </section>
  );
}
