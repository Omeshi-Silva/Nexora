import { useEffect, useMemo, useRef, useState } from 'react';
import useGo from '../hooks/useGo';
import useIsMobile from '../hooks/useIsMobile';
import { useJourney, useLive } from '../context/JourneyContext';
import { useApp } from '../context/AppContext';
import { MapBackground, NetworkRoutes, SmartInfra, SmartLinks, StationMarker, RoutePath, VehicleMarker, IncidentMarker, IncidentPath, UserMarker, DestinationMarker, HUB_LIST, MAP_W, MAP_H, catOffset, hubKind } from '../components/map/LiveMap';
import MapControls from '../components/map/MapControls';
import MapFilters from '../components/map/MapFilters';
import { MapFilterBar, MapLegend, NetworkPill } from '../components/map/MapOverlays';
import IncidentPanel from '../components/map/IncidentPanel';
import VehicleInfoPanel from '../components/map/VehicleInfoPanel';
import JourneyStatusPanel from '../components/map/JourneyStatusPanel';
import SmartRebooking from '../components/ai/SmartRebooking';
import { ConfirmationModal } from '../components/common/Modal';
import ConfirmTripModal from '../components/booking/ConfirmTripModal';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import { ambientVehicles, networkHealth } from '../services/realtimeService';
import { activeIncidents, networkScore } from '../data/incidents';
import { VEHICLES, FAMILIES } from '../data/vehicles';
import { point } from '../services/routeEngine';
import { clock, relative } from '../utils/time';

// Phones may zoom out below 1 so a whole journey fits a narrow portrait screen.
const MIN_ZOOM_MOBILE = 0.5;
const CAT_WORDS = { ground: 'ground autonomous', smart: 'smart roads smart-road', rail: 'rail train', air: 'air aircraft flying' };

function useTicker(ms) {
  const [t, setT] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setT(Date.now()), ms); return () => clearInterval(id); }, [ms]);
  return t;
}

export default function MapPage() {
  const navigate = useGo();
  const { prefs, notify } = useApp();
  const { trip, selected, chosen, skipAhead, setSpeed, togglePause, triggerDisruption, pendingRebook, resolveRebook, offline, setOffline, endTrip } = useJourney();
  const { live } = useLive();
  const now = useTicker(500);
  const route = trip?.route || null;
  const reduced = prefs.reducedMotion;
  const mobile = useIsMobile();

  const [zoom, setZoom] = useState(1.15);
  const [center, setCenter] = useState([500, 360]);
  const [follow, setFollow] = useState(true);
  const [threeD, setThreeD] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [layers, setLayers] = useState({ traffic: true, stations: true, air: true });
  const [filter, setFilter] = useState('all');
  // Phones show the full laser network by default; "My journey" in Layers narrows the map to just the traveller's route.
  const [showNetwork, setShowNetwork] = useState(true);
  const [query, setQuery] = useState('');
  const [pickedInc, setPickedInc] = useState(null);
  const [trackId, setTrackId] = useState(null);
  const [accessible, setAccessible] = useState(prefs.stepFree || prefs.wheelchair);
  const [picked, setPicked] = useState(null);
  const [rebookOpen, setRebookOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Arrival: take the traveller to the completion screen.
  useEffect(() => {
    if (live?.done && !live.stale) {
      const id = setTimeout(() => navigate('panel:complete'), 1400);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [live?.done, live?.stale, navigate]);

  // Problems come and go over time; vehicles on an affected route keep their colour and gain a red ring.
  const bucket = Math.floor(now / 5000);
  const incidents = useMemo(() => activeIncidents(bucket * 5000), [bucket]);
  const fleet = useMemo(() => ambientVehicles(now).filter((v) => !(accessible && v.concept)).map((v) => {
    const inc = incidents.find((i) => i.loops.includes(v.loop));
    return { ...v, issue: Boolean(inc) || /delay/i.test(v.status), status: inc ? `Delayed +${inc.delayMin} min` : v.status };
  }), [now, accessible, incidents]);
  const journeyOnly = mobile && !showNetwork && filter === 'all' && !query.trim();
  const ambient = useMemo(() => (filter === 'problems' || journeyOnly ? [] : filter === 'all' ? fleet : fleet.filter((v) => v.filter === filter)), [fleet, filter, journeyOnly]);

  // Search: vehicles, vehicle types, stations and categories. Matches glow, everything else dims.
  const q = query.trim().toLowerCase();
  const hay = (v) => `${v.name} ${v.fleetId} ${FAMILIES[v.family].label} ${CAT_WORDS[v.family]} ${v.nextStop} ${v.destination}`.toLowerCase();
  const isMatch = (v) => Boolean(q) && hay(v).includes(q);
  const suggestions = useMemo(() => {
    if (!q) return [];
    const out = [];
    Object.entries(CAT_WORDS).forEach(([id, w]) => { if (w.split(' ').some((x) => x.startsWith(q))) out.push({ kind: 'category', id, label: FAMILIES[id].label, sub: 'Show this network only', color: FAMILIES[id].color }); });
    VEHICLES.filter((x) => `${x.name} ${FAMILIES[x.family].label}`.toLowerCase().includes(q)).slice(0, 5).forEach((x) => out.push({ kind: 'type', id: x.id, label: x.name, sub: FAMILIES[x.family].label, color: FAMILIES[x.family].color }));
    HUB_LIST.filter((hb) => `${hb.name} ${hb.short}`.toLowerCase().includes(q)).slice(0, 3).forEach((hb) => out.push({ kind: 'hub', id: hb.id, label: hb.name, sub: `${FAMILIES[hubKind(hb)].label} hub`, color: FAMILIES[hubKind(hb)].color, hub: hb }));
    return out.slice(0, 7);
  }, [q]);

  const mine = useMemo(() => {
    if (!live || !route) return null;
    const leg = live.phase === 'transfer' ? live.nextLeg : live.current;
    const remainingKm = route.legs.slice(live.legIdx).reduce((s, l, i) => s + (i === 0 && live.phase === 'leg' ? l.km * (1 - live.segProgress) : l.km), 0);
    return {
      id: 'mine', mine: true, vehicleId: leg.vehicleId, name: leg.name, fleetId: leg.fleetId, icon: leg.icon, family: leg.family,
      x: live.pos.x, y: live.pos.y, angle: live.pos.angle, speedKmh: live.speedKmh, nextStop: live.nextStopName, etaMin: live.minutesToNext,
      occupancy: live.occupancy, energy: live.energy, status: route.delayMin ? `Delayed ${route.delayMin} min` : 'On time',
      distanceKm: Math.round(remainingKm * 10) / 10,
      destination: route.toShort || route.toName, currentLocation: live.nextStopName, progress: live.progress, loop: null,
    };
  }, [live, route]);

  // The viewBox follows the real aspect ratio of the map area, so portrait phones get a
  // tall, centred view instead of a cropped landscape one.
  const stageRef = useRef(null);
  const [aspect, setAspect] = useState(MAP_W / MAP_H);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setAspect(width / height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // On phones the selected journey is previewed on the map before it starts, so the screen is never an empty network.
  const viewRoute = route || (mobile ? selected : null);
  const fit = useMemo(() => {
    if (!mobile || live || !viewRoute?.legs?.length) return null;
    const pts = viewRoute.legs.flatMap((l) => l.path || []);
    if (!pts.length) return null;
    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const hNeed = Math.max((maxY - minY) * 2, ((maxX - minX) * 1.3) / aspect, 160);
    const zoomFit = Math.min(3, Math.max(MIN_ZOOM_MOBILE, (aspect < 1 ? 620 : MAP_H) / hNeed));
    // Shifted so the route sits above the journey sheet and clear of the map controls.
    return { center: [(minX + maxX) / 2 + (aspect < 1 ? 0.06 * aspect * (620 / zoomFit) : 0), (minY + maxY) / 2 + (aspect < 1 ? 0.2 * (620 / zoomFit) : 0)], zoom: zoomFit };
  }, [mobile, live, viewRoute, aspect]);
  const fitActive = Boolean(fit) && follow && !trackId;
  const zoomEff = fitActive ? fit.zoom : zoom;
  const tracked = trackId ? fleet.find((v) => v.id === trackId) : null;
  const focusPt = tracked ? [tracked.x + catOffset(tracked.family)[0], tracked.y + catOffset(tracked.family)[1]] : mine ? [mine.x, mine.y] : null;
  const viewCenter = fitActive ? fit.center : follow && focusPt ? [focusPt[0], focusPt[1] + (aspect < 1 ? 165 / zoomEff : 0)] : center;
  const h = (aspect < 1 ? 620 : MAP_H) / zoomEff;
  const w = h * aspect;
  const vx = fitActive ? viewCenter[0] - w / 2 : w >= MAP_W + 240 ? (MAP_W - w) / 2 : Math.min(Math.max(viewCenter[0] - w / 2, -300), MAP_W + 300 - w);
  const vy = fitActive ? viewCenter[1] - h / 2 : h >= MAP_H + 160 ? (MAP_H - h) / 2 : Math.min(Math.max(viewCenter[1] - h / 2, -260), MAP_H + 260 + (aspect < 1 ? 260 : 0) - h);
  const markerScale = Math.max(0.55, 1 / zoomEff ** 0.55) * (accessible ? 1.25 : 1) * (aspect < 1 ? 0.9 : 1);

  // Drag to pan (optional: every action also has a button).
  // Works with mouse, one-finger drag (even starting on a marker) and two-finger pinch.
  const drag = useRef(null);
  const svgRef = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const moved = useRef(false);
  const minZ = mobile ? MIN_ZOOM_MOBILE : 1;
  const clampZ = (z) => Math.min(3, Math.max(minZ, z));
  const dist = () => { const [a, b] = [...pointers.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const onDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) { drag.current = null; pinch.current = { d: dist(), z: zoomEff }; return; }
    drag.current = { x: e.clientX, y: e.clientY, c: [vx + w / 2, vy + h / 2], captured: false };
  };
  const onMove = (e) => {
    if (!svgRef.current || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      moved.current = true;
      if (fitActive) { setCenter(fit.center); }
      setFollow(false);
      setZoom(clampZ(pinch.current.z * (dist() / (pinch.current.d || 1))));
      return;
    }
    if (!drag.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const k = w / rect.width;
    const dx = (e.clientX - drag.current.x) * k;
    const dy = (e.clientY - drag.current.y) * k;
    if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 6) {
      moved.current = true;
      if (!drag.current.captured) { drag.current.captured = true; try { svgRef.current.setPointerCapture(e.pointerId); } catch { /* ignore */ } }
      setFollow(false); setTrackId(null);
      setCenter([drag.current.c[0] - dx, drag.current.c[1] - dy]);
    }
  };
  const onUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
    else if (pointers.current.size === 1) { const [p] = [...pointers.current.values()]; drag.current = { x: p.x, y: p.y, c: [vx + w / 2, vy + h / 2], captured: true }; }
  };
  // A drag that began on a marker must not also select it.
  const onClickCapture = (e) => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; } };
  const onWheel = (e) => { setFollow(false); if (fitActive) setCenter(fit.center); setZoom(clampZ(zoomEff * (e.deltaY < 0 ? 1.12 : 1 / 1.12))); };

  const dest = viewRoute ? point(viewRoute.toId) : null;
  const origin = viewRoute ? point(viewRoute.fromId) : null;
  const selectedVehicle = picked === 'mine' ? mine : fleet.find((a) => a.id === picked);
  const lod = zoomEff < 1.1 ? 'far' : zoomEff < 1.9 ? 'mid' : 'near';
  // Hubs that belong to my journey: start, end and every change.
  const journeyHubs = useMemo(() => new Set(viewRoute ? [viewRoute.fromId, viewRoute.toId, ...viewRoute.legs.flatMap((l) => [l.fromId, l.toId])] : []), [viewRoute]);

  // The traveller's own problem (a delayed vehicle) appears on the map as a red marker too.
  const journeyInc = useMemo(() => (pendingRebook && mine ? {
    id: 'inc-journey', mine: true, severity: pendingRebook.delayMin >= 10 ? 'critical' : 'medium', category: mine.family, kind: 'Delayed vehicle',
    title: `${pendingRebook.vehicleName} delayed`, location: 'Your journey', loops: [], delayMin: pendingRebook.delayMin, path: [], at: [mine.x + catOffset(mine.family)[0], mine.y + catOffset(mine.family)[1]],
    advice: pendingRebook.alternative ? 'NEXORA found another way. Review it and switch when you are ready.' : 'Your arrival time has been updated. NEXORA keeps watching for a faster route.',
  } : null), [pendingRebook, mine]);
  const shownIncidents = (layers.traffic && !journeyOnly ? incidents.filter((i) => filter === 'all' || filter === 'problems' || i.category === filter) : []).concat(journeyInc ? [journeyInc] : []);
  const health = networkScore(networkHealth(now), incidents.concat(journeyInc ? [journeyInc] : []));
  const issueLegIdx = pendingRebook && route ? Math.max(0, route.legs.findIndex((l) => l.name === pendingRebook.vehicleName)) : -1;
  const activeLegIdx = live ? (live.phase === 'transfer' ? live.legIdx + 1 : live.legIdx) : -1;
  const hubShown = (hub) => layers.stations && filter !== 'problems' && (journeyOnly ? journeyHubs.has(hub.id) : filter === 'all' || hubKind(hub) === filter);
  const selectVehicle = (v) => {
    setPicked(v.id); setPickedInc(null); setFollow(false); setTrackId(null);
    setCenter([v.x + catOffset(v.family)[0], v.y + catOffset(v.family)[1]]);
    setZoom((z) => Math.max(z, 1.8));
  };
  const selectIncident = (inc) => { setPickedInc(inc.id); setPicked(null); setFollow(false); setCenter(inc.at); setZoom((z) => Math.max(z, 1.6)); };
  const pickSuggestion = (s) => {
    if (s.kind === 'category') { setFilter(s.id); setQuery(''); return; }
    if (s.kind === 'hub') { setFollow(false); setCenter([s.hub.x, s.hub.y]); setZoom((z) => Math.max(z, 1.8)); return; }
    setQuery(s.label);
    const first = fleet.find((v) => v.vehicleId === s.id);
    if (first) selectVehicle(first);
  };
  const incidentSel = shownIncidents.find((i) => i.id === pickedInc);
  const incidentAffected = incidentSel ? (incidentSel.mine ? [mine?.name].filter(Boolean) : [...new Set(fleet.filter((v) => incidentSel.loops.includes(v.loop)).map((v) => v.name))]) : [];
  const focusLoop = selectedVehicle && !selectedVehicle.mine ? selectedVehicle.loop : null;

  const onContinue = () => {
    if (live?.done) { navigate('panel:complete'); return; }
    skipAhead();
  };
  const confirmSos = () => {
    setSosOpen(false);
    notify({ type: 'safety', severity: 'critical', title: 'Help is on the way', body: 'Your vehicle is stopping at the nearest safe point. A NEXORA support person is on the line.' });
  };

  const summary = viewRoute
    ? `Map of Aurora. Your journey from ${viewRoute.fromName} to ${viewRoute.toName}. ${live ? live.headline : ''} ${ambient.length} other vehicles shown.`
    : `Map of Aurora showing ${ambient.length} live vehicles, ${shownIncidents.length} problems and ${HUB_LIST.length} mobility hubs.`;

  return (
    <div className={`map-page ${mobile ? 'is-mobile' : ''} ${threeD ? "is-3d" : ""} ${(selectedVehicle || incidentSel) ? "has-panel" : ""}`}>
      <div className="map-stage" ref={stageRef}>
        {(
          <svg
            ref={svgRef}
            className="map-svg"
            viewBox={`${vx} ${vy} ${w} ${h}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={summary}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onClickCapture={onClickCapture}
            onWheel={onWheel}
            style={{ transition: reduced || drag.current ? 'none' : undefined }}
          >
            {/* Layers 1, 2 and 4: dark base map, roads, rail */}
            <MapBackground accessible={accessible} hideHere={Boolean(live)} />
            {/* Layers 3 and 5: category routes with particles, smart-road nodes, elevated air corridors */}
            <NetworkRoutes filter={filter === 'problems' || journeyOnly ? 'none' : filter} focusLoop={focusLoop} showAir={layers.air} />
            {!journeyOnly && (filter === 'all' || filter === 'smart') && <SmartInfra />}
            {/* Layer 8: the selected journey */}
            {pendingRebook?.alternative && <RoutePath route={pendingRebook.alternative} alt />}
            {viewRoute && <RoutePath route={viewRoute} progressLegIdx={live?.phase === 'transfer' ? live.legIdx + 1 : live?.legIdx ?? -1} activeLegIdx={activeLegIdx} issueLegIdx={issueLegIdx} />}
            {HUB_LIST.filter(hubShown).map((hub) => <StationMarker key={hub.id} hub={hub} scale={markerScale} accessible={accessible} dim={Boolean(q) && !`${hub.name} ${hub.short}`.toLowerCase().includes(q)} showLabel={zoomEff >= 1.15} onSelect={() => { setFollow(false); setCenter([hub.x, hub.y]); }} />)}
            {dest && <DestinationMarker x={dest.x} y={dest.y} label={viewRoute.toShort || viewRoute.toName} scale={markerScale} />}
            {/* Layer 6: vehicles */}
            {ambient.map((v) => <VehicleMarker key={v.id} v={v} scale={markerScale} lod={lod} selected={picked === v.id} dim={(Boolean(picked) && picked !== v.id) || (Boolean(q) && !isMatch(v))} match={isMatch(v)} issue={v.issue} onSelect={() => selectVehicle(v)} reduced={reduced} />)}
            {/* Layer 9: live indicators */}
            {!journeyOnly && (filter === 'all' || filter === 'smart') && <SmartLinks vehicles={ambient} selectedId={picked} />}
            {/* Layer 7: problems */}
            {shownIncidents.filter((i) => i.path.length > 1).map((i) => <IncidentPath key={i.id} inc={i} />)}
            {shownIncidents.map((i) => <IncidentMarker key={i.id} inc={i} scale={markerScale} selected={pickedInc === i.id} onSelect={selectIncident} />)}
            {((live && live.phase === 'pickup') || (!live && mobile)) && origin && <UserMarker x={origin.x} y={origin.y} scale={markerScale} />}
            {live && live.phase === 'transfer' && <UserMarker x={live.pos.x} y={live.pos.y} scale={markerScale} />}
            {mine && <VehicleMarker v={mine} mine scale={markerScale * 1.1} lod={lod} issue={Boolean(pendingRebook)} selected={picked === 'mine'} onSelect={() => { setPicked('mine'); setPickedInc(null); }} reduced={reduced} />}
          </svg>
        )}

        {live?.stale && (
          <div className="map-banner" role="alert">
            <Icon name="wifiOff" size={20} />
            <div>
              <strong>Live tracking temporarily unavailable.</strong>
              <p className="small">Showing last known vehicle location from {relative(live.at, now)}. Scheduled arrival {clock(live.etaMs)}. Your ticket works offline. Help: call 2100 from any vehicle.</p>
            </div>
            <button type="button" className="btn btn--sm" onClick={() => setOffline(false)}>Reconnect</button>
          </div>
        )}

        {(
          <>
            <MapFilterBar filter={filter} onFilter={setFilter} query={query} onQuery={setQuery} suggestions={suggestions} onPick={pickSuggestion} />
            <div className="map-hud"><NetworkPill score={health} count={shownIncidents.length} /><MapLegend /></div>
          </>
        )}

        {(
          <MapControls
            zoom={zoomEff}
            compact={mobile}
            minZoom={mobile ? MIN_ZOOM_MOBILE : 1}
            onZoom={(z) => { if (fitActive) { setCenter(fit.center); setFollow(false); } setZoom(Math.min(3, Math.max(mobile ? MIN_ZOOM_MOBILE : 1, z))); }}
            onLocate={() => { setTrackId(null); setFollow(true); }}
            following={follow}
            threeD={threeD}
            onThreeD={() => setThreeD((t) => !t)}
            onLayers={() => setLayersOpen((o) => !o)}
            layersOpen={layersOpen}
            accessible={accessible}
            onAccessible={() => setAccessible((a) => !a)}
          />
        )}
        {layersOpen && (
          <MapFilters
            layers={layers}
            onLayer={(k, v) => setLayers((l) => ({ ...l, [k]: v }))}
            offline={offline}
            onOffline={setOffline}
            network={mobile ? { journeyOnly, filter, onJourney: () => { setFilter('all'); setShowNetwork(false); }, onFilter: (id) => { setFilter(id); setShowNetwork(true); }, threeD, onThreeD: () => setThreeD((t) => !t), accessible, onAccessible: () => setAccessible((a) => !a) } : undefined}
          />
        )}
        {selectedVehicle && !incidentSel && <VehicleInfoPanel v={selectedVehicle} issue={selectedVehicle.issue} tracking={trackId === selectedVehicle.id} onClose={() => { setPicked(null); setTrackId(null); }} onTrack={(v) => { setTrackId(v.id); setFollow(true); }} />}
        {incidentSel && <IncidentPanel inc={incidentSel} affected={incidentAffected} onClose={() => setPickedInc(null)} onAlternative={() => { if (incidentSel.mine) setRebookOpen(true); else navigate('/journey?view=more&section=alternatives'); }} />}
      </div>

      <JourneyStatusPanel
        live={live}
        route={route}
        trip={trip}
        selected={chosen}
        suggested={selected}
        onStart={() => setConfirmOpen(true)}
        onContinue={onContinue}
        onChangeRoute={() => navigate('/journey?view=more&section=alternatives')}
        pendingRebook={pendingRebook}
        onSwitch={() => resolveRebook('switch')}
        onKeep={() => resolveRebook('keep')}
        onRebookDetails={() => setRebookOpen(true)}
        onEmergency={() => setSosOpen(true)}
        onSpeed={setSpeed}
        onPause={togglePause}
        onDisrupt={triggerDisruption}
      />

      <ConfirmTripModal route={chosen} open={confirmOpen && Boolean(chosen)} onClose={() => setConfirmOpen(false)} />

      <SmartRebooking
        disruption={pendingRebook}
        open={rebookOpen && Boolean(pendingRebook)}
        onClose={() => setRebookOpen(false)}
        onSwitch={() => { setRebookOpen(false); resolveRebook('switch'); }}
        onKeep={() => { setRebookOpen(false); resolveRebook('keep'); }}
      />

      <ConfirmationModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        onConfirm={confirmSos}
        title="Get help now?"
        icon="sos"
        tone="danger"
        confirmLabel="Yes, get help"
        confirmVariant="danger"
      >
        <div className="stack stack--sm">
          <p>Your vehicle will stop at the nearest safe point and a NEXORA support person will speak to you. You can talk or type.</p>
          <Button size="sm" onClick={() => { setSosOpen(false); endTrip('cancelled'); navigate('panel:profile:help'); }}>Open Help instead</Button>
        </div>
      </ConfirmationModal>
    </div>
  );
}
