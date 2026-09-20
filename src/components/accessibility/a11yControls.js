/** Single source of truth for accessibility controls (used on Home, in the panel and in Profile). */
export const A11Y_GROUPS = [
  { id: 'see', label: 'Seeing' },
  { id: 'hear', label: 'Hearing' },
  { id: 'move', label: 'Moving around' },
  { id: 'think', label: 'Understanding and focus' },
];

export const A11Y_CONTROLS = [
  { key: 'largeText', label: 'Large text', icon: 'text', hint: 'Bigger letters on every screen', group: 'see', quick: true },
  { key: 'highContrast', label: 'High contrast', icon: 'contrast', hint: 'Solid colours and strong outlines', group: 'see', quick: true },
  { key: 'voiceGuidance', label: 'Voice guidance', icon: 'volume', hint: 'Reads alerts and next steps aloud', group: 'see', quick: true },
  { key: 'screenReader', label: 'Screen reader support', icon: 'eye', hint: 'Extra descriptions and the map as text', group: 'see', quick: true },
  { key: 'mapAsList', label: 'Map as a list', icon: 'list', hint: 'Step-by-step text instead of the map', group: 'see' },
  { key: 'voiceInput', label: 'Voice input', icon: 'mic', hint: 'Speak to search and ask questions', group: 'hear', quick: true },
  { key: 'captions', label: 'Text alerts', icon: 'captions', hint: 'Every spoken message is also written', group: 'hear', quick: true },
  { key: 'visualAlerts', label: 'Visual alerts', icon: 'bell', hint: 'Screen edges flash for important alerts', group: 'hear', quick: true },
  { key: 'vibration', label: 'Vibration alerts', icon: 'vibrate', hint: 'Phone vibrates for delays and changes', group: 'hear' },
  { key: 'stepFree', label: 'Step-free routes', icon: 'stairs', hint: 'No stairs anywhere on your journey', group: 'move', quick: true, routing: true },
  { key: 'wheelchair', label: 'Wheelchair accessible', icon: 'wheelchair', hint: 'Ramps, wheelchair locks and lifts', group: 'move', quick: true, routing: true },
  { key: 'extraTime', label: 'Extra boarding time', icon: 'clock', hint: 'More time to board and to change', group: 'move', quick: true, routing: true },
  { key: 'lessWalking', label: 'Less walking', icon: 'walk', hint: 'Door-to-door trips with fewer changes', group: 'move', quick: true, routing: true },
  { key: 'simplified', label: 'Simple instructions', icon: 'list', hint: 'Simplified mode: plain words, fewer choices, bigger buttons', group: 'think', quick: true },
  { key: 'quiet', label: 'Quiet journey', icon: 'moon', hint: 'Prefer calm, private vehicles', group: 'think', routing: true },
  { key: 'reducedMotion', label: 'Reduced motion', icon: 'motion', hint: 'Stops moving effects and animations', group: 'think', quick: true },
];
