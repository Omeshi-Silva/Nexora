import { useState } from 'react';
import Icon from '../common/Icon';
import { StatusBadge } from '../common/ui';
import { familyColor } from './JourneyRibbon';
import { FAMILIES } from '../../data/vehicles';
import { vehicleImage } from '../../data/vehicleImages';

/**
 * Vehicle media: the photo when one exists, otherwise vector art.
 * Either way the card stays readable, and a failed image falls back automatically.
 */
export default function ServiceArt({ vehicle, live, size = 'card' }) {
  const img = vehicleImage(vehicle.id);
  const [failed, setFailed] = useState(false);
  const photo = img && !failed;
  const tone = !vehicle.standard ? 'concept' : live?.tone === 'warning' ? 'warn' : 'ok';
  return (
    <div className={`svc-art ${photo ? 'svc-art--photo' : ''} svc-art--${size}`} style={{ '--c': familyColor(vehicle.family) }}>
      {photo ? (
        <img
          className="svc-art__img"
          src={img.sm}
          srcSet={`${img.sm} 640w, ${img.lg} 1200w`}
          sizes={size === 'hero' ? '(min-width: 900px) 840px, 100vw' : '(min-width: 1000px) 380px, 300px'}
          alt={`${vehicle.name}, concept illustration`}
          loading={size === 'hero' ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <span className="svc-art__icon" aria-hidden="true"><Icon name={vehicle.icon} size={52} strokeWidth={1.4} /></span>
          <span className="svc-art__line" aria-hidden="true" />
        </>
      )}
      <span className="svc-art__chip"><Icon name={vehicle.icon} size={14} />{FAMILIES[vehicle.family]?.label}</span>
      {live !== false && <StatusBadge tone={tone}>{!vehicle.standard ? vehicle.status : live?.status || 'Available'}</StatusBadge>}
    </div>
  );
}

/** Small rounded thumbnail used in route sequences, the recommendation card and the map panel. */
export function VehicleThumb({ vehicleId, icon, family, size = 56 }) {
  const img = vehicleImage(vehicleId);
  const [failed, setFailed] = useState(false);
  return (
    <span className="v-thumb" style={{ '--c': familyColor(family), width: size * 1.6, height: size }} aria-hidden="true">
      {img && !failed ? <img src={img.sm} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <Icon name={icon} size={size * 0.45} />}
    </span>
  );
}
