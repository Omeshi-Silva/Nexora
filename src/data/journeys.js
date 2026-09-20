/** Seed history for My Journeys. Times are relative to "now" so the page always looks current. */
const H = 3600e3;
const D = 24 * H;
export const seedJourneys = (now = Date.now()) => [
  { id: 'j-seed-1', status: 'upcoming', title: 'Home to Meridian University', fromId: 'home', toId: 'university', purpose: 'everyday', depart: now + 1 * D + 2 * H, modes: ['micro-shuttle', 'metro'], price: 4.2, durationMin: 27 },
  { id: 'j-seed-2', status: 'completed', title: 'Home to Pulse Wellness Centre', fromId: 'home', toId: 'gym', purpose: 'wellness', depart: now - 1 * D - 5 * H, modes: ['city-pod'], price: 3.9, durationMin: 9 },
  { id: 'j-seed-3', status: 'completed', title: 'Work to Saffron Orbit Restaurant', fromId: 'work', toId: 'restaurant', purpose: 'everyday', depart: now - 3 * D, modes: ['shared-pod'], price: 4.6, durationMin: 16 },
  { id: 'j-seed-4', status: 'cancelled', title: 'Home to Horizon Arena', fromId: 'home', toId: 'event', purpose: 'event', depart: now - 6 * D, modes: ['micro-shuttle', 'metro'], price: 4.1, durationMin: 34 },
  { id: 'j-seed-5', status: 'saved', title: 'Hotel to Coral Bay Beach', fromId: 'hotel', toId: 'beach', purpose: 'tourism', depart: null, modes: ['autonomous-taxi'], price: 9.4, durationMin: 31 },
];

export const seedNotifications = (now = Date.now()) => [
  { id: 'n-seed-1', type: 'offer', severity: 'info', title: 'Weekend Mobility Pass', body: 'Save $12 with the Weekend Mobility Pass.', at: now - 50 * 60e3, read: false },
  { id: 'n-seed-2', type: 'safety', severity: 'warning', title: 'Heavy traffic on Ring Road 2', body: 'NEXORA will route you around it automatically until 10:30.', at: now - 25 * 60e3, read: false },
  { id: 'n-seed-3', type: 'booking', severity: 'success', title: 'Booking confirmed', body: 'Tomorrow: Home to Meridian University. Ticket saved to your NEXORA Pass.', at: now - 3 * H, read: true },
];
