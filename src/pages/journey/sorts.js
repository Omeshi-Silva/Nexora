export const SORTS = [
  { id: 'best', label: 'Best option' },
  { id: 'fastest', label: 'Fastest', fn: (a, b) => a.durationMin - b.durationMin },
  { id: 'cheapest', label: 'Lowest cost', fn: (a, b) => a.price - b.price },
  { id: 'accessible', label: 'Most accessible', fn: (a, b) => b.access.score - a.access.score },
  { id: 'fewest', label: 'Fewest transfers', fn: (a, b) => a.transferCount - b.transferCount || a.durationMin - b.durationMin },
  { id: 'comfort', label: 'Most comfortable', fn: (a, b) => b.comfort - a.comfort },
  { id: 'eco', label: 'Lowest environmental impact', fn: (a, b) => b.ecoScore - a.ecoScore || a.energyKwh - b.energyKwh },
  { id: 'family', label: 'Family friendly', fn: (a, b) => (a.transferCount * 10 - a.access.score) - (b.transferCount * 10 - b.access.score) },
  { id: 'business', label: 'Business friendly', fn: (a, b) => (a.durationMin - a.comfort * 6) - (b.durationMin - b.comfort * 6) },
  { id: 'premium', label: 'Premium', fn: (a, b) => b.comfort - a.comfort || b.price - a.price },
];
