import { useEffect, useState } from 'react';

const QUERY = '(max-width: 899px)';
const read = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;

/** True on phone-sized viewports (the project's mobile breakpoint is below 900px). */
export default function useIsMobile() {
  const [mobile, setMobile] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(QUERY);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}
