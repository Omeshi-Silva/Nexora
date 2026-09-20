import useGo from '../../hooks/useGo';
import Icon from './Icon';

export default function BackButton({ to, label = 'Back' }) {
  const go = useGo();
  return (
    <button type="button" className="icon-btn" onClick={() => go(to || -1)} aria-label={label}>
      <Icon name="back" size={22} />
    </button>
  );
}
