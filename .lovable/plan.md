# Hazard Monitoring Dashboard — Design Build

Front-end only. No backend, no external map service. Every value is demo data so the interface can be judged on its own.

## Screens

**Dashboard (`/`)**
- Heading bar at the top: product name, region label, and a status strip (last run time, data source note).
- Left vertical navbar (collapsible, becomes a slide-over drawer on mobile) containing, top to bottom:
  - Location search, then County, Sub-County and Ward selects that filter down in sequence.
  - Hazards list — Flood, Drought, Landslide — as selectable toggles.
  - Parameters list — Gradient, Rainfall, Temperature, Humidity — each a slider with a numeric field, a unit and its default value. A "System defaults" switch locks them to defaults; turning it off unlocks manual adjustment, and a "Reset to defaults" link restores them.
  - Run button pinned to the bottom of the navbar, showing a short calculating state before results appear.
- Center map frame: a stylized vector map of the selected county broken into ward polygons. After Run, each ward is shaded by its computed risk class with a soft transition. Hovering a ward shows a tooltip with its name, risk class and score.
- Legend/key beside the map: five risk classes (Very Low, Low, Moderate, High, Severe) with their color swatches, plus the hazard currently displayed.
- Right-side or below-map summary cards: wards at high risk, top-ranked ward, average score — updating with each run.
- Footer: organisation line, data disclaimer, and quiet links.

**Download Reports (`/reports`)**
- Form to request a report: hazard, area scope, date range, format (PDF or CSV), and optional notes.
- Requested reports table with name, scope, format, timestamp, status chip (Preparing / Ready) and a Download action. Demo entries are pre-filled; a new request appends a row that flips to Ready.

## Design direction

Professional operations-console look, not a consumer app.
- Palette: deep slate navy chrome with a clean light workspace; a single teal accent for interactive elements. Risk classes get their own dedicated sequential ramp (green → yellow → amber → orange-red → deep red) kept separate from UI accents so the map key stays unambiguous.
- Typography: a geometric sans for headings paired with a highly legible sans for body and data.
- Density: compact controls, clear section dividers in the navbar, generous space around the map so it reads as the focal point.
- Motion: restrained — shading fades in on Run, tooltips and drawer transitions only.

## Responsiveness

- Desktop: three zones — navbar, map, key/summary.
- Tablet: navbar collapses to icons plus a drawer; key moves under the map.
- Mobile: single column — heading, control drawer trigger, map, key, summary, footer. Run stays reachable as a sticky action.

## Technical notes

- New routes: `src/routes/index.tsx` (dashboard) and `src/routes/reports.tsx`, each with its own head metadata.
- Components under `src/components/hazard/`: `AppHeader`, `ControlSidebar`, `LocationFilters`, `HazardSelector`, `ParameterControls`, `MapFrame`, `MapLegend`, `ResultSummary`, `SiteFooter`.
- Shared UI state in a single `useHazardModel` hook: selections, parameters, defaults flag, run status, results.
- Map is an inline SVG of ward polygons with demo geometry — no Google Maps or Mapbox, so nothing to connect.
- Run computes a weighted demo score per ward from the four parameters and maps it to a risk class; the formula is deliberately illustrative and easy to swap for real logic later.
- All colors, including the risk ramp, added as tokens in `src/styles.css` and used through semantic classes.
