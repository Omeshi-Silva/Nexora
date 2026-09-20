/**
 * Demo personas: one tap applies someone's settings and plans their trip, showing how the same
 * NEXORA adapts to different people. Only preference keys listed in PERSONA_KEYS are changed.
 */
export const PERSONA_KEYS = ['largeText', 'highContrast', 'simplified', 'stepFree', 'wheelchair', 'extraTime', 'lessWalking', 'quiet', 'captions', 'visualAlerts', 'vibration', 'voiceGuidance', 'reducedMotion', 'mapAsList', 'screenReader'];

export const PERSONAS = [
  { id: 'commuter', label: 'Daily commuter', icon: 'train', summary: 'Needs to reach university by 9:00', settings: 'Standard settings', prefs: {}, trip: { fromId: 'home', toId: 'university', purpose: 'everyday', whenMode: 'arrive', time: '09:00', needs: [] } },
  { id: 'wheelchair', label: 'Wheelchair user', icon: 'wheelchair', summary: 'Hospital appointment, step-free all the way', settings: 'Wheelchair accessible, step-free, extra boarding time', prefs: { wheelchair: true, stepFree: true, extraTime: true }, trip: { fromId: 'home', toId: 'hospital', purpose: 'hospital', needs: ['assist'] } },
  { id: 'older', label: 'Older traveller', icon: 'text', summary: 'Shopping trip with less walking', settings: 'Large text, simple instructions, less walking, extra boarding time', prefs: { largeText: true, simplified: true, lessWalking: true, extraTime: true }, trip: { fromId: 'home', toId: 'shopping', purpose: 'shopping', needs: [] } },
  { id: 'parent', label: 'Parent', icon: 'shield', summary: 'School run with guardian alerts', settings: 'Standard settings, school purpose', prefs: {}, trip: { fromId: 'home', toId: 'school', purpose: 'school', needs: [] } },
  { id: 'deaf', label: 'Deaf traveller', icon: 'captions', summary: 'Airport trip, no sound needed', settings: 'Text alerts, visual alerts, vibration; voice off', prefs: { captions: true, visualAlerts: true, vibration: true, voiceGuidance: false }, trip: { fromId: 'home', toId: 'airport', purpose: 'airport', needs: ['luggage'] } },
  { id: 'business', label: 'Business traveller', icon: 'briefcase', summary: 'Fast long-distance trip to Kandara', settings: 'Standard settings, business purpose', prefs: {}, trip: { fromId: 'hotel', toId: 'highlands', purpose: 'business', needs: [] } },
];

export const PERSONA_BY_ID = Object.fromEntries(PERSONAS.map((p) => [p.id, p]));
