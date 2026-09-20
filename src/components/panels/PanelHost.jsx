import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import ProfilePanel from './ProfilePanel';
import AlertsPanel from './AlertsPanel';
import ServicesPanel from './ServicesPanel';
import VehicleDetailPanel from './VehicleDetailPanel';
import CompletePanel from './CompletePanel';

/**
 * Secondary features live in panels over the three primary pages
 * (Home, Journey, Live) instead of separate routes.
 */
export default function PanelHost() {
  const { panel, closePanel } = useApp();
  if (!panel) return null;
  const { type, data } = panel;
  const PANELS = {
    profile: ['Profile', 'user', null, <ProfilePanel initialTab={data} />],
    alerts: ['Alerts', 'bell', null, <AlertsPanel />],
    services: ['Transport services', 'globe', null, <ServicesPanel />],
    vehicle: ['Vehicle details', 'info', null, <VehicleDetailPanel id={data} />],
    complete: ['Journey complete', 'flag', null, <CompletePanel />],
  };
  const entry = PANELS[type];
  if (!entry) return null;
  const [title, icon, tone, body] = entry;
  return (
    <Modal open onClose={closePanel} title={title} icon={icon} tone={tone} size="wide">
      {body}
    </Modal>
  );
}
