# Chemistry Atelier

Chemistry Atelier is a static-first, interactive chemistry learning experience for high-school students. It combines all 118 elements, procedural Three.js atomic models, a keyboard-accessible periodic table, deterministic element quizzes, comparison tools, local progress, and twelve guided equation-balancing activities.

The product reimplements the useful editorial structure of Anatomy Atelier without copying its source or anatomical assets. Chemistry content, interactions, data contracts, and procedural visuals are original to this repository.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The element explorer uses readable URLs such as `/?element=hydrogen` with an optional element slug in `compare`. The lab accepts `/reactions?reaction=<slug>`.

## Release gates

```bash
npm run check
npm run test:e2e
```

`check` runs lint, TypeScript, unit/data tests, and the production build. Playwright covers desktop and 390 px mobile behavior plus committed visual baselines for Carbon, Oganesson, comparison mode, the periodic table, and a balanced reaction.

## Element data

The browser and production build use the committed snapshot at `app/data/elements.json`; neither depends on a runtime chemistry API.

Refresh the snapshot manually with:

```bash
npm run data:sync
```

The sync task downloads PubChem’s periodic-table JSON and PUG-View element records, derives shell occupancy from electron configurations, selects an abundance-backed representative isotope when available, normalizes nullable properties, and attaches PubChem, IUPAC, and NIST references to every element. Generated records are validated for 118 sequential atomic numbers, unique identities, electron totals, table placement, and non-negative isotope-derived neutron counts. Because IUPAC and NIST publish the authoritative review tables primarily as human-readable tables/PDFs, changes to names, standard atomic weights, or key evaluated properties should be reviewed against those linked editions before committing a refreshed snapshot.

## Teaching-model limits

Atomic shell paths, particle spacing, relative scale, and reaction geometry are deliberately simplified. Reaction animation shows conserved atom identities and schematic bond rearrangement; it is not a quantum orbital, kinetic, or reaction-mechanism simulation. Safety copy is conceptual and the app provides no experimental quantities or procedural laboratory instructions.

## Persistence and privacy

Favorites, eight recent elements, quiz scores, completed reactions, last selections, and auto-rotate preference are stored only in `localStorage` under `chemistry-atelier:v1`. Missing, blocked, old, or malformed storage recovers to safe defaults. The v1 app has no account, analytics payload, database, cloud sync, notes, or user PII.

## Deployment

The two routes are statically prerendered by Next.js and are ready for a standard Vercel deployment. No environment variables are required for builds or browser sessions.
