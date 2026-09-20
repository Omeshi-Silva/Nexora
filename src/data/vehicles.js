/**
 * NEXORA vehicle database: the single source of truth.
 * Exactly 4 service categories x 5 vehicles = 20 vehicles. Nothing else may appear in the app.
 * Where the specification gives no value, the field is null rather than invented.
 * Presentation-only additions: icon, family (colour/marker group), fleet (tracking call-sign), accessScore.
 */
export const CATEGORIES = [
  { id: 'ground', label: 'Autonomous Ground Transportation', short: 'Autonomous Ground', icon: 'pod', color: '#39FF14', color2: '#7CFF5B', glow: 'rgba(57,255,20,0.65)' },
  { id: 'smart', label: 'Smart Roads', short: 'Smart Roads', icon: 'car', color: '#FFE600', color2: '#FFF45C', glow: 'rgba(255,230,0,0.65)' },
  { id: 'rail', label: 'Rail', short: 'Rail', icon: 'maglev', color: '#B026FF', color2: '#D66BFF', glow: 'rgba(176,38,255,0.65)' },
  { id: 'air', label: 'Air Mobility', short: 'Air Mobility', icon: 'airtaxi', color: '#00AFFF', color2: '#52D9FF', glow: 'rgba(0,175,255,0.65)' },
];
/** Red is reserved for problems and incidents. It is never a transport category. */
export const PROBLEM = { id: 'problem', label: 'Problem / Incident', color: '#FF1744', color2: '#FF5C75', glow: 'rgba(255,23,68,0.75)' };
const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const v = (o) => {
  const accessibilityList = o.accessibility || [];
  const safetyList = o.safety || [];
  return {
    booking: o.availability, comfort: null, luggage: null, ai: null, features: [], eco: null, travelTime: null,
    status: 'Available', standard: true, speedNote: null, priceNote: null, type: null, suitableUsers: null,
    ...o,
    category: CAT[o.family].label,
    categoryId: o.family,
    energy: o.power,
    bestFor: o.description,
    accessibilityList,
    accessibility: accessibilityList.join(', '),
    safetyList,
    safety: safetyList.join(', ') || null,
    liveTracking: true,
    tracking: true,
  };
};

export const VEHICLES = [
  // ---------- 01 Autonomous Ground Transportation ----------
  v({ id: 'city-pod', no: 1, family: 'ground', icon: 'pod', fleet: 'NX-POD', accessScore: 84, name: 'Autonomous City Pod', purpose: 'Short-distance city travel', passengers: '1–4', distance: [1, 15], speed: [30, 60], power: 'Electric', price: 3.5, availability: 'On-demand', booking: 'On-demand', accessibility: ['Wheelchair-compatible versions', 'Easy entry', 'Simple interior controls', 'Voice guidance', 'Large readable displays', 'Suitable for elderly users', 'Suitable for users with low technology confidence'], safety: ['Autonomous navigation', 'Obstacle detection', 'AI route monitoring'], comfort: 4, luggage: 'Small luggage', description: 'Simple everyday journeys', ai: 'NEXORA can automatically select an available City Pod for a short journey' }),
  v({ id: 'autonomous-taxi', no: 2, family: 'ground', icon: 'car', fleet: 'NX-TAXI', accessScore: 82, name: 'Autonomous Taxi', purpose: 'Fast point-to-point travel', passengers: '1–4', distance: [1, 50], speed: [40, 100], power: 'Electric', price: 6, availability: 'Immediate / scheduled', booking: 'Immediate / scheduled', accessibility: ['Accessible vehicle option', 'Easy boarding', 'Voice interaction', 'Accessible route selection', 'Large digital interface'], safety: ['AI driving', 'Collision avoidance', 'Continuous route monitoring'], comfort: 5, luggage: '2–3 bags', description: 'Fast private journeys', ai: 'Automatically selects the fastest available suitable vehicle' }),
  v({ id: 'shared-pod', no: 3, family: 'ground', icon: 'pod', fleet: 'NX-SHARE', accessScore: 80, name: 'Shared Mobility Pod', purpose: 'Shared short-distance travel', passengers: '2–8', distance: [2, 20], speed: [30, 70], power: 'Electric', price: 2.5, availability: 'Shared / On-demand', booking: 'Shared / On-demand', accessibility: ['Accessible versions', 'Easier boarding', 'Suitable for elderly passengers', 'Space for small mobility requirements'], safety: ['Autonomous driving', 'AI route coordination'], comfort: 4, luggage: 'Small / medium', description: 'Affordable shared transportation', ai: 'Groups passengers travelling in similar directions' }),
  v({ id: 'micro-shuttle', no: 4, family: 'ground', icon: 'bus', fleet: 'NX-MICRO', accessScore: 95, name: 'Autonomous Micro-Shuttle', purpose: 'First-mile / last-mile transportation', passengers: '8–15', distance: [1, 15], speed: [30, 60], power: 'Electric', price: 2, availability: 'On-demand', booking: 'On-demand', accessibility: ['Wheelchair accessible', 'Assisted boarding', 'Easy-to-understand route information', 'Large displays', 'Voice instructions'], safety: ['Autonomous navigation', 'Demand-aware routing'], description: 'Connecting neighbourhoods with transportation hubs', ai: 'Route automatically adjusts according to passenger demand' }),
  v({ id: 'regional-bus', no: 5, family: 'ground', icon: 'bus', fleet: 'NX-REG', accessScore: 95, name: 'Autonomous Regional Bus', purpose: 'City-to-city travel', passengers: '40–100', distance: [20, 150], speed: [60, 110], power: 'Electric / Hydrogen', price: 8, availability: 'Scheduled regional service', booking: 'Scheduled regional service', accessibility: ['Wheelchair access', 'Assisted boarding', 'Suitable for elderly users', 'Large boarding areas'], safety: ['Autonomous driving', 'AI route optimization'], comfort: 4, luggage: 'Large luggage compartment', description: 'Affordable longer road journeys', ai: 'Route optimization' }),

  // ---------- 02 Smart Roads ----------
  v({ id: 'smart-road-vehicle', no: 6, family: 'smart', icon: 'car', fleet: 'NX-ROAD', accessScore: 80, name: 'Smart-Road Autonomous Vehicle', purpose: 'Flexible journeys using intelligent road infrastructure', passengers: '1–6', distance: [5, 200], speed: [40, 140], power: 'Electric', price: 10, availability: 'On-demand / route-based', accessibility: ['Custom configurations', 'Accessible route matching', 'Voice guidance', 'Simplified controls'], safety: ['Vehicle-to-infrastructure safety communication', 'Predictive traffic awareness'], features: ['Vehicle-to-infrastructure communication', 'Smart traffic interaction', 'Predictive traffic routing', 'Intelligent intersections', 'Real-time road information'], description: 'Flexible journeys using intelligent road infrastructure', ai: 'Predictive traffic routing' }),
  v({ id: 'child-safe-vehicle', no: 7, family: 'smart', icon: 'shield', fleet: 'NX-KID', accessScore: 80, name: 'Child-Safe Autonomous Vehicle', purpose: 'Journeys needing extra family safety', passengers: '1–6', distance: [1, 100], speed: [30, 100], power: 'Electric', availability: 'Scheduled / monitored', accessibility: ['Easy boarding', 'Simple instructions', 'Voice guidance', 'Suitable for children and accompanying adults'], safety: ['Guardian confirmation', 'Child-safe locking', 'Route monitoring', 'Emergency communication', 'Arrival notification'], description: 'Journeys requiring additional family safety and guardian visibility', ai: 'Guardian notifications and route monitoring' }),
  v({ id: 'step-free-vehicle', no: 8, family: 'smart', icon: 'stairs', fleet: 'NX-STEP', accessScore: 99, name: 'Step-Free Mobility Vehicle', purpose: 'Easy-boarding accessible journeys', passengers: '2–8', distance: [1, 100], speed: [30, 80], power: 'Electric', availability: 'Accessible journey booking', accessibility: ['Zero-step entry', 'Automatic ramp', 'Low-floor design', 'Priority boarding', 'Extra boarding time'], suitableUsers: ['Elderly users', 'Wheelchair users', 'Mobility-limited users', 'Users with temporary mobility difficulties', 'Users carrying large equipment', 'Parents with strollers'], description: 'Journeys where easy boarding and accessibility matter more than maximum speed' }),
  v({ id: 'corporate-shuttle', no: 9, family: 'smart', icon: 'briefcase', fleet: 'NX-CORP', accessScore: 84, name: 'Corporate Autonomous Shuttle', purpose: 'Organised employee transportation', passengers: '10–30', distance: [5, 100], speed: [40, 100], power: 'Electric', availability: 'Scheduled', accessibility: ['Accessible boarding', 'Simple digital interface', 'Voice information', 'Comfortable seating'], features: ['Employee verification', 'Scheduled routes', 'Corporate account', 'Wi-Fi', 'Charging ports', 'Work environment'], description: 'Organised employee transportation' }),
  v({ id: 'luxury-vehicle', no: 10, family: 'smart', icon: 'crown', fleet: 'NX-LUX', accessScore: 80, name: 'Luxury Autonomous Vehicle', purpose: 'Private, premium road travel', passengers: '1–4', distance: [1, 300], speed: [40, 150], power: 'Electric', price: 100, availability: 'Premium booking', accessibility: ['Easy boarding configuration', 'Voice assistant', 'Personalised environment', 'Accessibility preferences applied through NEXORA'], features: ['Premium seats', 'Privacy glass', 'Personal AI assistant', 'Climate control', 'Entertainment', 'Refreshments'], description: 'Users prioritising privacy, comfort and premium service', ai: 'Personal AI assistant' }),

  // ---------- 03 Rail ----------
  v({ id: 'metro', no: 11, family: 'rail', icon: 'train', fleet: 'NX-METRO', accessScore: 95, name: 'Autonomous Metro', purpose: 'Everyday city commuting', passengers: '100–500', distance: [2, 50], speed: [60, 120], power: 'Electric', price: 1.5, availability: 'Frequent urban service', booking: 'Normally not required', accessibility: ['Step-free stations', 'Accessible platforms', 'Clear visual information', 'Simple route instructions'], description: 'Everyday city commuting' }),
  v({ id: 'maglev-train', no: 12, family: 'rail', icon: 'maglev', fleet: 'NX-MAG', accessScore: 95, name: 'Maglev Train', purpose: 'Fast intercity transportation', passengers: '200–600', distance: [50, 800], speed: [300, 600], power: 'Electric', price: 25, availability: 'Scheduled', booking: 'Required', accessibility: ['Step-free boarding', 'Accessible stations', 'Large luggage space'], comfort: 5, luggage: 'Large luggage space', features: ['Magnetic levitation'], description: 'Fast intercity transportation' }),
  v({ id: 'maglev-express', no: 13, family: 'rail', icon: 'maglev', fleet: 'NX-HSX', accessScore: 97, name: 'High-Speed Maglev Express', purpose: 'Very long-distance high-speed rail', passengers: '300–800', distance: [200, 1500], speed: [500, 800], power: 'Electric', price: 50, availability: 'Scheduled', accessibility: ['Fully accessible', 'Step-free journey design', 'Large luggage capability'], comfort: 5, luggage: 'Large luggage capability', description: 'Very long-distance high-speed rail journeys', ai: 'Predictive arrival calculation' }),
  v({ id: 'intercity-train', no: 14, family: 'rail', icon: 'train', fleet: 'NX-ICT', accessScore: 95, name: 'Autonomous Intercity Train', purpose: 'Intercity journeys involving transfers', passengers: '300–1,000', distance: [100, 1000], speed: [200, 450], power: 'Electric', price: 30, availability: 'Scheduled', booking: 'Required', accessibility: ['Step-free access', 'Accessible boarding', 'Large luggage'], luggage: 'Large luggage', description: 'Intercity journeys involving transfers', ai: 'Connection protection and smart rebooking' }),
  v({ id: 'vacuum-tube', no: 15, family: 'rail', icon: 'tube', fleet: 'NX-VTX', accessScore: 86, name: 'Vacuum-Tube Express', purpose: 'Ultra-fast long-distance travel', passengers: '20–100 per capsule', distance: [100, 2000], speed: [700, 1200], power: 'Electric', price: 75, availability: 'Future scheduled service', accessibility: ['Accessible capsules', 'Simple boarding instructions', 'Route information in text and voice'], features: ['Low-pressure / vacuum-tube transportation'], description: 'Ultra-fast long-distance travel' }),

  // ---------- 04 Air Mobility ----------
  v({ id: 'air-taxi', no: 16, family: 'air', icon: 'airtaxi', fleet: 'NX-AIR', accessScore: 82, name: 'Autonomous Air Taxi', purpose: 'Fast individual or small-group aerial travel', passengers: '1–4', distance: [5, 150], speed: [150, 300], power: 'Electric', price: 40, availability: 'Booking required', accessibility: ['Accessible cabin options', 'Assisted boarding', 'Voice information', 'Accessible route matching'], description: 'Fast individual or small-group aerial travel', ai: 'Air-traffic-aware routing' }),
  v({ id: 'passenger-drone', no: 17, family: 'air', icon: 'drone', fleet: 'NX-DRN', accessScore: 72, name: 'Passenger Drone', purpose: 'Individual rapid transportation', passengers: '1–2', distance: [5, 100], speed: [100, 200], power: 'Electric', price: 35, availability: 'Scheduled / on-demand depending on network', accessibility: ['Assisted boarding', 'Simple voice/text instructions', 'Accessible flight information'], features: ['AI navigation', 'Autonomous flight', 'Small luggage', 'Low environmental impact'], luggage: 'Small luggage', eco: 'Low', description: 'Individual rapid transportation', ai: 'AI navigation' }),
  v({ id: 'air-shuttle', no: 18, family: 'air', icon: 'plane', fleet: 'NX-ASH', accessScore: 84, name: 'Autonomous Air Shuttle', purpose: 'Families, groups, airport and regional travel', passengers: '6–20', distance: [20, 300], speed: [200, 400], power: 'Electric / Hybrid', price: 60, availability: 'Scheduled', booking: 'Required', accessibility: ['Assisted boarding', 'Accessible seating', 'Clear boarding instructions'], luggage: 'Medium luggage', description: 'Families, groups and airport/regional transportation' }),
  v({ id: 'evtol', no: 19, family: 'air', icon: 'airtaxi', fleet: 'NX-EVT', accessScore: 84, name: 'eVTOL City-to-City Vehicle', purpose: 'Direct city-to-city aerial travel', passengers: '4–8', distance: [20, 500], speed: [200, 350], power: 'Electric', price: 80, availability: 'Scheduled / booking', accessibility: ['Accessible configuration', 'Assisted boarding', 'Clear cabin instructions', 'Accessible route matching'], luggage: 'Medium', description: 'Direct city-to-city aerial transportation', ai: 'AI route planning' }),
  v({ id: 'private-air', no: 20, family: 'air', icon: 'plane', fleet: 'NX-PAX', accessScore: 84, name: 'Private Air Mobility Vehicle', purpose: 'Private premium aerial travel', passengers: '1–6', distance: [20, 500], speed: [250, 500], power: 'Electric / Hybrid', price: 250, availability: 'Premium booking', accessibility: ['Accessible cabin configuration', 'Assisted boarding', 'Voice/text journey instructions', 'Personalised travel settings'], features: ['Private cabin', 'Premium service', 'Dedicated landing point', 'AI flight planning', 'Priority boarding'], description: 'Private premium aerial transportation', ai: 'AI flight planning' }),
];

if (VEHICLES.length !== 20) throw new Error('NEXORA must define exactly 20 vehicles');

export const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map((x) => [x.id, x]));
export const getVehicle = (id) => VEHICLE_BY_ID[id];
export const vehiclesIn = (categoryId) => VEHICLES.filter((x) => x.family === categoryId);

/** Colour + label per category. Colour is never the only signal: every category also has an icon and a name. */
export const FAMILIES = Object.fromEntries(CATEGORIES.map((c) => [c.id, { label: c.short, color: c.color, color2: c.color2, glow: c.glow }]));

export const EXPLORER_FILTERS = [{ id: 'all', label: 'All' }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.short }))];
