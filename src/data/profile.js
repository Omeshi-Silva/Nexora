/** Default fictional profile. Everything here is editable in the Profile page. */
export const DEFAULT_PROFILE = {
  name: 'Amaya Perera',
  initials: 'AP',
  memberSince: '2094',
  language: 'en',
  budget: 30,
  preferredModes: ['rail', 'ground'],
  comfortMode: 'standard',
  cabin: { temperature: 22, lighting: 'soft', audio: 'announcements', privacy: false, seating: 'standard' },
  savedPlaces: [
    { id: 'home', label: 'Home', placeId: 'home' },
    { id: 'work', label: 'Work', placeId: 'work' },
    { id: 'school', label: 'School', placeId: 'school' },
  ],
  payment: [
    { id: 'pass', label: 'NEXORA Pass balance', detail: 'Instant, no fees' },
    { id: 'card', label: 'Aurora Bank card ending 2100', detail: 'Fictional demo card' },
    { id: 'bio', label: 'BioPay palm authorisation', detail: 'Demo only' },
  ],
  privacy: { location: true, personalization: true, history: true, emergencyShare: true, notifications: true },
  notifications: { delays: true, arrivals: true, transfers: true, offers: false, safety: true, booking: true },
};

export const DEFAULT_PASS = {
  id: 'NXP-2100-4471-AURORA',
  tier: 'Explorer',
  balance: 500,
  balanceSeed: 2,
  points: 2840,
  validUntil: 'Dec 2101',
};

export const DEFAULT_PREFS = {
  largeText: false,
  highContrast: false,
  voiceGuidance: false,
  voiceInput: true,
  screenReader: false,
  simplified: false,
  stepFree: false,
  wheelchair: false,
  visualAlerts: true,
  captions: true,
  reducedMotion: false,
  extraTime: false,
  lessWalking: false,
  quiet: false,
  vibration: true,
  mapAsList: false,
};
