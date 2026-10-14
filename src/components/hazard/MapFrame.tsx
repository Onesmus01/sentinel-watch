import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, Layers3, Loader2, Maximize2,
  Minimize2, Map as MapIcon, RotateCcw, Crosshair, Droplets,
} from "lucide-react";
import type { GeoJSON as LeafletGeoJSON, Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  KENYA_CENTER, KENYA_ZOOM, SCALE_MAX_WIDTH_PX, TILE_ATTRIBUTION,
  TILE_MAX_ZOOM, TILE_URL, countyBounds, scaleBarMetres,
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

const API_BASE_URL = "http://127.0.0.1:8000/api";
const GEOSERVER_WMS_URL = "http://192.168.0.40:8080/geoserver/wms";

const FLOOD_LAYER = "TanaRiver_Floods:TanaRiver_Flood_Hotspots";
const WARD_LAYER = "Rangelands:wards";
const RAINFALL_LAYER = "Hazards_Dashboard:TanaRiver_Rainfall";
const LANDCOVER_LAYER = "Hazards_Dashboard:TanaRiver_LULC";
const SLOPE_LAYER = "Hazards_Dashboard:TanaRiver_Slope";
const RIVER_LAYER = "Hazards_Dashboard:TR_Rivers";
const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const TANA_RIVER_BOUNDS: [[number, number], [number, number]] = [
  [-3.0729, 38.4342],
  [-0.0155, 40.7306],
];

const RISK_CLASSES = [
  { label: "Very Low", color: "#16a34a" },
  { label: "Low", color: "#a3d977" },
  { label: "Moderate", color: "#facc15" },
  { label: "High", color: "#f97316" },
  { label: "Very High", color: "#dc2626" },
];

const isAll = (v: string | undefined) => !v || v.trim().toLowerCase() === "all";

const hazardLabels = {
  flood: "Flood susceptibility",
  drought: "Drought risk",
  landslide: "Landslide risk",
} as const;

/* Restyles Leaflet's stock controls to match the app, scoped to this component. */
const MAP_CSS = `
.mapframe .leaflet-container{font-family:inherit;background:#e2e8f0}
.mapframe .leaflet-bar,.mapframe .leaflet-control-layers{border:1px solid rgb(226 232 240/.9)!important;border-radius:14px!important;box-shadow:0 8px 24px rgb(15 23 42/.14)!important;overflow:hidden;background:rgb(255 255 255/.95);backdrop-filter:blur(8px)}
.mapframe .leaflet-bar a{width:36px;height:36px;line-height:36px;color:#334155;border-bottom-color:#e2e8f0}
.mapframe .leaflet-bar a:hover{background:#f0fdfa;color:#0f766e}
.mapframe .leaflet-control-layers-toggle{width:40px;height:40px}
.mapframe .leaflet-control-layers-expanded{padding:12px 14px;font-size:12px;color:#334155;min-width:170px}
.mapframe .leaflet-control-layers label{display:block;padding:3px 0;cursor:pointer}
.mapframe .leaflet-control-scale-line{border-color:#0f766e;background:rgb(255 255 255/.85);color:#334155;font-size:10px;font-weight:600;border-radius:0 0 6px 6px}
.mapframe .leaflet-control-attribution{background:rgb(255 255 255/.8)!important;font-size:9px;border-radius:8px 0 0 0;backdrop-filter:blur(6px)}
.dark .mapframe .leaflet-bar,.dark .mapframe .leaflet-control-layers{background:rgb(15 23 42/.95);border-color:#334155!important;color:#e2e8f0}
.dark .mapframe .leaflet-bar a{background:transparent;color:#e2e8f0;border-bottom-color:#334155}
.dark .mapframe .leaflet-control-layers-expanded{color:#e2e8f0}
.mapframe .leaflet-container:focus-visible{outline:2px solid #14b8a6;outline-offset:-2px}
`;

const glass =
  "border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/90";
const iconBtn =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-teal-950";

export function MapFrame({
  county, subCounty = "all", ward = "all", status, hazard = "flood", className = "",
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
  const [legendOpen, setLegendOpen] = useState(true);
  const [opacity, setOpacity] = useState(82);
  const [toast, setToast] = useState(false);

  const isFlood = hazard === "flood";
  const scaleKm = Math.round(scaleBarMetres(KENYA_CENTER.lat, KENYA_ZOOM) / 1000);

  const showKenya = useCallback(() => {
    requestId.current += 1;
    const instance = map.current;
    if (!instance) return;
    if (boundaryLayer.current) {
      instance.removeLayer(boundaryLayer.current);
      boundaryLayer.current = null;
    }
    instance.flyTo([KENYA_CENTER.lat, KENYA_CENTER.lon], KENYA_ZOOM, { duration: 0.8 });
    setFramed(null);
    setBoundaryError(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.();
  }, []);

  /* Fullscreen state + re-measure the map afterwards */
  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === root.current);
      setTimeout(() => map.current?.invalidateSize({ pan: false }), 150);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* Create the map once. */
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
          maxBounds: [[-12, 26], [12, 50]],
          maxBoundsViscosity: 0.8,
          minZoom: 5,
          maxZoom: TILE_MAX_ZOOM,
          scrollWheelZoom: false,
          attributionControl: true,
          zoomControl: false,
        });

        L.control.zoom({ position: "topleft" }).addTo(instance);

        const osm = L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: TILE_MAX_ZOOM });
        const satellite = L.tileLayer(SATELLITE_URL, { attribution: "Tiles © Esri", maxZoom: 18 });

        const wms = (layers: string, opacity: number, attribution: string) =>
          L.tileLayer.wms(GEOSERVER_WMS_URL, {
            layers, format: "image/png", transparent: true, version: "1.1.1",
            opacity, tiled: true, attribution,
          });

        const flood = wms(FLOOD_LAYER, 0.82, "Flood hotspots · Sentinel Watch GeoServer");
        const wards = wms(WARD_LAYER, 0.85, "Ward boundaries · Sentinel Watch GeoServer");
        const rainfall = wms(RAINFALL_LAYER, 0.7, "Rainfall · Sentinel Watch GeoServer");
        const landcover = wms(LANDCOVER_LAYER, 0.75, "Land cover · Sentinel Watch GeoServer");
        const slope = wms(SLOPE_LAYER, 0.7, "Slope · Sentinel Watch GeoServer");
        const rivers = wms(RIVER_LAYER, 0.95, "River network · Sentinel Watch GeoServer");

        osm.addTo(instance);
        if (hazard === "flood") flood.addTo(instance);

        const layersControl = L.control
          .layers(
            { "Street map": osm, Satellite: satellite },
            {
              "Flood hotspots": flood, Rainfall: rainfall, "Land cover": landcover,
              Slope: slope, "River network": rivers, "Ward boundaries": wards,
            },
            { collapsed: true, position: "topright" },
          )
          .addTo(instance);

        const toggle = layersControl.getContainer()?.querySelector(".leaflet-control-layers-toggle");
        toggle?.setAttribute("title", "Show or hide map layers");
        toggle?.setAttribute("aria-label", "Show or hide map layers");

        L.control
          .scale({ metric: true, imperial: false, maxWidth: SCALE_MAX_WIDTH_PX, position: "bottomleft" })
          .addTo(instance);

        /* Live cursor coordinates, written straight to the DOM to avoid re-renders */
        instance.on("mousemove", (e) => {
          if (coords.current)
            coords.current.textContent = `${e.latlng.lat.toFixed(4)}°, ${e.latlng.lng.toFixed(4)}°`;
        });
        /* Wheel zoom only after the user clicks into the map, so page scrolling still works */
        instance.on("click", () => instance.scrollWheelZoom.enable());
        instance.on("mouseout", () => instance.scrollWheelZoom.disable());

        floodLayer.current = flood;
        map.current = instance;

        const resize = () => {
          if (!cancelled && map.current === instance) instance.invalidateSize({ pan: false });
        };
        const observer = new ResizeObserver(resize);
        if (holder.current) observer.observe(holder.current);
        requestAnimationFrame(resize);

        setFailed(false);
        setReady(true);

        cleanup = () => {
          observer.disconnect();
          boundaryLayer.current = null;
          floodLayer.current = null;
          instance.remove();
          if (map.current === instance) map.current = null;
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
    // Map creation is intentionally one-time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Flood output visible only for the flood hazard. */
  useEffect(() => {
    const instance = map.current;
    const layer = floodLayer.current;
    if (!ready || !instance || !layer) return;
    if (isFlood) {
      if (!instance.hasLayer(layer)) layer.addTo(instance);
    } else if (instance.hasLayer(layer)) {
      instance.removeLayer(layer);
    }
  }, [isFlood, ready]);

  /* Reload the published WMS image when a calculation finishes. */
  useEffect(() => {
    const instance = map.current;
    const layer = floodLayer.current;
    if (!ready || !instance || !layer || !isFlood || status !== "done") return;
    if (!instance.hasLayer(layer)) layer.addTo(instance);
    layer.redraw();
  }, [status, isFlood, ready]);

  /* Flood overlay opacity slider */
  useEffect(() => {
    floodLayer.current?.setOpacity(opacity / 100);
  }, [opacity, ready]);

  /* The completion toast fades out on its own */
  useEffect(() => {
    if (status !== "done") return setToast(false);
    setToast(true);
    const t = setTimeout(() => setToast(false), 6000);
    return () => clearTimeout(t);
  }, [status]);

  /* Fetch and frame the selected boundary. */
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
        if (boundaryLayer.current && instance.hasLayer(boundaryLayer.current))
          instance.removeLayer(boundaryLayer.current);
        boundaryLayer.current = null;
        instance.flyTo([KENYA_CENTER.lat, KENYA_CENTER.lon], KENYA_ZOOM, { duration: 0.8 });
        setFramed(null);
        return;
      }

      let level: "county" | "subcounty" | "ward" = "county";
      if (!isAll(selectedWard)) level = "ward";
      else if (!isAll(selectedSubCounty)) level = "subcounty";

      const params = new URLSearchParams({ level, county: selectedCounty });
      if (level === "subcounty" || level === "ward") params.set("subcounty", selectedSubCounty);
      if (level === "ward") params.set("ward", selectedWard);

      try {
        const response = await fetch(`${API_BASE_URL}/locations/boundaries/?${params.toString()}`);
        if (!response.ok) throw new Error(`Boundary request failed with HTTP ${response.status}`);

        const collection = (await response.json()) as BoundaryCollection;
        if (currentRequest !== requestId.current) return;

        if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features) || collection.features.length === 0)
          throw new Error(`No ${level} boundary was returned for the selected location.`);

        const L = await import("leaflet");
        if (currentRequest !== requestId.current) return;

        const validFeatures = collection.features.filter((f) => f.geometry !== null);
        if (validFeatures.length === 0) throw new Error("The returned boundary has no valid geometry.");

        const geoJsonLayer = L.geoJSON(
          { type: "FeatureCollection", features: validFeatures },
          { style: { color: "#0f766e", weight: 2.5, opacity: 1, fillColor: "#14b8a6", fillOpacity: 0.1, dashArray: level === "ward" ? "6 4" : undefined } },
        );

        const bounds = geoJsonLayer.getBounds();
        if (!bounds.isValid()) throw new Error("The selected boundary has invalid map bounds.");

        if (boundaryLayer.current) instance.removeLayer(boundaryLayer.current);
        boundaryLayer.current = geoJsonLayer;
        geoJsonLayer.addTo(instance);

        instance.flyToBounds(bounds, {
          padding: [36, 36], duration: 0.8,
          maxZoom: level === "ward" ? 13 : level === "subcounty" ? 11 : 10,
        });

        setFramed(
          level === "ward" ? `${selectedWard} Ward`
            : level === "subcounty" ? `${selectedSubCounty} Sub County`
            : `${selectedCounty} County`,
        );
      } catch (error) {
        if (currentRequest !== requestId.current) return;
        console.error("Could not frame selected boundary:", error);

        if (level === "county") {
          if (selectedCounty.toLowerCase() === "tana river") {
            instance.flyToBounds(TANA_RIVER_BOUNDS, { padding: [36, 36], duration: 0.8 });
            setFramed(`${selectedCounty} County`);
            return;
          }
          const b = countyBounds(selectedCounty);
          if (b) {
            instance.flyToBounds([[b[0][0], b[0][1]], [b[1][0], b[1][1]]], { padding: [36, 36], duration: 0.8 });
            setFramed(`${selectedCounty} County`);
            return;
          }
        }
        setBoundaryError(error instanceof Error ? error.message : "Unable to load the selected boundary.");
      }
    }

    void frameSelection();
    return () => {
      requestId.current += 1;
    };
  }, [county, subCounty, ward, ready]);

  const statusPill =
    status === "running" ? { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Calculating", cls: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900" }
    : status === "done" ? { icon: <CheckCircle2 className="size-3.5" />, text: "Complete", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900" }
    : status === "error" ? { icon: <AlertTriangle className="size-3.5" />, text: "Failed", cls: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900" }
    : { icon: <span className="size-1.5 rounded-full bg-slate-400" />, text: "Ready", cls: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700" };

  return (
    <section
      ref={root}
      className={[
        "mapframe relative flex h-full min-h-[420px] w-full min-w-0 flex-col overflow-hidden",
        "rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10",
        "dark:border-slate-700 dark:bg-slate-950",
        fullscreen ? "rounded-none" : "",
        className,
      ].join(" ")}
    >
      <style>{MAP_CSS}</style>

      <header className="relative z-[400] flex shrink-0 items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-white via-white to-teal-50/50 px-3 py-3 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950/30 sm:px-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md shadow-teal-900/20">
          <MapIcon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
            {framed ?? "Kenya"}
          </h2>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
            <Droplets className="size-3.5 shrink-0 text-teal-600" />
            <span className="truncate">{hazardLabels[hazard]}</span>
          </p>
        </div>

        <span className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 sm:inline-flex ${statusPill.cls}`} role="status">
          {statusPill.icon}{statusPill.text}
        </span>

        <button type="button" onClick={showKenya} disabled={framed === null} title={`Reset to Kenya (${scaleKm} km scale)`} aria-label="Reset map to Kenya" className={iconBtn}>
          <RotateCcw className="size-4" />
        </button>
        <button type="button" onClick={toggleFullscreen} title={fullscreen ? "Exit full screen" : "Full screen"} aria-label={fullscreen ? "Exit full screen" : "Enter full screen"} className={iconBtn}>
          {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </header>

      <div className="relative min-h-0 flex-1 bg-slate-100 dark:bg-slate-900">
        <div
          ref={holder}
          role="application"
          aria-label={framed ? `${hazard} hazard map of ${framed}, Kenya` : `${hazard} hazard map of Kenya`}
          className="absolute inset-0 size-full"
        />

        {!ready && !failed && (
          <div className="absolute inset-0 z-[300] grid place-items-center bg-slate-100 dark:bg-slate-900">
            <div className="flex animate-pulse items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-teal-600" />Loading map…
            </div>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 z-[600] grid place-items-center bg-white/95 px-6 text-center backdrop-blur-sm dark:bg-slate-950/95">
            <div className="max-w-sm rounded-2xl border border-red-100 bg-white p-6 shadow-lg dark:border-red-900 dark:bg-slate-900">
              <div className="mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Map unavailable</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Map initialization failed. Check that the basemap and GeoServer are reachable, then inspect the browser console.
              </p>
              <button type="button" onClick={() => window.location.reload()}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
                <RotateCcw className="size-4" />Reload map
              </button>
            </div>
          </div>
        )}

        {boundaryError && !failed && (
          <div className={`absolute left-14 right-14 top-3 z-[550] flex items-start gap-3 rounded-xl border-amber-200 p-3 text-sm sm:right-auto sm:max-w-md ${glass}`}>
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Boundary could not be loaded</p>
              <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{boundaryError}</p>
            </div>
          </div>
        )}

        {isFlood && status === "running" && (
          <div className="absolute inset-x-3 bottom-10 z-[500] mx-auto max-w-md">
            <div className={`flex items-center gap-3 rounded-2xl p-3.5 ${glass}`}>
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <Loader2 className="size-5 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Calculating flood susceptibility</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Processing environmental indicators and risk classes…</p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isFlood && toast && (
          <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2" role="status">
            <div className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 ${glass}`}>
              <span className="grid size-6 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950"><CheckCircle2 className="size-4" /></span>
              Flood analysis complete · overlay refreshed
            </div>
          </div>
        )}

        {isFlood && status === "done" && (
          <div className={`absolute bottom-10 right-3 z-[500] w-[176px] overflow-hidden rounded-2xl sm:w-[200px] ${glass}`}>
            <button type="button" onClick={() => setLegendOpen((o) => !o)} aria-expanded={legendOpen}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
              <Layers3 className="size-4 text-teal-700 dark:text-teal-400" />
              <span className="flex-1 text-xs font-bold text-slate-900 dark:text-white">Risk levels</span>
              <ChevronDown className={`size-4 text-slate-400 transition-transform ${legendOpen ? "" : "-rotate-90"}`} />
            </button>

            {legendOpen && (
              <div className="border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-800">
                <div className="mb-2.5 flex h-2 overflow-hidden rounded-full ring-1 ring-black/10">
                  {RISK_CLASSES.map((r) => <span key={r.label} className="flex-1" style={{ background: r.color }} />)}
                </div>
                <ul className="space-y-1.5">
                  {RISK_CLASSES.map((r) => (
                    <li key={r.label} className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <span className="size-3 shrink-0 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: r.color }} />{r.label}
                    </li>
                  ))}
                </ul>
                <label className="mt-3 block border-t border-slate-100 pt-2.5 text-[10px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Overlay opacity · {opacity}%
                  <input type="range" min={10} max={100} step={5} value={opacity}
                    onChange={(e) => setOpacity(Number(e.currentTarget.value))}
                    className="mt-1.5 h-1.5 w-full cursor-pointer accent-teal-700" />
                </label>
                <p className="mt-2 text-[9px] leading-4 text-slate-400">Legend colors must match the published GeoServer raster style.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Crosshair className="size-3.5 shrink-0 text-teal-600" />
          <span ref={coords} className="tabular-nums">Move cursor over map</span>
          <span className="hidden text-slate-300 dark:text-slate-700 md:inline">|</span>
          <span className="hidden truncate md:inline">Leaflet · OpenStreetMap · GeoServer WMS</span>
        </div>
        <button type="button" onClick={showKenya} disabled={framed === null}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-40 dark:text-teal-300 dark:hover:bg-teal-950">
          <Maximize2 className="size-3.5" />View all Kenya
        </button>
      </footer>
    </section>
  );
}