/**
 * Geography and map-scale arithmetic. Pure and DOM-free, so the scale claim the
 * UI makes is a tested invariant rather than a comment next to a magic number.
 *
 * Coordinates below were looked up against Nominatim (OpenStreetMap's geocoder)
 * rather than recalled, and each one resolved to a `boundary/administrative`
 * feature. Worth noting why that mattered: a free-text query for "Baringo
 * County, Kenya" returns an estate agent's office in Kabarnet, and Nominatim has
 * no county-level boundary under that name at all — it only resolves as a
 * first-level subdivision (`featureType=state`).
 */

export interface LatLng {
  lat: number;
  lon: number;
}

/** South-west then north-east corner, the order Leaflet's LatLngBounds takes. */
export type Bounds = readonly [readonly [number, number], readonly [number, number]];

/** Kenya's full extent, used for the default view. */
export const KENYA_BOUNDS: Bounds = [
  [-4.68, 33.91],
  [4.62, 41.91],
];

export const KENYA_CENTER: LatLng = {
  lat: (KENYA_BOUNDS[0][0] + KENYA_BOUNDS[1][0]) / 2,
  lon: (KENYA_BOUNDS[0][1] + KENYA_BOUNDS[1][1]) / 2,
};

/**
 * The default zoom, chosen so the scale bar reads 200 km at Kenya's latitude.
 * `scaleBarMetres` is the derivation, and the unit tests hold it to 200 km, so
 * this cannot drift silently.
 */
export const KENYA_ZOOM = 6;

/** Width the scale control is allowed, in CSS pixels. Feeds the rounding below. */
export const SCALE_MAX_WIDTH_PX = 100;

/**
 * County extents, for panning when the analyst changes scope. Sourced as above;
 * these are administrative boundaries, not settlement points, so a county the
 * size of Baringo frames correctly instead of centring on its main town.
 */
export const COUNTY_BOUNDS: Record<string, Bounds> = {
  Nairobi: [
    [-1.4448822, 36.6647016],
    [-1.1606749, 37.1048735],
  ],
  Kisumu: [
    [-0.416827, 34.4169364],
    [0.0226311, 35.343328],
  ],
  Baringo: [
    [-0.2264637, 35.5234935],
    [1.654467, 36.4895072],
  ],
  "Murang'a": [
    [-1.0960447, 36.7064872],
    [-0.5673347, 37.4213309],
  ],
};

export function countyBounds(county: string): Bounds | null {
  return COUNTY_BOUNDS[county] ?? null;
}

const EARTH_CIRCUMFERENCE_M = 40075016.686;

/**
 * Ground resolution of a Web Mercator tile pyramid: metres covered by one CSS
 * pixel. Shrinks with latitude, which is why the scale bar is only meaningful
 * for a stated latitude.
 */
export function metresPerPixel(lat: number, zoom: number): number {
  return (EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8);
}

/**
 * What Leaflet's scale control will actually print, in metres: the largest
 * 1/2/3/5 x 10^n that still fits inside `maxWidthPx`. Reimplemented here (it is
 * ten lines) so the app's headline scale figure is asserted by a unit test
 * instead of read off a screenshot.
 */
export function scaleBarMetres(
  lat: number,
  zoom: number,
  maxWidthPx: number = SCALE_MAX_WIDTH_PX,
): number {
  const span = metresPerPixel(lat, zoom) * maxWidthPx;
  const pow10 = 10 ** Math.floor(Math.log10(span));
  const d = span / pow10;
  const nice = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
  return pow10 * nice;
}

/**
 * OpenStreetMap's public tile server.
 *
 * Its usage policy forbids production or heavy use, and the ODbL requires the
 * attribution below to stay visible. Both are why this is documented in the
 * README as a demo-only default: a deployment needs a commercial provider or a
 * self-hosted renderer, which is a change of these two constants and nothing
 * else.
 */
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** OSM raster tiles stop at 19. */
export const TILE_MAX_ZOOM = 19;
