# NEXORA — One Journey. Every Future.

An accessible, AI-assisted journey planner and live tracker for the year 2100.
Built with React, Vite and React Router. All data, prices and live updates are fictional and simulated.

## Run it

```bash
npm install
npm run dev        # local development
npm run build      # production build in dist/
```

## Vehicle photos

Photos live in `src/assets/vehicles/` as optimised WebP files (generated, do not edit by hand).
To add or replace one, put the original in `vehicle-images/` named like the vehicle
(e.g. `Autonomous City Pod.jpeg`) and run `npm run images`. Vehicles without a photo
show a vector illustration automatically.

## Motion features

- **Page morphing:** the search card becomes the journey header, and the chosen route card becomes the Selected Route view (View Transitions API; instant in browsers without it).
- **3D hero city:** tilts and draws the route as you scroll (`src/components/home/HeroScene.jsx`).
- **Reduced motion:** every effect is switched off by the Reduced motion setting or the operating-system preference.

## Deploy (free)

- **Vercel:** import the repo, framework "Vite", build `npm run build`, output `dist`.
- **Netlify:** build `npm run build`, publish `dist`.
- **GitHub Pages:** run `npm run build` and publish the `dist` folder.

The app uses `HashRouter` (URLs like `/#/journey`), so deep links and refreshes work on every static host with no server configuration.

## Scope (validated)

| Rule | Status |
|---|---|
| Primary routes | Exactly 3: `/` (Home), `/journey` (Journey / Route Details), `/live` (Live Map / Tracking). `/home` redirects to `/`. |
| Service categories | Exactly 4: Autonomous Ground Transportation, Smart Roads, Rail, Air Mobility |
| Vehicles | Exactly 20 (5 per category), defined once in `src/data/vehicles.js`; the file throws if the count is ever not 20 |
| Secondary features | AI, Profile, Alerts, Booking, Travel Pass, Services, Vehicle details and Journey Complete are panels, not routes |

## Core flow

Home → enter destination → Plan my journey → AI recommendation with reasons → compare routes → Choose this route → Live Map → arrival → Journey complete.

## Where things live

```
src/
  data/        vehicles (20), places, offers, network status, profile, seed journeys
  services/    routeEngine (planning, scoring, plain-language reasons, delays, smart rebooking),
               accessibilityService (matching, plain language), realtimeService (live simulation),
               speechService (voice in/out with fallbacks), storage
  context/     AppContext (preferences, panels, alerts), JourneyContext (search, routes, live trip)
  pages/       HomePage, JourneyPage (+ journey/ tab views), MapPage
  components/  common, layout, accessibility, transport, ai, map, booking, home, panels
  hooks/       useGo (routes + panels), useJourneyRoute, useNow
  styles/      base (tokens + accessibility modes), components, pages, map
```

## Accessibility highlights

- Settings reshape every screen: large text, high contrast, simplified mode, reduced motion.
- Step-free, wheelchair, extra boarding time, less walking and quiet journey change which vehicles the AI picks.
- Voice input and voice guidance, always with a text alternative.
- Visual flash and vibration alerts.
- The map can be shown as a step-by-step list.
- Keyboard navigable, with visible focus.
- Colour is never the only signal: every status has an icon and text.

## Demo tips for judges

- Home → *Try NEXORA as…*: one tap shows the app as a wheelchair user, an older traveller, a parent, a deaf traveller, a commuter or a business traveller. Tap *Back to my settings* to undo.

- Journey page → *Example journeys* shows eight situations, e.g. "University by 9:00" and "Wheelchair user".
- Live Map → *Continue journey* skips to the next step. *Demo controls* changes speed or triggers a disruption to show smart rebooking.
- Tap the accessibility icon in the header → switch on *Wheelchair accessible* → the recommendation changes.
