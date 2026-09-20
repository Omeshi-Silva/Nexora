/** Fictional 2100 offers, all within the four NEXORA service categories. */
export const OFFERS = [
  { id: 'commuter', title: 'Commuter Pass', icon: 'train', original: 60, price: 42, validity: 'Monthly, renews automatically', conditions: 'Unlimited Autonomous Metro plus 20 City Pod rides.', eligibility: null },
  { id: 'family', title: 'Family Mobility Package', icon: 'users', original: 48, price: 32, validity: 'Weekends until 31 Dec 2100', conditions: 'Shared Mobility Pods and Step-Free vehicles for up to 5 people.', eligibility: 'Families with at least one child' },
  { id: 'access', title: 'Accessibility Mobility Package', icon: 'a11y', original: 40, price: 20, validity: 'Monthly', conditions: 'Step-Free Mobility Vehicle rides and priority boarding on rail.', eligibility: 'Travellers with accessibility needs' },
  { id: 'business', title: 'Business Travel Package', icon: 'briefcase', original: 260, price: 210, validity: 'Monthly', conditions: 'Corporate Shuttle access and 2 Maglev Express returns.', eligibility: 'Corporate account' },
  { id: 'premium', title: 'Premium Mobility Package', icon: 'crown', original: 620, price: 489, validity: '90 days', conditions: 'Luxury Autonomous Vehicle and one Private Air Mobility flight.', eligibility: null },
  { id: 'airport', title: 'Airport Journey Bundle', icon: 'plane', original: 95, price: 76, validity: 'Book 24 hours ahead', conditions: 'Autonomous Taxi plus an Air Shuttle seat to or from Skyport.', eligibility: null },
  { id: 'weekend', title: 'Weekend Mobility Pass', icon: 'sun', original: 36, price: 24, validity: 'Saturdays and Sundays', conditions: 'All-day Metro and Micro-Shuttle, 2 City Pod rides.', eligibility: null },
  { id: 'student', title: 'Student Rail Offer', icon: 'school', original: 40, price: 22, validity: 'Expired 12 Sep 2100', expired: true, conditions: 'Unlimited Metro and 25% off Maglev.', eligibility: 'Verified student ID' },
];
