import Icon from '../common/Icon';

const STEPS = [
  { icon: 'pin', title: 'Choose where', text: 'Type, tap or say where you want to go.' },
  { icon: 'hand', title: 'Tell us what you need', text: 'No stairs, more time, lots of bags, a quiet ride.' },
  { icon: 'route', title: 'NEXORA finds the best way', text: 'It checks every bus, train, pod and flight for you.' },
  { icon: 'swap', title: 'Compare and pick', text: 'See why each option is good, then choose one.' },
  { icon: 'map', title: 'Follow your trip', text: 'We tell you what to do next, every step of the way.' },
];

export default function HowItWorks() {
  return (
    <ol className="how-steps">
      {STEPS.map((s, i) => (
        <li key={s.title} className="how-step">
          <span className="how-step__num" aria-hidden="true">{i + 1}</span>
          <span className="card-icon"><Icon name={s.icon} size={22} /></span>
          <div>
            <h3 className="h3"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
            <p className="small muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
