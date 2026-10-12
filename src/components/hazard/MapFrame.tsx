
import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2 } from "lucide-react";
import type { GeoJSON as LeafletGeoJSON, Map as LeafletMap, TileLayer } from "leaflet";
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
  subCounty?: string;
  ward?: string;
  status: "idle" | "running" | "done" | "error";
  hazard?: "flood" | "drought" | "landslide";
  className?: string;
}

interface BoundaryCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: GeoJSON.Geometry | null;
    properties?: Record<string, unknown>;
  }>;
  count?: number;
}

const API_BASE_URL = "http://127.0.0.1:8000/api";
const GEOSERVER_URL = "http://192.168.0.40:8080/geoserver";

const GEOSERVER_WMS_URL = `${GEOSERVER_URL}/wms`;
const FLOOD_LAYER = "TanaRiver_Floods:TanaRiver_Flood_Hotspots";
const WARD_LAYER = "Rangelands:wards";

const TANA_RIVER_BOUNDS: [[number, number], [number, number]] = [
  [-3.0729, 38.4342],
  [-0.0155, 40.7306],
];

const isAll = (value: string | undefined) =>
  !value || value.trim().toLowerCase() === "all";

export function MapFrame({
  county,
  subCounty = "all",
  ward = "all",
  status,
  hazard = "flood",
  className = "",
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const basemapLayer = useRef<TileLayer | null>(null);
  const floodLayer = useRef<TileLayer | null>(null);
  const wardLayer = useRef<TileLayer | null>(null);
  const boundaryLayer = useRef<LeafletGeoJSON | null>(null);
  const requestId = useRef(0);

  const [failed, setFailed] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [framed, setFramed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const scaleKm = Math.round(
    scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM) / 1000,
  );

  /*
   * Initialize Leaflet once and add a layer selector.
   * Native title attributes provide browser tooltips on hover.
   */
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function initializeMap() {
      try {
        const L = await import("leaflet");

        if (cancelled || !holder.current || map.current) return;

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

        const osm = L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: TILE_MAX_ZOOM,
        });

        const flood = L.tileLayer.wms(GEOSERVER_WMS_URL, {
          layers: FLOOD_LAYER,
          format: "image/png",
          transparent: true,
          version: "1.1.1",
          opacity: 0.75,
          tiled: true,
          attribution: "Flood data · Sentinel Watch GeoServer",
        });

        const wards = L.tileLayer.wms(GEOSERVER_WMS_URL, {
          layers: WARD_LAYER,
          format: "image/png",
          transparent: true,
          version: "1.1.1",
          opacity: 0.85,
          tiled: true,
          attribution: "Ward boundaries · Sentinel Watch GeoServer",
        });

        osm.addTo(instance);

        if (hazard === "flood") {
          flood.addTo(instance);
        }

        const layersControl = L.control
          .layers(
            {
              "OpenStreetMap": osm,
            },
            {
              "Flood Hotspots": flood,
              "Ward Boundaries": wards,
            },
            {
              collapsed: true,
              position: "topright",
            },
          )
          .addTo(instance);

        /*
         * Add helpful hover tooltips to the layer-control icon
         * and each named layer option.
         */
        const controlElement = layersControl.getContainer();

        const controlToggle = controlElement.querySelector(
          ".leaflet-control-layers-toggle",
        );

        controlToggle?.setAttribute("title", "Map layers");
        controlToggle?.setAttribute("aria-label", "Map layers");

        controlElement
          .querySelectorAll<HTMLLabelElement>(".leaflet-control-layers label")
          .forEach((label) => {
            const name = label.textContent?.trim();

            if (name) {
              label.setAttribute("title", name);
            }
          });

        L.control
          .scale({
            metric: true,
            imperial: false,
            maxWidth: SCALE_MAX_WIDTH_PX,
          })
          .addTo(instance);

        basemapLayer.current = osm;
        floodLayer.current = flood;
        wardLayer.current = wards;
        map.current = instance;

        const resize = () => instance.invalidateSize();
        const observer = new ResizeObserver(resize);

        if (holder.current) {
          observer.observe(holder.current);
        }

        requestAnimationFrame(resize);
        setReady(true);

        cleanup = () => {
          observer.disconnect();
          boundaryLayer.current = null;
          basemapLayer.current = null;
          floodLayer.current = null;
          wardLayer.current = null;
          instance.remove();
          map.current = null;
          setReady(false);
        };
      } catch (error) {
        console.error("Failed to initialize hazard map:", error);

        if (!cancelled) setFailed(true);
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      requestId.current += 1;
      cleanup?.();
    };
  }, []);

  /*
   * Keep the flood overlay consistent with the selected hazard.
   */
  useEffect(() => {
    const instance = map.current;
    const layer = floodLayer.current;

    if (!ready || !instance || !layer) return;

    if (hazard === "flood") {
      if (!instance.hasLayer(layer)) layer.addTo(instance);
    } else if (instance.hasLayer(layer)) {
      instance.removeLayer(layer);
    }
  }, [hazard, ready]);

  /*
   * Fetch the selected administrative boundary, draw its geometry,
   * and zoom to its real extent.
   */
  useEffect(() => {
    const instance = map.current;

    if (!ready || !instance) return;

    const currentRequest = ++requestId.current;
    const selectedCounty = county.trim();
    const selectedSubCounty = subCounty.trim();
    const selectedWard = ward.trim();

    async function frameSelection() {
      setBoundaryError(null);

      if (isAll(selectedCounty)) {
        if (
          boundaryLayer.current &&
          instance.hasLayer(boundaryLayer.current)
        ) {
          instance.removeLayer(boundaryLayer.current);
        }

        boundaryLayer.current = null;

        instance.flyTo(
          [KENYA_CENTER.lat, KENYA_CENTER.lon],
          KENYA_ZOOM,
          { duration: 0.8 },
        );

        setFramed(null);
        return;
      }

      let level: "county" | "subcounty" | "ward" = "county";

      if (!isAll(selectedWard)) {
        level = "ward";
      } else if (!isAll(selectedSubCounty)) {
        level = "subcounty";
      }

      const params = new URLSearchParams({
        level,
        county: selectedCounty,
      });

      if (level === "subcounty" || level === "ward") {
        params.set("subcounty", selectedSubCounty);
      }

      if (level === "ward") {
        params.set("ward", selectedWard);
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/locations/boundaries/?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(
            `Boundary request failed with HTTP ${response.status}`,
          );
        }

        const collection =
          (await response.json()) as BoundaryCollection;

        if (currentRequest !== requestId.current) return;

        if (
          collection.type !== "FeatureCollection" ||
          !Array.isArray(collection.features) ||
          collection.features.length === 0
        ) {
          throw new Error(
            `No ${level} boundary was returned for the selected location.`,
          );
        }

        const L = await import("leaflet");

        if (currentRequest !== requestId.current) return;

        const validFeatures = collection.features.filter(
          (feature) => feature.geometry !== null,
        );

        if (validFeatures.length === 0) {
          throw new Error("The returned boundary has no valid geometry.");
        }

        const geoJsonLayer = L.geoJSON(
          {
            type: "FeatureCollection",
            features: validFeatures,
          },
          {
            style: {
              color: "#0f766e",
              weight: 2,
              opacity: 1,
              fillColor: "#14b8a6",
              fillOpacity: 0.08,
            },
          },
        );

        const bounds = geoJsonLayer.getBounds();

        if (!bounds.isValid()) {
          throw new Error("The selected boundary has invalid map bounds.");
        }

        if (boundaryLayer.current) {
          instance.removeLayer(boundaryLayer.current);
        }

        boundaryLayer.current = geoJsonLayer;
        geoJsonLayer.addTo(instance);

        instance.flyToBounds(bounds, {
          padding: [24, 24],
          duration: 0.8,
          maxZoom: level === "ward" ? 13 : level === "subcounty" ? 11 : 10,
        });

        if (level === "ward") {
          setFramed(`${selectedWard} Ward`);
        } else if (level === "subcounty") {
          setFramed(`${selectedSubCounty} Sub County`);
        } else {
          setFramed(`${selectedCounty} County`);
        }
      } catch (error) {
        if (currentRequest !== requestId.current) return;

        console.error("Could not frame selected boundary:", error);

        if (level === "county") {
          if (selectedCounty.toLowerCase() === "tana river") {
            instance.flyToBounds(TANA_RIVER_BOUNDS, {
              padding: [24, 24],
              duration: 0.8,
            });

            setFramed(`${selectedCounty} County`);
            setBoundaryError(null);
            return;
          }

          const bounds = countyBounds(selectedCounty);

          if (bounds) {
            instance.flyToBounds(
              [
                [bounds[0][0], bounds[0][1]],
                [bounds[1][0], bounds[1][1]],
              ],
              { padding: [24, 24], duration: 0.8 },
            );

            setFramed(`${selectedCounty} County`);
            setBoundaryError(null);
            return;
          }
        }

        setBoundaryError(
          error instanceof Error
            ? error.message
            : "Unable to load the selected boundary.",
        );
      }
    }

    void frameSelection();

    return () => {
      requestId.current += 1;
    };
  }, [county, subCounty, ward, ready]);

  function showKenya() {
    requestId.current += 1;

    const instance = map.current;
    if (!instance) return;

    if (boundaryLayer.current) {
      instance.removeLayer(boundaryLayer.current);
      boundaryLayer.current = null;
    }

    instance.flyTo(
      [KENYA_CENTER.lat, KENYA_CENTER.lon],
      KENYA_ZOOM,
      { duration: 0.8 },
    );

    setFramed(null);
    setBoundaryError(null);
  }

  const isFlood = hazard === "flood";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-border bg-map shadow-sm xl:rounded-b-none xl:border-b-0 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/60 px-4 py-2.5 backdrop-blur">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold tracking-tight">
            {framed ?? "Kenya"}
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
          title="Reset map to Kenya"
          aria-label="Reset map to Kenya"
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
              ? `${hazard} hazard map of ${framed}, Kenya`
              : `${hazard} hazard map of Kenya`
          }
          className="size-full"
        />

        {failed && (
          <div className="absolute inset-0 z-[600] grid place-items-center bg-card px-6 text-center">
            <div className="max-w-xs">
              <p className="font-display text-sm font-semibold">
                Map unavailable
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The basemap or map initialization failed. Check the browser
                console for details.
              </p>
            </div>
          </div>
        )}

        {boundaryError && !failed && (
          <div className="absolute left-3 right-3 top-3 z-[550] rounded-md border border-destructive/30 bg-card/95 px-3 py-2 text-xs text-foreground shadow-sm">
            <p className="font-medium">Boundary could not be loaded</p>
            <p className="mt-1 text-muted-foreground">{boundaryError}</p>
          </div>
        )}

        {isFlood && status === "running" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex items-center gap-2 bg-card/90 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Loader2 className="size-4 animate-spin" />
            Running flood calculation…
          </div>
        )}

        {isFlood && status === "done" && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-md border border-border bg-card/90 px-3 py-2 text-xs text-foreground shadow-sm backdrop-blur-sm">
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
