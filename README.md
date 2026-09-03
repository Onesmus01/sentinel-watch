# Sentinel Watch

A regional hazard early-warning console. Pick a county, sub-county and ward,
choose a hazard (flood, drought, landslide), accept the system parameter defaults
or override them, press Run, and the ward-level risk classes render on the map.
The Reports page turns the same model run into a downloadable CSV or JSON extract.

**The figures are illustrative demo values from a placeholder scoring model. They
are not for operational decisions.** `src/lib/hazard-model.ts` is the seam where
real hazard modelling would replace it.

<details>
<summary>Original brief (verbatim)</summary>

> A hazard monitoring dashboard. It should have a heading, verticall navbar
> aligned to the left, a mapframe at the center, with key containing coolor
> classes, and a footer. The navbar should carry search bars for location,
> county, sub county, and wards. below it, a Hazards' list ie. Flood, Drought,
> an d landslides. Below that should be a parameters' list ie. Gradient,
> rainfall, Temprature, and Humidity. A user can choose to adjust the parameters
> or use the systems defaults. There should be a 'Run' button that when pressed
> directs the system to do the calculations and render the result on the map.
> Include a Download Reports page which a user can request for. Keep it
> intuitive, responsive and dynamic while still caring for proffesionalism and
> user friendliness.

</details>

## Development

```sh
npm i          # or: bun install  (bun.lock is the committed lockfile)
npm run dev    # vite dev on :8080, or the next free port
```

| Command              | What it does                                               |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Dev server with HMR                                        |
| `npm run build`      | Production build (also regenerates `src/routeTree.gen.ts`) |
| `npm test`           | Gate tests — deterministic, local, no network              |
| `npm run test:watch` | Same suite in watch mode                                   |
| `npm run lint`       | ESLint + Prettier                                          |
| `npm run format`     | Prettier write                                             |

Enable the pre-commit gate once per clone:

```sh
git config core.hooksPath .githooks
```

It typechecks, lints and runs the gate tests, but only when the commit touches
`src/` or the build config.

## Layout

```
src/
  lib/hazard-model.ts   pure scoring model, county/ward dataset, risk classes
  lib/report.ts         report contract: summarise, CSV, JSON, filenames
  lib/geo.ts            map geography, tile source, scale-bar arithmetic
  hooks/                useHazardModel — scope + parameter + run state machine
  components/hazard/     the console's own components
  components/ui/        vendored shadcn primitives (do not hand-edit)
  routes/               file-based routing; __root.tsx is the only shell
  styles.css            design tokens; all colours in oklch
```

The boundary that matters is between the pure and the impure. `src/lib` is
same-input-same-output and carries no React and no DOM: that is what makes the
model and the report format testable without a browser, and it is where a real
hazard model would be swapped in. `src/hooks` owns state, `src/components/hazard`
owns presentation, `src/routes` only composes.

This is one Vite app and one deploy unit, not a set of services. Splitting a
single client bundle across service directories would add directories without
adding isolation, since it all ships together anyway.

## The map

An OpenStreetMap basemap via [Leaflet](https://leafletjs.com/), opening on Kenya
at a **200 km scale**. That figure is not a magic number: `scaleBarMetres()` in
`src/lib/geo.ts` reimplements Leaflet's scale-bar rounding, and `geo.test.ts`
asserts it returns exactly 200 km at `KENYA_ZOOM`, so changing the zoom fails a
test rather than quietly changing the caption. Selecting a county flies to that
county's real administrative extent; the header control returns to the national
view.

Leaflet reads `window` at import time and this app server-renders, so
`MapFrame` imports the library dynamically inside an effect. Only its stylesheet
is imported statically.

County extents were looked up against Nominatim rather than recalled, and each
resolved to a `boundary/administrative` feature. Worth knowing if you add
counties: a free-text query for "Baringo County, Kenya" returns an estate
agent's office in Kabarnet, and Nominatim has no county-level boundary under
that name at all — it only resolves with `featureType=state`. `geo.test.ts`
rejects any extent too small to be a county, which is what would have caught it.

### The basemap carries no risk data, on purpose

The dataset has **no geometry**. Ward "shapes" used to be seeded pseudo-random
hexagons on an abstract 100×100 grid — fine as an abstract diagram, and actively
misleading over real terrain, because fabricated positions on a real map read as
geospatial output. Risk lives where it can be read honestly: the graduated
legend and the ward table. An overlay lands when real ward boundaries do, and
the natural shape is a county choropleth from boundary GeoJSON.

### Tiles: demo-only

`TILE_URL` points at OpenStreetMap's public tile server. Two things follow:

- **Its [usage policy](https://operations.osmfoundation.org/policies/tiles/)
  forbids production or heavy use.** Before deploying, move to a commercial
  provider or a self-hosted renderer. That is a change to `TILE_URL` and
  `TILE_ATTRIBUTION` in `src/lib/geo.ts` and nothing else.
- **The ODbL requires the attribution to stay visible.** It is rendered by
  Leaflet's attribution control, and both `geo.test.ts` and the `MapFrame` tests
  assert it credits OpenStreetMap and links the copyright page — so it is not
  something a later layout tidy can quietly drop.

## Design tokens

`src/styles.css` defines everything in oklch. Two groups are specific to this app:

- **Console chrome** — `--chrome`, `--chrome-foreground`, `--chrome-muted` and
  `--map`. The header and control rail stay dark in both light and dark mode so
  the map is the brightest thing on screen.
- **Risk ramp** — `--risk-1` … `--risk-5`, read off `RISK_CLASSES[n].varName` in
  `src/lib/hazard-model.ts`. Never hardcode a risk colour.

The ramp is a single-hue (red) ordinal scale, light to dark, checked with the
`dataviz` skill's `validate_palette.js --ordinal` against the real `--map`
surface: monotone lightness, adjacent ΔL 0.0665, single hue, and a lightest step
that still clears 2:1 on the map. It clears 2:1 on purpose rather than fading
into the surface the way a continuous choropleth ramp may — unmodelled area here
_is_ the map background, so a washed-out "Very Low" would be indistinguishable
from "not modelled".

Risk is never carried by colour alone: the legend labels every class with its
numeric range, the map tooltip names the class on hover, and `WardTable` lists
every ward's score and class as text.

> Adding a token takes three edits, and missing the third fails silently:
> define it in `:root`, define it in `.dark`, and — if it needs a utility class
> like `bg-chrome` — register `--color-<name>` in `@theme inline`. Tailwind v4
> emits no CSS for an unregistered token and raises no error, so the app renders
> unstyled while the build stays green. `src/test/design-tokens.test.ts` exists
> to catch that.

## Tests

One lane, and it is the fast one: `npm test` is deterministic, offline and free,
so it can run on every commit.

- `src/lib/hazard-model.test.ts` — risk-class boundaries, score clamping under
  extreme and out-of-range parameters, scope filtering, determinism, dataset
  invariants.
- `src/lib/report.test.ts` — CSV field counts and RFC 4180 escaping, JSON shape,
  filename collisions and Windows-illegal characters.
- `src/hooks/use-hazard-model.test.ts` — scope resets on county change, search
  filtering, defaults handling, run lifecycle.
- `src/components/hazard/hazard-components.test.tsx` — rendered behaviour.
- `src/test/design-tokens.test.ts` — reads `styles.css`; the guard described above.
- `src/lib/geo.test.ts` — the 200 km scale invariant, Web Mercator ground
  resolution, Leaflet's scale rounding, county extents (including that each is
  county-sized rather than a geocoded point), and the tile source's attribution.

There is no paid eval lane, because nothing in this app calls a model. The
scoring is arithmetic, so it gets unit tests rather than an eval threshold. Add
an eval suite alongside the first LLM-backed feature, not before it.

## Built with Lovable

Continue developing this project in the
[Lovable editor](https://lovable.dev/projects/dcdbe77d-4e78-4349-8e24-ef0235cc45ad).
Every change made in Lovable commits straight to this repository, and pushing to
`main` on GitHub syncs back into Lovable.
