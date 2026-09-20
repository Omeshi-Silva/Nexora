/**
 * Fictional city of Aurora (2100). Coordinates live in a 1000 × 700 map space.
 * Places with `farKm` are outside the city and are reached through the East Maglev Portal.
 */

export const HUBS = {
  'hub-central': { id: 'hub-central', name: 'Central Mobility Hub', short: 'Central Hub', x: 500, y: 360, movement: 4, points: { rail: 'Platform B-07', metro: 'Platform M-2', road: 'Bay 4', air: 'Skydeck 2' }, elevators: 6, stepFree: true },
  'hub-north': { id: 'hub-north', name: 'North Vertiport', short: 'North Vertiport', x: 430, y: 130, movement: 5, points: { air: 'Pad V-03', road: 'Drop-off Lane 1' }, elevators: 3, stepFree: true },
  'hub-east': { id: 'hub-east', name: 'East Maglev Portal', short: 'East Portal', x: 955, y: 372, movement: 4, points: { rail: 'Platform E-01', road: 'Arrivals Court' }, elevators: 4, stepFree: true },
  'hub-b': { id: 'hub-b', name: 'Smart Mobility Hub B', short: 'Hub B', x: 300, y: 470, movement: 3, points: { road: 'Bay B-2' }, elevators: 2, stepFree: true },
  'skyport': { id: 'skyport', name: 'Skyport International', short: 'Skyport', x: 880, y: 108, movement: 6, points: { air: 'Gate S-12', road: 'Departures Kerb' }, elevators: 12, stepFree: true },
};

export const PLACES = [
  { id: 'here', name: 'My location', label: 'Lotus Residences, Block C', type: 'here', icon: 'locate', x: 188, y: 548, aliases: ['current location', 'my location', 'here'] },
  { id: 'home', name: 'Home', label: 'Lotus Residences, Block C', type: 'home', icon: 'home', x: 170, y: 560, aliases: ['home', 'house'] },
  { id: 'work', name: 'Work', label: 'Aurora Business District, Tower 9', type: 'work', icon: 'briefcase', x: 760, y: 220, aliases: ['work', 'office', 'business district', 'aurora'] },
  { id: 'school', name: 'School', label: 'Greenfield Primary Academy', type: 'school', icon: 'school', x: 282, y: 392, aliases: ['school', 'greenfield'] },
  { id: 'university', name: 'University', label: 'Meridian University', type: 'university', icon: 'school', x: 620, y: 150, aliases: ['university', 'campus', 'meridian', 'uni'] },
  { id: 'hospital', name: 'Hospital', label: 'Serenity General Hospital', type: 'hospital', icon: 'hospital', x: 362, y: 250, aliases: ['hospital', 'serenity', 'clinic', 'doctor'] },
  { id: 'airport', name: 'Airport', label: 'Skyport International', type: 'airport', icon: 'plane', x: 880, y: 108, aliases: ['airport', 'skyport', 'flight'] },
  { id: 'station', name: 'Train Station', label: 'Central Mobility Hub', type: 'station', icon: 'train', x: 500, y: 360, aliases: ['train station', 'station', 'central hub', 'central'] },
  { id: 'restaurant', name: 'Restaurant', label: 'Saffron Orbit Restaurant', type: 'restaurant', icon: 'utensils', x: 560, y: 470, aliases: ['restaurant', 'saffron', 'dinner', 'lunch', 'food'] },
  { id: 'hotel', name: 'Hotel', label: 'Harbourview Grand Hotel', type: 'hotel', icon: 'building', x: 722, y: 520, aliases: ['hotel', 'harbourview'] },
  { id: 'gym', name: 'Gym', label: 'Pulse Wellness Centre', type: 'gym', icon: 'dumbbell', x: 232, y: 452, aliases: ['gym', 'pulse', 'wellness', 'fitness'] },
  { id: 'shopping', name: 'Shopping', label: 'Nova Galleria Mall', type: 'shopping', icon: 'bag', x: 424, y: 540, aliases: ['shopping', 'mall', 'galleria', 'shops'] },
  { id: 'event', name: 'Event', label: 'Horizon Arena', type: 'event', icon: 'calendar', x: 820, y: 402, aliases: ['event', 'arena', 'concert', 'horizon'] },
  { id: 'museum', name: 'Tourist spot', label: 'Heritage Museum of Flight', type: 'tourist', icon: 'camera', x: 660, y: 300, aliases: ['museum', 'tourist', 'heritage', 'sightseeing'] },
  { id: 'beach', name: 'Beach', label: 'Coral Bay Beach', type: 'tourist', icon: 'sun', x: 880, y: 630, aliases: ['beach', 'coral bay', 'sea'] },
  { id: 'resort', name: 'Resort', label: 'Lagoon Pearl Resort', type: 'tourist', icon: 'heart', x: 988, y: 470, farKm: 180, lastMile: 'air', terminal: 'Lagoon City Terminal', aliases: ['resort', 'lagoon', 'lagoon pearl', 'honeymoon'] },
  { id: 'highlands', name: 'Kandara', label: 'Kandara Business District', type: 'work', icon: 'building', x: 988, y: 300, farKm: 260, terminal: 'Kandara Central Terminal', aliases: ['kandara', 'highlands', 'kandara city'] },
];

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));

export const QUICK_DESTINATIONS = [
  'home', 'work', 'school', 'university', 'hospital', 'airport', 'station',
  'restaurant', 'hotel', 'gym', 'shopping', 'event',
];

/** Journey purposes. They shape route weighting but never create new transport types. */
export const PURPOSES = [
  { id: 'everyday', label: 'Everyday', icon: 'route' },
  { id: 'work', label: 'Work', icon: 'building' },
  { id: 'school', label: 'School', icon: 'school' },
  { id: 'family', label: 'Family', icon: 'users' },
  { id: 'tourism', label: 'Tourism', icon: 'camera' },
  { id: 'special', label: 'Special journey', icon: 'heart' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'hospital', label: 'Hospital / appointment', icon: 'hospital' },
];

/** Travel needs. These change which of the 20 vehicles NEXORA chooses. */
export const NEEDS = [
  { id: 'wheelchair', label: 'Wheelchair accessible', icon: 'wheelchair', hint: 'Ramps, wheelchair space and lifts' },
  { id: 'lessWalking', label: 'Less walking', icon: 'walk', hint: 'Door-to-door, fewer changes' },
  { id: 'assist', label: 'Help boarding', icon: 'hand', hint: 'Assisted boarding at each stop' },
  { id: 'luggage', label: 'Big luggage', icon: 'luggage', hint: 'Room for suitcases' },
  { id: 'budget', label: 'Lowest cost', icon: 'wallet', hint: 'Cheapest option first' },
];

/** Example journeys (all use only the 20 approved vehicles). */
export const SCENARIOS = [
  { id: 's1', title: 'University by 9:00', description: 'City Pod and Metro, arriving before your target', from: 'home', to: 'university', purpose: 'everyday', needs: [], whenMode: 'arrive', time: '09:00' },
  { id: 's2', title: 'Everyday short trip', description: 'Home to the gym, one vehicle door to door', from: 'home', to: 'gym', purpose: 'wellness', needs: [] },
  { id: 's3', title: 'Wheelchair user', description: 'Step-free vehicle and step-free rail to the hospital', from: 'home', to: 'hospital', purpose: 'hospital', needs: ['wheelchair', 'stepFree', 'extraTime'] },
  { id: 's4', title: 'School run', description: 'Child-Safe Autonomous Vehicle with guardian alerts', from: 'home', to: 'school', purpose: 'school', needs: [] },
  { id: 's5', title: 'Business trip', description: 'Smart-road ride to the Maglev Express for Kandara', from: 'hotel', to: 'highlands', purpose: 'business', needs: [] },
  { id: 's6', title: 'Airport', description: 'Fast, luggage-friendly journey to Skyport', from: 'home', to: 'airport', purpose: 'airport', needs: ['luggage'] },
  { id: 's7', title: 'Special journey', description: 'Luxury vehicle and private air to Lagoon Pearl Resort', from: 'hotel', to: 'resort', purpose: 'special', needs: [] },
  { id: 's8', title: 'Family long distance', description: 'Rail and air shuttle to the resort with the family', from: 'home', to: 'resort', purpose: 'family', needs: ['luggage'] },
];
