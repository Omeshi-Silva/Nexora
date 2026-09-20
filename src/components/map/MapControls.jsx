import { useState } from 'react';
import Icon from '../common/Icon';

/** Floating map controls. Every control is a labelled button (no gesture-only actions). */
export default function MapControls({ zoom, onZoom, onLocate, following, threeD, onThreeD, onLayers, layersOpen, accessible, onAccessible, compact, minZoom = 1 }) {
  const [more, setMore] = useState(false);
  // Phones keep only zoom, follow and layers. 3D and the accessibility map live inside Layers.
  if (compact) {
    return (
      <div className="map-controls map-controls--compact" role="toolbar" aria-label="Map controls">
        <button type="button" className="map-ctl" onClick={() => onZoom(zoom + 0.4)} aria-label="Zoom in" disabled={zoom >= 3}><Icon name="plus" size={20} /></button>
        <button type="button" className="map-ctl" onClick={() => onZoom(zoom - 0.4)} aria-label="Zoom out" disabled={zoom <= minZoom}><Icon name="minus" size={20} /></button>
        <button type="button" className="map-ctl" onClick={onLocate} aria-pressed={following} aria-label="Follow my journey"><Icon name="locate" size={20} /></button>
        <button type="button" className="map-ctl" onClick={onLayers} aria-expanded={layersOpen} aria-label="Layers"><Icon name="layers" size={20} /></button>
      </div>
    );
  }
  return (
    <div className={`map-controls ${more ? 'is-open' : ''}`} role="toolbar" aria-label="Map controls">
      <button type="button" className="map-ctl" onClick={() => onZoom(zoom + 0.4)} aria-label="Zoom in" disabled={zoom >= 3}><Icon name="plus" size={22} /></button>
      <button type="button" className="map-ctl" onClick={() => onZoom(zoom - 0.4)} aria-label="Zoom out" disabled={zoom <= 1}><Icon name="minus" size={22} /></button>
      <button type="button" className="map-ctl" onClick={onLocate} aria-pressed={following} aria-label="Follow my journey"><Icon name="locate" size={22} /></button>
      <button type="button" className="map-ctl map-ctl--text map-ctl--extra" onClick={onThreeD} aria-pressed={threeD} aria-label={threeD ? 'Switch to 2D view' : 'Switch to 3D view'}>{threeD ? '3D' : '2D'}</button>
      <button type="button" className="map-ctl map-ctl--extra" onClick={onLayers} aria-expanded={layersOpen} aria-label="Map layers and filters"><Icon name="layers" size={22} /></button>
      <button type="button" className="map-ctl map-ctl--extra" onClick={onAccessible} aria-pressed={accessible} aria-label="Accessibility map"><Icon name="a11y" size={22} /></button>
      <button type="button" className="map-ctl" onClick={() => setMore((m) => !m)} aria-expanded={more} aria-label="More map options"><Icon name="sliders" size={22} /></button>
    </div>
  );
}
