import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2 } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  KENYA_CENTER,
  KENYA_ZOOM,
  SCALE_MAX_WIDTH_PX,
  TILE_ATTRIBUTION,
  TILE_MAX_ZOOM,
  TILE_URL,
  countyBounds,
  scaleBarMetres,
} from "@/lib/geo";

interface Props {
  county: string;
  status: "idle" | "running" | "done";
}

/**
 * OpenStreetMap basemap, opening on Kenya at a 200 km scale.
 *
 * Deliberately a basemap and nothing else. The dataset carries no geometry:
 * ward "shapes" were seeded pseudo-random hexagons on an abstract grid, and
 * drawing those over real Kenyan terrain would present fabricated positions as
 * geospatial output. Risk stays where it can be read honestly — the legend and
 * the ward table. The overlay lands when real ward boundaries do.
 *
 * Leaflet reads `window` at import time and this app server-renders, so the
 * library is imported dynamically inside the effect. Only its stylesheet is
 * imported statically, which Vite handles without touching the DOM.
 */
export function MapFrame({ county, status }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [failed, setFailed] = useState(false);

  // What the map is actually framing, which is not the same as what is
  // selected. It opens on the whole country, so captioning it with the
  // selected county would name a place the reader is not looking at — the same
  // mismatch the ward caption had before it was sourced from its own data.
  const [framed, setFramed] = useState<string | null>(null);

  // The figure the scale control will print, derived rather than hardcoded, so
  // the caption cannot claim a scale the map is not showing.
  const scaleKm = Math.round(scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM) / 1000);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const L = await import("leaflet");
        if (cancelled || !holder.current || map.current) return;

        const instance = L.map(holder.current, {
          center: [KENYA_CENTER.lat, KENYA_CENTER.lon],
          zoom: KENYA_ZOOM,
          // Kenya is the subject; there is no reason to let someone scroll to
          // Peru and lose it.
          maxBounds: [
            [-12, 26],
            [12, 50],
          ],
          maxBoundsViscosity: 0.8,
          minZoom: 5,
          maxZoom: TILE_MAX_ZOOM,
          // Wheel zoom over a page-scrolling column hijacks the scroll; Ctrl or
          // the +/- control is explicit.
          scrollWheelZoom: false,
          attributionControl: true,
        });

        L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: TILE_MAX_ZOOM,
        }).addTo(instance);

        // Metric only: an imperial bar alongside would make "200 km" ambiguous.
        L.control
          .scale({ metric: true, imperial: false, maxWidth: SCALE_MAX_WIDTH_PX })
          .addTo(instance);

        map.current = instance;

        // The container is an aspect-ratio box, so its height arrives after
        // layout. Without this the first paint is a 0px-tall map.
        const resize = () => instance.invalidateSize();
        const observer = new ResizeObserver(resize);
        observer.observe(holder.current);
        requestAnimationFrame(resize);

        cleanup = () => {
          observer.disconnect();
          instance.remove();
          map.current = null;
        };
      } catch {
        // A blocked tile host or a failed chunk should degrade to a message,
        // not a blank rectangle with no explanation.
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // Follow the scope. fitBounds on the real administrative extent rather than
  // a fixed zoom on a centroid, so Baringo (1.9 degrees tall) and Nairobi
  // (0.3) each frame correctly.
  useEffect(() => {
    const instance = map.current;
    const bounds = countyBounds(county);
    if (!instance || !bounds) return;
    // Copied into a mutable literal: the constant is readonly on purpose, and
    // Leaflet's LatLngBoundsLiteral is not.
    instance.flyToBounds(
      [
        [bounds[0][0], bounds[0][1]],
        [bounds[1][0], bounds[1][1]],
      ],
      { padding: [24, 24], duration: 0.8 },
    );
    setFramed(county);
    // Runs before the map exists on first mount, returning early, which is what
    // leaves the opening view on Kenya rather than snapping to a county.
  }, [county]);

  function showKenya() {
    map.current?.flyTo([KENYA_CENTER.lat, KENYA_CENTER.lon], KENYA_ZOOM, { duration: 0.8 });
    setFramed(null);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-map shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/60 px-4 py-2.5 backdrop-blur">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-tight">
            {framed ? `${framed} County` : "Kenya"}
          </p>
          <p className="text-xs text-muted-foreground">
            OpenStreetMap basemap · ward risk is listed in the table below
          </p>
        </div>
        <button
          type="button"
          onClick={showKenya}
          disabled={framed === null}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors enabled:hover:bg-muted enabled:hover:text-foreground disabled:opacity-40"
        >
          <Maximize2 className="size-3" />
          Kenya · {scaleKm} km
        </button>
      </div>

      <div className="relative aspect-4/3 w-full sm:aspect-16/10">
        {/* Leaflet owns this node's children, so React must not render any. */}
        <div
          ref={holder}
          role="application"
          aria-label={
            framed ? `OpenStreetMap of ${framed} County, Kenya` : "OpenStreetMap of Kenya"
          }
          className="size-full"
        />

        {failed && (
          <div className="absolute inset-0 grid place-items-center bg-card px-6 text-center">
            <div className="max-w-xs">
              <p className="font-display text-sm font-semibold">Basemap unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The map tiles could not be loaded. Ward risk is still listed in the table below.
              </p>
            </div>
          </div>
        )}

        {status === "running" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-500 flex items-center gap-2 bg-card/90 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Loader2 className="size-4 animate-spin" />
            Calculating risk scores…
          </div>
        )}
      </div>
    </div>
  );
}
