# Vehicle photos (originals)

Put one photo per vehicle here, named exactly like the vehicle (e.g. `Maglev Train.jpeg`),
or by its id (e.g. `maglev-train.jpg`). Then run:

```bash
npm run images
```

This creates optimised WebP files in `src/assets/vehicles/` (640px and 1200px wide)
and rewrites `src/data/vehicleImages.js`. Vehicles without a photo automatically use
the built-in vector illustration, so the app never shows a broken image.


Corporate Autonomous Shuttle photo).
