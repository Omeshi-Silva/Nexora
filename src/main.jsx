import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CATEGORIES, PROBLEM } from './data/vehicles';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/map.css';
import './styles/motion.css';
import './styles/nexora.css';
import './styles/livemap.css';
import './styles/citymap.css';

// Category colours live in one place (data/vehicles.js); CSS reads them as variables.
[...CATEGORIES, PROBLEM].forEach((c) => {
  const st = document.documentElement.style;
  st.setProperty(`--nx-${c.id}`, c.color);
  st.setProperty(`--nx-${c.id}-2`, c.color2);
  st.setProperty(`--nx-${c.id}-glow`, c.glow);
});

if (typeof document !== 'undefined' && document.startViewTransition) document.documentElement.classList.add('vt');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
