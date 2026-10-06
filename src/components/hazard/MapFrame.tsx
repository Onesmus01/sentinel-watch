import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2 } from "lucide-react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
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
  status: "idle" | "running" | "done" | "error";
  hazard?: "flood" | "drought" | "landslide";
  className?: string;
}

const GEOSERVER_WMS_URL =
  "http://192.168.0.40:8080/geoserver/TanaRiver_Floods/wms";

const FLOOD_LAYER = "TanaRiver_Floods:TanaRiver_Flood_Hotspots";

const TANA_RIVER_BOUNDS: [[number, number], [number, number]] = [
  [-3.0729, 38.4342],
  [-0.0155, 40.7306],
];

export function MapFrame({
  county,
  status,
  hazard = "flood",
  className = "",
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const floodLayer = useRef<TileLayer | null>(null);

  const [failed, setFailed] = useState(false);
  const [framed, setFramed] = useState<string | null>(null);

  const scaleKm = Math.round(
    scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM) / 1000,
  );

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const L = await import("leaflet");

        if (cancelled || !holder.current || map.current) {
          return;
        }

        const instance = L.map(holder.current, {
          center: [KENYA_CENTER.lat, KENYA_CENTER.lon],
          zoom: KENYA_ZOOM,
          maxBounds: [
            [-12, 26],
            [12, 50],
          ],
          maxBoundsViscosity: 0.8,
          minZoom: 5,
          maxZoom: TILE_MAX_ZOOM,
          scrollWheelZoom: false,
          attributionControl: true,
        });

        /*
         * OpenStreetMap basemap.
         */
        L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: TILE_MAX_ZOOM,
        }).addTo(instance);

        /*
         * REAL GEOSERVER FLOOD WMS
         *
         * GeoServer performs the raster reprojection from the model CRS
         * into the normal Leaflet Web Mercator map.
         */
        const wms = L.tileLayer.wms(GEOSERVER_WMS_URL, {
          layers: FLOOD_LAYER,
          format: "image/png",
          transparent: true,
          version: "1.1.1",
          opacity: 0.75,
          tiled: true,
          attribution: "Flood data · Sentinel Watch GeoServer",
        });

        if (hazard === "flood") {
          wms.addTo(instance);
          floodLayer.current = wms;
        }

        L.control
          .scale({
            metric: true,
            imperial: false,
            maxWidth: SCALE_MAX_WIDTH_PX,
          })
          .addTo(instance);

        map.current = instance;

        const resize = () => instance.invalidateSize();

        const observer = new ResizeObserver(resize);
        observer.observe(holder.current);

        requestAnimationFrame(resize);

        cleanup = () => {
          observer.disconnect();
          floodLayer.current = null;
          instance.remove();
          map.current = null;
        };
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [hazard]);

  /*
   * Change the GeoServer flood layer when the selected hazard changes.
   */
  useEffect(() => {
    const instance = map.current;
    const layer = floodLayer.current;

    if (!instance || !layer) return;

    if (hazard === "flood") {
      if (!instance.hasLayer(layer)) {
        layer.addTo(instance);
      }
    } else {
      if (instance.hasLayer(layer)) {
        instance.removeLayer(layer);
      }
    }
  }, [hazard]);

  /*
   * Frame the selected county.
   *
   * Tana River uses the verified real GeoJSON bounds from the flood
   * calculation input. Other counties continue using the existing
   * county bounds until their GIS layers are connected.
   */
  useEffect(() => {
    const instance = map.current;

    if (!instance) return;

    if (county === "Tana River") {
      instance.flyToBounds(TANA_RIVER_BOUNDS, {
        padding: [24, 24],
        duration: 0.8,
      });

      setFramed("Tana River");
      return;
    }

    const bounds = countyBounds(county);

    if (!bounds) return;

    instance.flyToBounds(
      [
        [bounds[0][0], bounds[0][1]],
        [bounds[1][0], bounds[1][1]],
      ],
      {
        padding: [24, 24],
        duration: 0.8,
      },
    );

    setFramed(county);
  }, [county]);

  function showKenya() {
    map.current?.flyTo(
      [KENYA_CENTER.lat, KENYA_CENTER.lon],
      KENYA_ZOOM,
      { duration: 0.8 },
    );

    setFramed(null);
  }

  const isFlood = hazard === "flood";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-border bg-map shadow-sm xl:rounded-b-none xl:border-b-0 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/60 px-4 py-2.5 backdrop-blur">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-tight">
            {framed ? `${framed} County` : "Kenya"}
          </p>

          <p className="text-xs text-muted-foreground">
            {isFlood
              ? "OpenStreetMap · Flood hotspot layer from GeoServer"
              : "OpenStreetMap basemap"}
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

      <div className="relative aspect-4/3 w-full sm:aspect-16/10 xl:aspect-auto xl:min-h-[18rem] xl:flex-1">
        <div
          ref={holder}
          role="application"
          aria-label={
            framed
              ? `${hazard} hazard map of ${framed} County, Kenya`
              : `${hazard} hazard map of Kenya`
          }
          className="size-full"
        />

        {failed && (
          <div className="absolute inset-0 grid place-items-center bg-card px-6 text-center">
            <div className="max-w-xs">
              <p className="font-display text-sm font-semibold">
                Map unavailable
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                The basemap or GeoServer layer could not be loaded.
              </p>
            </div>
          </div>
        )}

        {isFlood && status === "running" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex items-center gap-2 bg-card/90 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Loader2 className="size-4 animate-spin" />
            Running flood calculation…
          </div>
        )}

        {isFlood && status === "done" && (
          <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-md border border-border bg-card/90 px-3 py-2 text-xs text-foreground shadow-sm backdrop-blur-sm">
            <span className="font-medium">Flood hotspots</span>
            <span className="ml-1.5 text-muted-foreground">
              GeoServer layer
            </span>
          </div>
        )}
      </div>
    </div>
  );
}