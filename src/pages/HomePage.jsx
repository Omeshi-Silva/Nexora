import { useMemo, useRef, useState } from 'react';
import Link from '../components/common/GoLink';
import useGo from '../hooks/useGo';
import { useApp } from '../context/AppContext';
import { useJourney, useLive } from '../context/JourneyContext';
import SearchPanel from '../components/home/SearchPanel';
import HeroScene from '../components/home/HeroScene';
import VehicleShowcase3D from '../components/home/VehicleShowcase3D';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import { VehicleThumb } from '../components/transport/ServiceArt';
import { shortName } from '../components/transport/JourneyRibbon';
import { planJourney } from '../services/routeEngine';
import { vehiclesIn, getVehicle } from '../data/vehicles';
import { PLACE_BY_ID } from '../data/places';
import { clock, duration } from '../utils/time';
import { money } from '../utils/format';

const PURPOSE_FOR = { hospital: 'hospital', airport: 'airport', school: 'school', work: 'work', gym: 'wellness', shopping: 'shopping', event: 'event' };

/**
 * PRIMARY PAGE 1: Home. Where are you going? NEXORA does the rest.
 * Order: brand and promise, destination, plan, city, recommended journey,
 * choose a vehicle, network status. Everything else waits behind "More".
 */
export default function HomePage() {
  const go = useGo();
  const { notify } = useApp();
  const { plan, needs, trip, previewRoute } = useJourney();
  const { live } = useLive();
  const [category, setCategory] = useState('ground');
  const [picks, setPicks] = useState({});
  const [chosen, setChosen] = useState(null);
  const planRef = useRef(null);
  const showcaseRef = useRef(null);

  const fleet = useMemo(() => vehiclesIn(category), [category]);
  const selectedId = picks[category] || fleet[0].id;
  const chosenVehicle = chosen ? getVehicle(chosen) : null;

  // The usual weekday trip, re-planned live with the traveller's needs.
  const usual = useMemo(() => planJourney({ fromId: 'home', toId: 'university', purpose: 'everyday', needs, whenMode: 'arrive', time: '09:00' }), [needs]);
  const rec = usual.routes.find((r) => r.id === usual.recommendedId) || usual.routes[0];
  const recommendedIds = rec ? rec.legs.map((l) => l.vehicleId) : [];

  const startPlanning = (query) => {
    const res = plan({ ...query });
    // A vehicle the traveller chose is honoured wherever the network can use it.
    if (chosen && res?.routes?.length) {
      const match = res.routes.find((r) => r.legs.some((l) => l.vehicleId === chosen));
      if (match) previewRoute(match.id);
      else notify({ type: 'journey', severity: 'info', title: `${getVehicle(chosen).name} does not fit this trip`, body: 'NEXORA chose the simplest way instead. You can still explore alternatives.' });
    }
    go('/journey');
  };

  const useRec = () => { plan({ fromId: 'home', toId: 'university', purpose: 'everyday', needs: [], whenMode: 'arrive', time: '09:00' }); go('/journey'); };
  const exploreVehicles = () => showcaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const chooseVehicle = (id) => {
    setChosen(id);
    notify({ type: 'journey', severity: 'success', title: `${getVehicle(id).name} chosen`, body: 'Tell NEXORA where you are going. It will use this vehicle wherever it fits.' });
    planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => planRef.current?.querySelector('input[role="combobox"]')?.focus({ preventScroll: true }), 450);
  };
  const changeCategory = (c) => { setCategory(c); };


  return (
    <div className="page container home">
      <section className="nx-hero" aria-labelledby="hero-title">
        <HeroScene />
        <div className="nx-hero__main">
          <p className="nx-eyebrow nx-hero__eyebrow">Nexora 2100</p>
          <h1 className="nx-hero__title" id="hero-title">Travel Beyond <em>Limits.</em></h1>
          <p className="nx-hero__lead">NEXORA connects autonomous ground transport, smart roads, rail and air mobility into one intelligent journey.</p>

          {trip && live && !live.done && (
            <Link to="/live" className="card card--live nx-live-strip">
              <span className="card-icon"><Icon name="map" size={22} /></span>
              <span className="grow"><strong>Journey in progress</strong><span className="small muted"> {live.plainHeadline}</span></span>
              <span className="badge badge--info">Arrive {clock(live.etaMs)}</span>
            </Link>
          )}
        </div>

        <div className="nx-hero__plan">
          <div ref={planRef}>
            {chosenVehicle && (
              <p className="nx-plan__prefs" style={{ marginBottom: 8 }} role="status">
                <span className="ok"><Icon name="check" size={14} />Your vehicle: <strong>{chosenVehicle.name}</strong></span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setChosen(null)}>Clear</button>
              </p>
            )}
            <SearchPanel compact initial={{ fromId: 'here' }} onPlan={startPlanning} onViewAll={() => go('panel:services')} />
          </div>
        </div>
      </section>

      <section className="nx-block nx-garage" ref={showcaseRef} aria-labelledby="fleet-title" style={{ scrollMarginTop: 80 }}>
        <h2 className="sr-only" id="fleet-title">Choose a vehicle from the future garage</h2>
        <VehicleShowcase3D
          category={category}
          vehicles={fleet}
          selectedVehicleId={selectedId}
          recommendedIds={recommendedIds}
          onSelectVehicle={(id) => setPicks((p) => ({ ...p, [category]: id }))}
          onChooseVehicle={chooseVehicle}
          onCategoryChange={changeCategory}
          onDetails={(id) => go(`panel:vehicle:${id}`)}
        />
        <p className="nx-garage__all"><Link to="panel:services">Explore all 20 vehicles<Icon name="next" size={16} /></Link></p>
      </section>

      {rec && (
        <section className="nx-block" aria-labelledby="rec-title">
          <div className="nx-block__head">
            <p className="nx-eyebrow">Recommended for you</p>
          </div>
          <div className="nx-rec">
            <h2 className="nx-rec__title" id="rec-title">Best way to arrive by 09:00 at {PLACE_BY_ID.university.label}</h2>
            <ol className="nx-rec__chain" aria-label="Vehicles on this journey">
              {rec.legs.map((l, i) => (
                <li key={`${l.vehicleId}-${i}`} style={{ display: 'contents' }}>
                  {i > 0 && <div className="arrow" style={{ display: 'grid', gridTemplateColumns: '88px 1fr' }} aria-hidden="true"><span><Icon name="arrowDown" size={16} /></span><span>{rec.transfers[i - 1] ? `${rec.transfers[i - 1].windowMin} min protected transfer` : 'Change'}</span></div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 12, alignItems: 'center' }}>
                    <VehicleThumb vehicleId={l.vehicleId} icon={l.icon} family={l.family} size={54} />
                    <span><strong>{shortName(l.name)}</strong><small>{l.minutes + (l.delayMin || 0)} min</small></span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="nx-rec__meta"><span><strong>{duration(rec.durationMin)}</strong></span><span>Arrive <strong>{clock(rec.arriveTime)}</strong></span><span>{money(rec.price)}</span></p>
            <div className="btn-row">
              <Button variant="primary" size="lg" icon="check" onClick={useRec}>Use this journey</Button>
              <Button onClick={exploreVehicles}>Explore vehicles</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
