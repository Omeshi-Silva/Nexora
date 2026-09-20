import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { JourneyProvider } from './context/JourneyContext';
import AppLayout from './layouts/AppLayout';
import HomePage from './pages/HomePage';
import JourneyPage from './pages/JourneyPage';
import MapPage from './pages/MapPage';

/**
 * Exactly three primary pages: Home, Journey / Route Details and Live Map.
 * Everything else (profile, alerts, booking, services) opens as a panel.
 * HashRouter keeps deep links working on any static host.
 */
export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <JourneyProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="home" element={<Navigate to="/" replace />} />
              <Route path="journey" element={<JourneyPage />} />
              <Route path="live" element={<MapPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </JourneyProvider>
      </AppProvider>
    </HashRouter>
  );
}
