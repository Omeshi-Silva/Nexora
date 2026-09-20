import { Switch } from '../common/ui';
import { MAP_FILTERS, MapLegend } from './MapOverlays';

/**
 * Layers and transport filters, shown in a glass panel.
 * On phones (`network` given) it also holds the network filters, the legend and the 3D / accessibility-map
 * toggles that the desktop map shows permanently.
 */
export default function MapFilters({ layers, onLayer, offline, onOffline, network }) {
  return (
    <div className="map-layers card" role="dialog" aria-label="Map layers and filters">
      <h2 className="h3">{network ? 'Layers' : 'Map layers'}</h2>
      {network && (
        <>
          <div className="map-layers__chips" role="group" aria-label="Show on map">
            <button type="button" className="map-chip-btn" aria-pressed={network.journeyOnly} onClick={network.onJourney}>My journey</button>
            {MAP_FILTERS.map((f) => (
              <button key={f.id} type="button" className="map-chip-btn" style={f.color ? { '--c': f.color, '--g': f.glow } : undefined} aria-pressed={!network.journeyOnly && network.filter === f.id} onClick={() => network.onFilter(f.id)}>
                {f.color && <span className="dot" aria-hidden="true" />}{f.label}
              </button>
            ))}
          </div>
          <MapLegend />
        </>
      )}
      <div className="stack stack--sm" style={{ marginTop: 12 }}>
        <Switch checked={layers.traffic} onChange={(v) => onLayer('traffic', v)} label="Problems and incidents" icon="alert" />
        <Switch checked={layers.stations} onChange={(v) => onLayer('stations', v)} label="Stations and hubs" icon="building" />
        <Switch checked={layers.air} onChange={(v) => onLayer('air', v)} label="Air corridors" icon="airtaxi" />
        {network && <Switch checked={network.threeD} onChange={network.onThreeD} label="3D view" icon="layers" />}
        {network && <Switch checked={network.accessible} onChange={network.onAccessible} label="Accessibility map" hint="Larger markers, step-free vehicles only" icon="a11y" />}
        <Switch checked={offline} onChange={onOffline} label="Test offline mode" hint="See what happens when live data drops" icon="wifiOff" />
      </div>
    </div>
  );
}
