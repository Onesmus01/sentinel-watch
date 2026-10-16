import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  Droplets,
  Layers3,
  Loader2,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import type {
  GeoJSON as LeafletGeoJSON,
  Map as LeafletMap,
  TileLayer,
} from "leaflet";
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

interface BoundaryFeature {
  type: "Feature";
  geometry: GeoJSON.Geometry | null;
  properties?: Record<string, unknown>;
}

interface BoundaryCollection {
  type: "FeatureCollection";
  features: BoundaryFeature[];
  count?: number;
}

const DJANGO_API_URL = (
  import.meta.env.VITE_DJANGO_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");
const API_BASE_URL = `${DJANGO_API_URL}/api`;

const GEOSERVER_WMS_URL = (
  import.meta.env.VITE_GEOSERVER_WMS_URL ||
  "http://192.168.0.40:8080/geoserver/wms"
).replace(/\/+$/, "");

/* Override in the frontend environment if workspace/layer names differ. */
const FLOOD_LAYER =
  import.meta.env.VITE_GEOSERVER_FLOOD_LAYER ||
  "TanaRiver_Floods:TanaRiver_Flood_Hotspots";
const WARD_LAYER =
  import.meta.env.VITE_GEOSERVER_WARD_LAYER || "Rangelands:wards";
const RAINFALL_LAYER =
  import.meta.env.VITE_GEOSERVER_RAINFALL_LAYER ||
  "Hazards_Dashboard:TanaRiver_Rainfall";
const LANDCOVER_LAYER =
  import.meta.env.VITE_GEOSERVER_LANDCOVER_LAYER ||
  "Hazards_Dashboard:TanaRiver_LULC";
const SLOPE_LAYER =
  import.meta.env.VITE_GEOSERVER_SLOPE_LAYER ||
  "Hazards_Dashboard:TanaRiver_Slope";
const RIVER_LAYER =
  import.meta.env.VITE_GEOSERVER_RIVER_LAYER ||
  "Hazards_Dashboard:TR_Rivers";

const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const TANA_RIVER_BOUNDS: [[number, number], [number, number]] = [
  [-3.0729, 38.4342],
  [-0.0155, 40.7306],
];

const RISK_CLASSES = [
  { label: "Very low", color: "#16a34a" },
  { label: "Low", color: "#a3d977" },
  { label: "Moderate", color: "#facc15" },
  { label: "High", color: "#f97316" },
  { label: "Very high", color: "#dc2626" },
];

const isAll = (value: string | undefined) =>
  !value || value.trim().toLowerCase() === "all";

const hazardLabels = {
  flood: "Flood susceptibility",
  drought: "Drought risk",
  landslide: "Landslide risk",
} as const;

/* ------------------------------------------------------------------ */
/* Styling                                                             */
/* ------------------------------------------------------------------ */

const MAP_CSS = `
.mapframe{--ink:#0b1f24;--teal:#0f766e;--teal-2:#14b8a6;--line:rgb(15 118 110/.16);font-feature-settings:"tnum" 1,"cv11" 1}
.mapframe .leaflet-container{font-family:inherit;background:#cfe3e1}
.dark .mapframe .leaflet-container{background:#0b1f24}

/* Controls: one glass language for zoom + layers */
.mapframe .leaflet-bar,.mapframe .leaflet-control-layers{
  border:1px solid rgb(255 255 255/.7)!important;border-radius:16px!important;
  background:rgb(255 255 255/.82)!important;backdrop-filter:blur(14px) saturate(1.4);
  box-shadow:0 10px 30px -8px rgb(11 31 36/.35),0 0 0 1px rgb(15 118 110/.08)!important;overflow:hidden}
.mapframe .leaflet-bar a{width:38px;height:38px;line-height:38px;color:#134e4a;border-bottom:1px solid var(--line);transition:background .15s,color .15s}
.mapframe .leaflet-bar a:last-child{border-bottom:0}
.mapframe .leaflet-bar a:hover{background:#ccfbf1;color:#0f766e}
.mapframe .leaflet-control-layers-toggle{width:42px;height:42px;background-size:22px}
.mapframe .leaflet-control-layers-expanded{padding:14px 16px;font-size:12.5px;font-weight:500;color:#134e4a;min-width:184px;max-width:calc(100vw - 96px)}
.mapframe .leaflet-control-layers label{display:block;padding:4px 0;cursor:pointer}
.mapframe .leaflet-control-layers-separator{border-top:1px solid var(--line);margin:8px -4px}
.mapframe .leaflet-control-layers input{accent-color:#0f766e;margin-right:8px}
.mapframe .leaflet-control-scale-line{border:2px solid #0f766e;border-top:0;background:rgb(255 255 255/.8);color:#134e4a;font-size:10px;font-weight:700;border-radius:0 0 6px 6px;backdrop-filter:blur(6px)}
.mapframe .leaflet-control-attribution{background:rgb(255 255 255/.75)!important;font-size:9px;border-radius:10px 0 0 0;backdrop-filter:blur(6px)}
.mapframe .leaflet-control-attribution a{color:#0f766e}
.mapframe .leaflet-container:focus-visible{outline:2px solid #14b8a6;outline-offset:-2px}

.dark .mapframe .leaflet-bar,.dark .mapframe .leaflet-control-layers{background:rgb(8 28 33/.86)!important;border-color:rgb(94 234 212/.18)!important;color:#d5f5ef}
.dark .mapframe .leaflet-bar a{background:transparent;color:#d5f5ef;border-bottom-color:rgb(94 234 212/.14)}
.dark .mapframe .leaflet-bar a:hover{background:rgb(20 184 166/.18);color:#99f6e4}
.dark .mapframe .leaflet-control-layers-expanded{color:#d5f5ef}
.dark .mapframe .leaflet-control-scale-line{background:rgb(8 28 33/.8);color:#d5f5ef;border-color:#2dd4bf}
.dark .mapframe .leaflet-control-attribution{background:rgb(8 28 33/.75)!important;color:#94a3b8}

/* Motion: only for state changes */
@keyframes mf-sweep{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@keyframes mf-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
@keyframes mf-ping{0%{box-shadow:0 0 0 0 rgb(20 184 166/.55)}100%{box-shadow:0 0 0 9px rgb(20 184 166/0)}}
.mapframe .mf-sweep{animation:mf-sweep 1.4s cubic-bezier(.4,0,.2,1) infinite}
.mapframe .mf-rise{animation:mf-rise .28s cubic-bezier(.2,.8,.2,1) both}
.mapframe .mf-ping{animation:mf-ping 1.6s ease-out infinite}
@media (prefers-reduced-motion:reduce){.mapframe .mf-sweep,.mapframe .mf-rise,.mapframe .mf-ping{animation:none}}

/* Small screens: keep map controls clear of the floating panels */
@media (max-width:639px){
  .mapframe .leaflet-bar a{width:42px;height:42px;line-height:42px}
  .mapframe .leaflet-control-attribution{max-width:60vw;white-space:normal;text-align:right}
}
`;

const glass =
  "border border-white/70 bg-white/85 shadow-[0_18px_40px_-14px_rgb(11_31_36/.45)] ring-1 ring-teal-900/5 backdrop-blur-xl backdrop-saturate-150 dark:border-teal-300/15 dark:bg-[#081c21]/85 dark:ring-white/5";

const iconBtn =
  "group inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-900/10 bg-white/80 text-teal-900 shadow-sm transition active:scale-95 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-35 dark:border-teal-300/15 dark:bg-white/5 dark:text-teal-100 dark:hover:bg-teal-400/15 dark:focus-visible:ring-offset-[#081c21]";

const STATUS_PILLS = {
  running: {
    text: "Calculating",
    cls: "bg-teal-500/10 text-teal-800 ring-teal-500/30 dark:text-teal-200",
  },
  done: {
    text: "Complete",
    cls: "bg-emerald-500/10 text-emerald-800 ring-emerald-500/30 dark:text-emerald-200",
  },
  error: {
    text: "Failed",
    cls: "bg-red-500/10 text-red-800 ring-red-500/30 dark:text-red-200",
  },
  idle: {
    text: "Ready",
    cls: "bg-slate-500/10 text-slate-700 ring-slate-500/25 dark:text-slate-300",
  },
} as const;

export function MapFrame({
  county,
  subCounty = "all",
  ward = "all",
  status,
  hazard = "flood",
  className = "",
}: Props) {
  const root = useRef<HTMLElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const map = useRef<LeafletMap | null>(null);

  const floodLayer = useRef<TileLayer | null>(null);
  const boundaryLayer = useRef<LeafletGeoJSON | null>(null);
  const requestId = useRef(0);

  const [failed, setFailed] = useState(false);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [framed, setFramed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(min-width: 640px)").matches,
  );
  const [opacity, setOpacity] = useState(82);
  const [toast, setToast] = useState(false);

  const isFlood = hazard === "flood";
  const scaleKm = Math.round(
    scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM) / 1000,
  );

  const showKenya = useCallback(() => {
    requestId.current += 1;

    const instance = map.current;
    if (!instance) return;

    if (boundaryLayer.current) {
      instance.removeLayer(boundaryLayer.current);
      boundaryLayer.current = null;
    }

    instance.flyTo([KENYA_CENTER.lat, KENYA_CENTER.lon], KENYA_ZOOM, {
      duration: 0.8,
    });

    setFramed(null);
    setBoundaryError(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void root.current?.requestFullscreen?.();
    }
  }, []);

  /* Keep the map sized correctly when entering or leaving fullscreen. */
  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === root.current);
      window.setTimeout(() => {
        map.current?.invalidateSize({ pan: false });
      }, 150);
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* Initialize Leaflet once and clean up its resources on unmount. */
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let instance: LeafletMap | null = null;

    async function initializeMap() {
      try {
        const L = await import("leaflet");

        if (cancelled || !holder.current || map.current) return;

        instance = L.map(holder.current, {
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
          zoomControl: false,
        });

        map.current = instance;

        L.control.zoom({ position: "topleft" }).addTo(instance);

        const osm = L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: TILE_MAX_ZOOM,
        });

        const satellite = L.tileLayer(SATELLITE_URL, {
          attribution: "Tiles © Esri",
          maxZoom: 18,
        });

        const wms = (
          layers: string,
          layerOpacity: number,
          attribution: string,
        ) =>
          L.tileLayer.wms(GEOSERVER_WMS_URL, {
            layers,
            format: "image/png",
            transparent: true,
            version: "1.1.1",
            opacity: layerOpacity,
            tiled: true,
            attribution,
          });

        const flood = wms(
          FLOOD_LAYER,
          opacity / 100,
          "Flood hotspots · Sentinel Watch GeoServer",
        );
        const wards = wms(
          WARD_LAYER,
          0.85,
          "Ward boundaries · Sentinel Watch GeoServer",
        );
        const rainfall = wms(
          RAINFALL_LAYER,
          0.7,
          "Rainfall · Sentinel Watch GeoServer",
        );
        const landcover = wms(
          LANDCOVER_LAYER,
          0.75,
          "Land cover · Sentinel Watch GeoServer",
        );
        const slope = wms(
          SLOPE_LAYER,
          0.7,
          "Slope · Sentinel Watch GeoServer",
        );
        const rivers = wms(
          RIVER_LAYER,
          0.95,
          "River network · Sentinel Watch GeoServer",
        );

        osm.addTo(instance);

        if (hazard === "flood") {
          flood.addTo(instance);
        }

        const layersControl = L.control
          .layers(
            { "Street map": osm, Satellite: satellite },
            {
              "Flood hotspots": flood,
              Rainfall: rainfall,
              "Land cover": landcover,
              Slope: slope,
              "River network": rivers,
              "Ward boundaries": wards,
            },
            { collapsed: true, position: "topright" },
          )
          .addTo(instance);

        const toggle = layersControl
          .getContainer()
          ?.querySelector(".leaflet-control-layers-toggle");

        toggle?.setAttribute("title", "Show or hide map layers");
        toggle?.setAttribute("aria-label", "Show or hide map layers");

        L.control
          .scale({
            metric: true,
            imperial: false,
            maxWidth: SCALE_MAX_WIDTH_PX,
            position: "bottomleft",
          })
          .addTo(instance);

        instance.on("mousemove", (event) => {
          if (coords.current) {
            coords.current.textContent =
              `${event.latlng.lat.toFixed(4)}°, ` +
              `${event.latlng.lng.toFixed(4)}°`;
          }
        });

        instance.on("click", () => {
          instance?.scrollWheelZoom.enable();
        });

        instance.on("mouseout", () => {
          instance?.scrollWheelZoom.disable();
        });

        floodLayer.current = flood;

        observer = new ResizeObserver(() => {
          if (!cancelled && instance && map.current === instance) {
            instance.invalidateSize({ pan: false });
          }
        });

        observer.observe(holder.current);
        window.requestAnimationFrame(() => {
          if (!cancelled && instance && map.current === instance) {
            instance.invalidateSize({ pan: false });
          }
        });

        setFailed(false);
        setReady(true);
      } catch (error) {
        console.error("Failed to initialize hazard map:", error);

        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      requestId.current += 1;

      observer?.disconnect();

      if (instance) {
        if (map.current === instance) {
          map.current = null;
        }
        instance.remove();
      }

      boundaryLayer.current = null;
      floodLayer.current = null;
    };

    // Map creation is intentionally one-time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Show the flood layer only when the flood hazard is selected. */
  useEffect(() => {
    const instance = map.current;
    const layer = floodLayer.current;

    if (!ready || !instance || !layer) return;

    if (isFlood) {
      if (!instance.hasLayer(layer)) {
        layer.addTo(instance);
      }
    } else if (instance.hasLayer(layer)) {
      instance.removeLayer(layer);
    }
  }, [isFlood, ready]);

  /*
   * Refresh WMS tiles when the calculation completes.
   * This refreshes the published layer; it does not publish new rasters.
   */
  useEffect(() => {
    const instance = map.current;
    const layer = floodLayer.current;

    if (!ready || !instance || !layer || !isFlood || status !== "done") {
      return;
    }

    if (!instance.hasLayer(layer)) {
      layer.addTo(instance);
    }

    layer.setParams({ _refresh: String(Date.now()) }, false);
    layer.redraw();
  }, [status, isFlood, ready]);

  /* Update flood overlay opacity. */
  useEffect(() => {
    floodLayer.current?.setOpacity(opacity / 100);
  }, [opacity, ready]);

  /* Completion notification. */
  useEffect(() => {
    if (status !== "done") {
      setToast(false);
      return;
    }

    setToast(true);
    const timer = window.setTimeout(() => setToast(false), 6000);
    return () => window.clearTimeout(timer);
  }, [status]);

  /* Fetch and frame the selected county, subcounty, or ward. */
  useEffect(() => {
    const instance = map.current;

    if (!ready || !instance) return;

    const currentRequest = ++requestId.current;
    const controller = new AbortController();

    const selectedCounty = county.trim();
    const selectedSubCounty = subCounty.trim();
    const selectedWard = ward.trim();

    async function frameSelection() {
      setBoundaryError(null);

      if (isAll(selectedCounty)) {
        if (boundaryLayer.current) {
          if (instance.hasLayer(boundaryLayer.current)) {
            instance.removeLayer(boundaryLayer.current);
          }
          boundaryLayer.current = null;
        }

        instance.flyTo([KENYA_CENTER.lat, KENYA_CENTER.lon], KENYA_ZOOM, {
          duration: 0.8,
        });

        setFramed(null);
        return;
      }

      let level: "county" | "subcounty" | "ward" = "county";

      if (!isAll(selectedWard)) {
        level = "ward";
      } else if (!isAll(selectedSubCounty)) {
        level = "subcounty";
      }

      const params = new URLSearchParams({ level, county: selectedCounty });

      if (level === "subcounty" || level === "ward") {
        params.set("subcounty", selectedSubCounty);
      }

      if (level === "ward") {
        params.set("ward", selectedWard);
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/locations/boundaries/?${params.toString()}`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Boundary request failed with HTTP ${response.status}`,
          );
        }

        const collection = (await response.json()) as BoundaryCollection;

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
          { type: "FeatureCollection", features: validFeatures },
          {
            style: {
              color: "#0f766e",
              weight: 2.5,
              opacity: 1,
              fillColor: "#14b8a6",
              fillOpacity: 0.1,
              dashArray: level === "ward" ? "6 4" : undefined,
            },
          },
        );

        const bounds = geoJsonLayer.getBounds();

        if (!bounds.isValid()) {
          throw new Error("The selected boundary has invalid map bounds.");
        }

        if (boundaryLayer.current) {
          if (instance.hasLayer(boundaryLayer.current)) {
            instance.removeLayer(boundaryLayer.current);
          }
        }

        boundaryLayer.current = geoJsonLayer;
        geoJsonLayer.addTo(instance);

        instance.flyToBounds(bounds, {
          padding: [36, 36],
          duration: 0.8,
          maxZoom: level === "ward" ? 13 : level === "subcounty" ? 11 : 10,
        });

        setFramed(
          level === "ward"
            ? `${selectedWard} Ward`
            : level === "subcounty"
              ? `${selectedSubCounty} Sub County`
              : `${selectedCounty} County`,
        );
      } catch (error) {
        if (controller.signal.aborted || currentRequest !== requestId.current) {
          return;
        }

        console.error("Could not frame selected boundary:", error);

        if (level === "county") {
          if (selectedCounty.toLowerCase() === "tana river") {
            instance.flyToBounds(TANA_RIVER_BOUNDS, {
              padding: [36, 36],
              duration: 0.8,
            });
            setFramed(`${selectedCounty} County`);
            return;
          }

          const bounds = countyBounds(selectedCounty);

          if (bounds) {
            instance.flyToBounds(
              [
                [bounds[0][0], bounds[0][1]],
                [bounds[1][0], bounds[1][1]],
              ],
              { padding: [36, 36], duration: 0.8 },
            );
            setFramed(`${selectedCounty} County`);
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
      controller.abort();
      requestId.current += 1;
    };
  }, [county, subCounty, ward, ready]);

  const pill = STATUS_PILLS[status];
  const pillIcon =
    status === "running" ? (
      <Loader2 className="size-3.5 animate-spin" />
    ) : status === "done" ? (
      <CheckCircle2 className="size-3.5" />
    ) : status === "error" ? (
      <AlertTriangle className="size-3.5" />
    ) : (
      <span className="size-1.5 rounded-full bg-slate-400" />
    );

  return (
    <section
      ref={root}
      className={[
        "mapframe relative flex h-full min-h-[440px] w-full min-w-0 flex-col overflow-hidden",
        "rounded-3xl border border-teal-900/10 bg-white shadow-[0_30px_60px_-24px_rgb(11_31_36/.45)]",
        "dark:border-teal-300/10 dark:bg-[#081c21]",
        fullscreen ? "!rounded-none" : "",
        className,
      ].join(" ")}
    >
      <style>{MAP_CSS}</style>

      {/* Header */}
      <header className="relative z-[400] flex shrink-0 items-center gap-2.5 border-b border-teal-900/10 bg-gradient-to-r from-white via-white to-teal-50 px-3 py-2.5 dark:border-teal-300/10 dark:from-[#081c21] dark:via-[#081c21] dark:to-teal-950/50 sm:gap-3.5 sm:px-5 sm:py-3.5">
        <div className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 via-teal-700 to-emerald-800 text-white shadow-lg shadow-teal-900/30 ring-1 ring-white/30 sm:size-11">
          <MapIcon className="size-5" />
          {status === "running" && (
            <span className="mf-ping absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-teal-300 ring-2 ring-white dark:ring-[#081c21]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-lg">
            {framed ?? "Kenya"}
          </h2>

          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Droplets className="size-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            <span className="truncate">{hazardLabels[hazard]}</span>
          </p>
        </div>

        <span
          role="status"
          aria-label={`Analysis status: ${pill.text}`}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-bold ring-1 backdrop-blur sm:px-3 ${pill.cls}`}
        >
          {pillIcon}
          <span className="hidden sm:inline">{pill.text}</span>
        </span>

        <button
          type="button"
          onClick={showKenya}
          disabled={framed === null}
          title={`Reset to Kenya (${scaleKm} km scale)`}
          aria-label="Reset map to Kenya"
          className={iconBtn}
        >
          <RotateCcw className="size-4 transition-transform duration-300 group-enabled:group-hover:-rotate-90" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          title={fullscreen ? "Exit full screen" : "Full screen"}
          aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
          className={iconBtn}
        >
          {fullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </button>
      </header>

      {/* Map stage */}
      <div className="relative min-h-0 flex-1 bg-slate-200 dark:bg-slate-900">
        <div
          ref={holder}
          role="application"
          aria-label={
            framed
              ? `${hazard} hazard map of ${framed}, Kenya`
              : `${hazard} hazard map of Kenya`
          }
          className="absolute inset-0 size-full"
        />

        {/* Soft inner vignette gives the map depth under the glass UI */}
        <div className="pointer-events-none absolute inset-0 z-[350] shadow-[inset_0_0_60px_rgb(11_31_36/.14)]" />

        {!ready && !failed && (
          <div className="absolute inset-0 z-[300] grid place-items-center bg-gradient-to-br from-slate-100 to-teal-50 dark:from-slate-900 dark:to-teal-950">
            <div className="flex flex-col items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Loader2 className="size-7 animate-spin text-teal-600" />
              Loading map…
            </div>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 z-[600] grid place-items-center bg-white/90 px-5 text-center backdrop-blur-md dark:bg-[#081c21]/90">
            <div className="mf-rise w-full max-w-sm rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-slate-900">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="size-7" />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Map unavailable
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Map initialization failed. Check that the basemap and
                GeoServer are reachable, then inspect the browser console.
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-teal-900/25 transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <RotateCcw className="size-4" />
                Reload map
              </button>
            </div>
          </div>
        )}

        {boundaryError && !failed && (
          <div
            role="alert"
            className={`mf-rise absolute left-16 right-16 top-3 z-[550] flex items-start gap-3 rounded-2xl !border-amber-300/70 p-3 text-sm sm:right-auto sm:max-w-md ${glass}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="size-4" />
            </span>

            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Boundary could not be loaded
              </p>
              <p className="mt-0.5 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                {boundaryError}
              </p>
            </div>
          </div>
        )}

        {isFlood && status === "running" && (
          <div className="absolute inset-x-3 bottom-12 z-[500] mx-auto max-w-md sm:bottom-14">
            <div className={`mf-rise flex items-center gap-3.5 rounded-2xl p-3.5 ${glass}`}>
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                <Loader2 className="size-5 animate-spin" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Calculating flood susceptibility
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Processing environmental indicators and risk classes…
                </p>

                <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-teal-900/10 dark:bg-white/10">
                  <div className="mf-sweep absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-yellow-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isFlood && toast && (
          <div
            className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-16"
            role="status"
          >
            <div
              className={`mf-rise flex max-w-full items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 ${glass}`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="size-4" />
              </span>
              <span className="truncate">Flood analysis complete</span>
              <span className="hidden font-medium text-emerald-700/70 dark:text-emerald-300/70 sm:inline">
                overlay refreshed
              </span>
            </div>
          </div>
        )}

        {isFlood && status === "done" && (
          <div
            className={`mf-rise absolute bottom-12 right-3 z-[500] w-[min(210px,calc(100%-1.5rem))] overflow-hidden rounded-2xl sm:bottom-14 sm:w-[224px] ${glass}`}
          >
            <button
              type="button"
              onClick={() => setLegendOpen((open) => !open)}
              aria-expanded={legendOpen}
              className="flex min-h-11 w-full items-center gap-2.5 px-3.5 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
            >
              <Layers3 className="size-4 text-teal-700 dark:text-teal-400" />
              <span className="flex-1 text-xs font-extrabold text-slate-900 dark:text-white">
                Risk levels
              </span>
              <ChevronDown
                className={`size-4 text-slate-400 transition-transform duration-200 ${legendOpen ? "" : "-rotate-90"}`}
              />
            </button>

            {legendOpen && (
              <div className="border-t border-teal-900/10 px-3.5 pb-3.5 pt-3 dark:border-white/10">
                <div
                  className="h-2.5 rounded-full ring-1 ring-black/10"
                  style={{
                    background: `linear-gradient(90deg, ${RISK_CLASSES.map((r) => r.color).join(", ")})`,
                  }}
                />
                <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>Lower</span>
                  <span>Higher</span>
                </div>

                <ul className="mt-2.5 space-y-1.5">
                  {RISK_CLASSES.map((risk) => (
                    <li
                      key={risk.label}
                      className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <span
                        className="size-3.5 shrink-0 rounded ring-1 ring-black/15"
                        style={{ backgroundColor: risk.color }}
                      />
                      {risk.label}
                    </li>
                  ))}
                </ul>

                <label className="mt-3.5 block border-t border-teal-900/10 pt-3 text-[11px] font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">
                  <span className="flex items-center justify-between">
                    Overlay opacity
                    <span className="tabular-nums text-teal-700 dark:text-teal-300">
                      {opacity}%
                    </span>
                  </span>

                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={opacity}
                    onChange={(event) =>
                      setOpacity(Number(event.currentTarget.value))
                    }
                    className="mt-2 h-2 w-full cursor-pointer accent-teal-700"
                  />
                </label>

                <p className="mt-2.5 text-[10px] leading-4 text-slate-400">
                  Legend colors must match the published GeoServer raster
                  style.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-teal-900/10 bg-white/90 px-3 py-2 dark:border-teal-300/10 dark:bg-[#081c21] sm:gap-3 sm:px-5 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-900/5 px-2 py-1 dark:bg-white/5">
            <Crosshair className="size-3.5 text-teal-600 dark:text-teal-400" />
            <span ref={coords} className="tabular-nums">
              Hover over the map
            </span>
          </span>

          <span className="hidden truncate lg:inline">
            Leaflet · OpenStreetMap · GeoServer WMS
          </span>
        </div>

        <button
          type="button"
          onClick={showKenya}
          disabled={framed === null}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-teal-800 ring-1 ring-teal-700/20 transition hover:bg-teal-50 hover:ring-teal-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-40 dark:text-teal-200 dark:ring-teal-300/20 dark:hover:bg-teal-400/10"
        >
          <Maximize2 className="size-3.5" />
          <span className="sm:hidden">Kenya</span>
          <span className="hidden sm:inline">View all Kenya</span>
        </button>
      </footer>
    </section>
  );
}