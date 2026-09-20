import { useJourney } from '../context/JourneyContext';

/** The route the Journey views describe: the active trip if one is running, otherwise the selected one. */
export default function useJourneyRoute() {
  const j = useJourney();
  const active = Boolean(j.trip && !j.trip.completed);
  return { route: active ? j.trip.route : j.selected, active, ...j };
}
