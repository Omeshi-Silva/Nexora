import Icon from '../common/Icon';
import { StatusBadge } from '../common/ui';
import { familyColor } from './JourneyRibbon';
import { clock } from '../../utils/time';
import { useSimple } from '../../context/AppContext';

/** Builds a flat list of timeline steps from a route (shared by Timeline view and map list mode). */
export function timelineSteps(route) {
  const steps = [];
  const first = route.legs[0];
  steps.push({ kind: 'start', time: first.departTime - (route.pickupMin || 2) * 60e3, title: `Leave ${route.fromName}`, place: first.fromPoint, text: first.onDemand ? `Your ${first.name} comes to you.` : `Walk to ${first.fromPoint}.`, plain: first.plainInstruction, icon: 'walk', access: 'Step-free pickup point' });
  route.legs.forEach((leg, i) => {
    steps.push({ kind: 'ride', legIdx: i, time: leg.departTime, title: leg.name, place: `${leg.fromPoint}, ${leg.fromName}`, text: `${leg.fleetId}. Boarding from ${clock(leg.boardTime)}. Ride ${leg.minutes} min to ${leg.toName}.`, plain: leg.plainInstruction, icon: leg.icon, family: leg.family, delay: leg.delayMin, delayReason: leg.delayReason, access: leg.access.stepFree ? 'Step-free boarding' : leg.access.wheelchair ? 'Wheelchair-friendly' : 'Ask for boarding help', next: `Get off at ${leg.toName}` });
    const tr = route.transfers[i];
    if (tr) {
      steps.push({ kind: 'transfer', time: leg.arriveTime, title: `Change at ${tr.hubName}`, place: `${tr.fromPoint} to ${tr.toPoint}`, text: `${tr.movementMin} min step-free walk. Next departure ${clock(tr.nextDepartTime)}.`, plain: tr.plainInstruction, icon: 'swap', status: tr.status, access: `${tr.elevators} lifts, moving walkway`, window: tr.windowMin });
    }
  });
  const last = route.legs[route.legs.length - 1];
  steps.push({ kind: 'end', time: route.arriveTime, title: `Arrive at ${route.toName}`, place: last.toPoint, text: 'You have arrived.', plain: `You are at ${route.toShort || route.toName}.`, icon: 'flag', access: 'Step-free exit' });
  return steps;
}

const TR_TONE = { safe: ['ok', 'Safe connection'], tight: ['warn', 'Tight connection'], 'at-risk': ['bad', 'At risk'], rebooked: ['info', 'Moved to next departure'] };

export default function JourneyTimeline({ route, currentIdx = -1 }) {
  const simple = useSimple();
  const steps = timelineSteps(route);
  return (
    <ol className="timeline">
      {steps.map((s, i) => (
        <li key={i} className={`tl-item ${s.kind === 'ride' ? 'tl-item--ride' : ''} ${i === currentIdx ? 'is-now' : ''}`} style={s.family ? { '--c': familyColor(s.family) } : undefined} aria-current={i === currentIdx ? 'step' : undefined}>
          <div className="tl-time">{clock(s.time)}{s.delay ? <small>+{s.delay} min</small> : null}</div>
          <div className="tl-rail"><span className="tl-dot"><Icon name={s.icon} size={13} strokeWidth={2.2} /></span></div>
          <div className="tl-body">
            <h3>{s.title}</h3>
            <p>{simple ? s.plain : s.text}</p>
            <div className="tl-tags">
              <span className="badge"><Icon name="pin" size={13} />{s.place}</span>
              {s.status && <StatusBadge tone={TR_TONE[s.status][0]}>{TR_TONE[s.status][1]}</StatusBadge>}
              {s.delay ? <StatusBadge tone="warn">{s.delay} min late</StatusBadge> : s.kind === 'ride' ? <StatusBadge tone="ok">On time</StatusBadge> : null}
              <span className="badge adv"><Icon name="a11y" size={13} />{s.access}</span>
            </div>
            {s.next && <p className="tiny faint" style={{ marginTop: 6 }}>Next: {s.next}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
