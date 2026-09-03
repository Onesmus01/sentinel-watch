import { describe, expect, it } from "vitest";
import { COUNTIES } from "./hazard-model";
import {
  COUNTY_BOUNDS,
  KENYA_BOUNDS,
  KENYA_CENTER,
  KENYA_ZOOM,
  SCALE_MAX_WIDTH_PX,
  TILE_ATTRIBUTION,
  TILE_MAX_ZOOM,
  TILE_URL,
  countyBounds,
  metresPerPixel,
  scaleBarMetres,
} from "./geo";

describe("the default view opens Kenya at a 200 km scale", () => {
  it("prints exactly 200 km on the scale bar at the default zoom", () => {
    // The headline requirement, asserted rather than eyeballed off a
    // screenshot. Change KENYA_ZOOM and this is what objects.
    expect(scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM)).toBe(200_000);
  });

  it("is the only nearby zoom that does, so the constant is not arbitrary", () => {
    expect(scaleBarMetres(KENYA_CENTER.lat, 5)).toBe(300_000);
    expect(scaleBarMetres(KENYA_CENTER.lat, 7)).toBe(100_000);
  });

  it("fits the whole country in the frame at that zoom", () => {
    // A 200 km bar is no use if Kenya does not fit beside it. The map frame is
    // an aspect-ratio box, in practice 600-900px wide on a desktop column.
    const mpp = metresPerPixel(KENYA_CENTER.lat, KENYA_ZOOM);
    const widthPx = ((widthDegrees() / 360) * 40075016.686 * Math.cos(rad(KENYA_CENTER.lat))) / mpp;
    const heightPx = (((KENYA_BOUNDS[1][0] - KENYA_BOUNDS[0][0]) / 360) * 40075016.686) / mpp;
    expect(widthPx).toBeLessThan(600);
    expect(heightPx).toBeLessThan(600);
    // And not so far out that the country is a speck.
    expect(widthPx).toBeGreaterThan(250);
  });

  it("centres inside Kenya's own bounds", () => {
    expect(KENYA_CENTER.lat).toBeGreaterThan(KENYA_BOUNDS[0][0]);
    expect(KENYA_CENTER.lat).toBeLessThan(KENYA_BOUNDS[1][0]);
    expect(KENYA_CENTER.lon).toBeGreaterThan(KENYA_BOUNDS[0][1]);
    expect(KENYA_CENTER.lon).toBeLessThan(KENYA_BOUNDS[1][1]);
  });
});

const rad = (d: number) => (d * Math.PI) / 180;
const widthDegrees = () => KENYA_BOUNDS[1][1] - KENYA_BOUNDS[0][1];

describe("metresPerPixel", () => {
  it("halves with each zoom level", () => {
    for (let z = 4; z < 12; z++) {
      expect(metresPerPixel(0, z) / metresPerPixel(0, z + 1)).toBeCloseTo(2, 10);
    }
  });

  it("matches the known equatorial value at zoom 0", () => {
    // 40075016.686 / 256 = 156543.03 m/px, the standard figure.
    expect(metresPerPixel(0, 0)).toBeCloseTo(156543.03, 1);
  });

  it("shrinks away from the equator", () => {
    expect(metresPerPixel(60, 6)).toBeLessThan(metresPerPixel(0, 6));
    expect(metresPerPixel(60, 6)).toBeCloseTo(metresPerPixel(0, 6) * Math.cos(rad(60)), 6);
  });

  it("is positive everywhere the map can go", () => {
    for (const lat of [-85, -45, 0, 45, 85]) {
      for (let z = 0; z <= TILE_MAX_ZOOM; z++) {
        expect(metresPerPixel(lat, z)).toBeGreaterThan(0);
      }
    }
  });
});

describe("scaleBarMetres", () => {
  it("only ever returns a 1/2/3/5 x 10^n figure, as Leaflet does", () => {
    const allowed = new Set([1, 2, 3, 5, 10]);
    for (let z = 0; z <= TILE_MAX_ZOOM; z++) {
      for (const lat of [-40, 0, 12, 51]) {
        const m = scaleBarMetres(lat, z);
        const lead = m / 10 ** Math.floor(Math.log10(m));
        expect(allowed.has(Math.round(lead)), `zoom ${z} lat ${lat} gave ${m}`).toBe(true);
      }
    }
  });

  it("never claims a bar wider than the space it is given", () => {
    for (let z = 2; z <= TILE_MAX_ZOOM; z++) {
      const span = metresPerPixel(KENYA_CENTER.lat, z) * SCALE_MAX_WIDTH_PX;
      expect(scaleBarMetres(KENYA_CENTER.lat, z)).toBeLessThanOrEqual(span);
    }
  });

  it("shrinks monotonically as you zoom in", () => {
    let previous = Infinity;
    for (let z = 3; z <= 15; z++) {
      const m = scaleBarMetres(KENYA_CENTER.lat, z);
      expect(m).toBeLessThanOrEqual(previous);
      previous = m;
    }
  });

  it("scales with the width it is allowed", () => {
    expect(scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM, 200)).toBeGreaterThan(
      scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM, 100),
    );
  });
});

describe("county extents", () => {
  it("covers every county the dataset offers", () => {
    // A county with no bounds would silently fail to pan, which looks like a
    // broken map rather than missing data.
    for (const c of COUNTIES) {
      expect(countyBounds(c.name), `no bounds for ${c.name}`).not.toBeNull();
    }
    expect(Object.keys(COUNTY_BOUNDS).sort()).toEqual(COUNTIES.map((c) => c.name).sort());
  });

  it("returns null for an unknown county rather than throwing", () => {
    expect(countyBounds("Atlantis")).toBeNull();
  });

  it("orders each box south-west corner first, as Leaflet expects", () => {
    for (const [name, [[s, w], [n, e]]] of Object.entries(COUNTY_BOUNDS)) {
      expect(s, `${name} latitudes inverted`).toBeLessThan(n);
      expect(w, `${name} longitudes inverted`).toBeLessThan(e);
    }
  });

  it("sits every county inside Kenya", () => {
    for (const [name, [[s, w], [n, e]]] of Object.entries(COUNTY_BOUNDS)) {
      expect(s, `${name} south`).toBeGreaterThanOrEqual(KENYA_BOUNDS[0][0]);
      expect(n, `${name} north`).toBeLessThanOrEqual(KENYA_BOUNDS[1][0]);
      expect(w, `${name} west`).toBeGreaterThanOrEqual(KENYA_BOUNDS[0][1]);
      expect(e, `${name} east`).toBeLessThanOrEqual(KENYA_BOUNDS[1][1]);
    }
  });

  it("gives every county a county-sized extent, not a point", () => {
    // The guard against the bug the lookup actually hit: a free-text geocode
    // for Baringo returned an estate agent's office, whose bounding box is
    // 0.0001 degrees across.
    for (const [name, [[s, w], [n, e]]] of Object.entries(COUNTY_BOUNDS)) {
      expect(n - s, `${name} is too short to be a county`).toBeGreaterThan(0.2);
      expect(e - w, `${name} is too narrow to be a county`).toBeGreaterThan(0.2);
      // And not implausibly large for one of 47 counties.
      expect(n - s, `${name} is too tall to be a county`).toBeLessThan(4);
      expect(e - w, `${name} is too wide to be a county`).toBeLessThan(4);
    }
  });

  it("frames each county closer than the national view", () => {
    const kenyaSpan =
      (KENYA_BOUNDS[1][0] - KENYA_BOUNDS[0][0]) * (KENYA_BOUNDS[1][1] - KENYA_BOUNDS[0][1]);
    for (const [name, [[s, w], [n, e]]] of Object.entries(COUNTY_BOUNDS)) {
      expect((n - s) * (e - w), `${name} is not a zoom-in`).toBeLessThan(kenyaSpan);
    }
  });
});

describe("tile source", () => {
  it("is an https OSM raster template with the z/x/y placeholders", () => {
    expect(TILE_URL).toMatch(/^https:\/\//);
    for (const token of ["{z}", "{x}", "{y}"]) {
      expect(TILE_URL).toContain(token);
    }
  });

  it("credits OpenStreetMap and links the copyright page", () => {
    // The ODbL requires this, so it is a test and not a preference.
    expect(TILE_ATTRIBUTION).toMatch(/OpenStreetMap/);
    expect(TILE_ATTRIBUTION).toContain("openstreetmap.org/copyright");
    expect(TILE_ATTRIBUTION).toMatch(/contributors/);
  });

  it("does not embed an API key", () => {
    expect(TILE_URL).not.toMatch(/key=|token=|access_token|apikey/i);
  });

  it("stops at the deepest zoom OSM raster tiles publish", () => {
    expect(TILE_MAX_ZOOM).toBe(19);
    expect(KENYA_ZOOM).toBeLessThan(TILE_MAX_ZOOM);
  });
});
