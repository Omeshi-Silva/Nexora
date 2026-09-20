/** Status of the four NEXORA service categories (the only categories that exist). */
export const NETWORK_STATUS = [
  { id: 'ground', label: 'Autonomous Ground', icon: 'pod', state: 'normal', note: 'Pods, taxis and shuttles running normally' },
  { id: 'roads', label: 'Smart Roads', icon: 'car', state: 'heavy', note: 'Heavy traffic on Ring Road 2 until 10:30' },
  { id: 'rail', label: 'Rail', icon: 'train', state: 'minor', note: 'Some Metro trains 2–3 minutes late near Central Hub' },
  { id: 'air', label: 'Air Mobility', icon: 'airtaxi', state: 'normal', note: 'All vertiports open. Winds calm' },
];

export const STATE_LABEL = { normal: 'Normal', minor: 'Minor delay', heavy: 'Heavy traffic', down: 'Not running' };
