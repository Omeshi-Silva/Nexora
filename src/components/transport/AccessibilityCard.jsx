import { Card, Meter, CheckList, StatusBadge } from '../common/ui';
import { accessTone } from './RouteOptionCard';

/** Accessibility matching: score, why it fits, and what to watch for. */
export default function AccessibilityCard({ route, needs = {} }) {
  const a = route.access;
  const active = Object.entries(needs).filter(([, v]) => v).map(([k]) => ({ stepFree: 'Step-free', wheelchair: 'Wheelchair', extraTime: 'Extra transfer time', assist: 'Boarding help', fewerChanges: 'Fewer changes', lessWalking: 'Less walking', quiet: 'Quiet', luggage: 'Luggage', budget: 'Low cost' }[k])).filter(Boolean);
  return (
    <Card variant={a.score >= 90 ? 'ok' : a.score < 62 ? 'warn' : undefined}>
      <div className="row row--top" style={{ gap: 16 }}>
        <Meter value={a.score} label="Accessibility match" />
        <div className="stack stack--sm grow">
          <p className="tiny faint">Accessibility match</p>
          <h3 className="h2">{a.score}%: {a.level}</h3>
          <div className="row row--wrap" style={{ gap: 6 }}>
            {active.length ? active.map((n) => <StatusBadge key={n} tone="info" icon="check">{n}</StatusBadge>) : <span className="small muted">No specific needs set. Add them from Home or the accessibility button.</span>}
          </div>
        </div>
      </div>
      {a.reasons.length > 0 && (<><hr className="divider" /><CheckList items={a.reasons} /></>)}
      {a.warnings.length > 0 && (<><hr className="divider" /><CheckList items={a.warnings} tone="warn" /></>)}
      <span className="sr-only">Match tone {accessTone(a.score)}</span>
    </Card>
  );
}
