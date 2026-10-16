
import os
import time

import numpy as np
import geopandas as gpd
import rasterio
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as path_effects

from matplotlib.colors import ListedColormap, BoundaryNorm
from rasterio.warp import reproject, Resampling, calculate_default_transform
from rasterio.features import rasterize
from scipy.ndimage import distance_transform_edt, gaussian_filter
from django.conf import settings

import jenkspy
import contextily as cx


# ============================================================
# DJANGO CONFIGURATION
# ============================================================

BASE_DIR = (
    str(settings.BASE_DIR)
    if getattr(settings, "BASE_DIR", None)
    else None
)

INPUT_DIR = (
    os.path.join(BASE_DIR, "media", "flood_hotspots", "geoserver_inputs")
    if BASE_DIR
    else r"C:\sentinel-watch\hazard-backend\media\flood_hotspots\geoserver_inputs"
)

DEFAULT_OUTPUT_DIR = (
    os.path.join(BASE_DIR, "media", "flood_hotspots")
    if BASE_DIR
    else r"C:\sentinel-watch\flood_outputs"
)

CONFIG = {
    "county_boundary": getattr(
        settings, "FLOOD_COUNTY_BOUNDARY",
        os.path.join(INPUT_DIR, "TanaRiver_County.geojson"),
    ),
    "rainfall_path": getattr(
        settings, "FLOOD_RAINFALL_PATH",
        os.path.join(INPUT_DIR, "TanaRiver_Rainfall.tif"),
    ),
    "landcover_path": getattr(
        settings, "FLOOD_LANDCOVER_PATH",
        os.path.join(INPUT_DIR, "TanaRiver_LULC.tif"),
    ),
    "river_path": getattr(
        settings, "FLOOD_RIVER_PATH",
        os.path.join(INPUT_DIR, "TR_Rivers.geojson"),
    ),
    "out_dir": getattr(settings, "FLOOD_OUTPUT_DIR", DEFAULT_OUTPUT_DIR),
    "target_crs": getattr(settings, "FLOOD_TARGET_CRS", "EPSG:32637"),
    "target_resolution": getattr(settings, "FLOOD_TARGET_RESOLUTION", 30),
    "river_dist_smooth_sigma": getattr(
        settings, "FLOOD_RIVER_DISTANCE_SMOOTH_SIGMA", 3
    ),
    "rainfall_sample_size": getattr(
        settings, "FLOOD_RAINFALL_PERCENTILE_SAMPLE_SIZE", 1_000_000
    ),
    "jenks_sample_size": getattr(settings, "FLOOD_JENKS_SAMPLE_SIZE", 50_000),
    "plot_max_dimension": getattr(settings, "FLOOD_PLOT_MAX_DIMENSION", 1800),
}


# ============================================================
# WEIGHTS
# ============================================================

# Original supplied weights:
# Elevation      0.25 - unavailable
# Slope          0.15 - unavailable
# Rainfall       0.20 - available
# Land cover     0.05 - available
# Distance river 0.35 - available

ORIGINAL_WEIGHTS = {
    "dist_to_river": 0.35,
    "rainfall": 0.20,
    "landcover": 0.05,
}

AVAILABLE_WEIGHT_TOTAL = sum(ORIGINAL_WEIGHTS.values())

WEIGHTS = {
    name: weight / AVAILABLE_WEIGHT_TOTAL
    for name, weight in ORIGINAL_WEIGHTS.items()
}


# ============================================================
# LAND COVER RISK SCORES
# ============================================================

LANDCOVER_RISK = {
    1: 1,
    2: 5,
    3: 4,
    4: 2,
    5: 5,
    6: 3,
}


# ============================================================
# TOWNS — TANA RIVER COUNTY
# Coordinates are longitude, latitude (WGS84).
# ============================================================

TOWNS = {
    "Hola": (40.0296, -1.4900),
    "Garsen": (40.1189, -2.2706),
    "Madogo": (40.0674, -0.2764),
    "Bura": (39.9535, -1.1073),
    "Wenje": (40.0140, -1.4460),
    "Kipini": (40.5322, -2.5306),
    "Ngao": (40.1500, -1.9660),
    "Kinakomba": (39.8710, -0.7980),
}


# ============================================================
# GENERAL HELPERS
# ============================================================

def log(message):
    print(f"[FLOOD {time.strftime('%H:%M:%S')}] {message}", flush=True)


def timed_start():
    return time.perf_counter()


def timed_end(label, started):
    log(f"{label}: {time.perf_counter() - started:.2f} seconds")


def ensure_out_dir(path):
    os.makedirs(path, exist_ok=True)


def valid_values(arr):
    """Return finite raster values."""
    return arr[np.isfinite(arr)]


def _sample_valid(arr, max_samples=250_000):
    """
    Deterministically sample finite values without sorting or copying
    the entire raster for diagnostic statistics.
    """
    flat = arr.reshape(-1)
    stride = max(1, flat.size // max(1, max_samples))
    sample = flat[::stride]
    sample = sample[np.isfinite(sample)]

    if sample.size == 0:
        sample = flat[np.isfinite(flat)]

    return sample


def print_data_range(name, arr):
    sample = _sample_valid(arr)

    if sample.size == 0:
        log(f"{name}: no valid data")
        return

    percentiles = np.percentile(sample, [10, 25, 50, 75, 90])

    log(
        f"{name}: min={sample.min():.2f}, "
        f"p10={percentiles[0]:.2f}, "
        f"p25={percentiles[1]:.2f}, "
        f"median={percentiles[2]:.2f}, "
        f"p75={percentiles[3]:.2f}, "
        f"p90={percentiles[4]:.2f}, "
        f"max={sample.max():.2f}"
    )


def build_towns_gdf(towns_dict, target_crs):
    names = list(towns_dict)
    lons = [coordinates[0] for coordinates in towns_dict.values()]
    lats = [coordinates[1] for coordinates in towns_dict.values()]

    towns = gpd.GeoDataFrame(
        {"name": names},
        geometry=gpd.points_from_xy(lons, lats),
        crs="EPSG:4326",
    )

    return towns.to_crs(target_crs)


def build_county_mask(boundary, shape, transform):
    """Rasterize the county boundary onto the analysis grid."""
    geometries = [
        geom
        for geom in boundary.geometry
        if geom is not None and not geom.is_empty
    ]

    if not geometries:
        raise ValueError("The county boundary contains no valid geometries.")

    return rasterize(
        [(geom, 1) for geom in geometries],
        out_shape=shape,
        transform=transform,
        fill=0,
        dtype="uint8",
    ).astype(bool)


def get_profile_crs(profile):
    """
    Return a valid Rasterio CRS from a profile's CRS value.

    Raster profiles may contain a CRS object or a string such as
    'EPSG:32637'. Converting explicitly avoids the
    "'str' object has no attribute 'to_string'" basemap error.
    """
    crs_value = profile.get("crs")

    if crs_value is None:
        raise ValueError("The reference raster profile has no CRS.")

    return rasterio.crs.CRS.from_user_input(crs_value)


# ============================================================
# RASTER REPROJECTION
# ============================================================

def reproject_raster_to_match(
    src_path,
    ref_profile,
    out_path,
    resampling=Resampling.bilinear,
):
    """
    Reproject directly to a GeoTIFF on the reference grid.
    """
    started = timed_start()
    ensure_out_dir(os.path.dirname(out_path))

    out_profile = ref_profile.copy()
    out_profile.update(
        driver="GTiff",
        dtype="float32",
        count=1,
        nodata=np.nan,
        compress="LZW",
        tiled=True,
        BIGTIFF="IF_SAFER",
    )

    with rasterio.open(src_path) as src:
        if src.crs is None:
            raise ValueError(
                f"Input raster has no coordinate reference system: {src_path}"
            )

        with rasterio.open(out_path, "w", **out_profile) as dst:
            reproject(
                source=rasterio.band(src, 1),
                destination=rasterio.band(dst, 1),
                src_transform=src.transform,
                src_crs=src.crs,
                src_nodata=src.nodata,
                dst_transform=dst.transform,
                dst_crs=dst.crs,
                dst_nodata=np.nan,
                resampling=resampling,
                init_dest_nodata=True,
            )

    timed_end(f"Reprojected {os.path.basename(src_path)}", started)
    return out_path


# ============================================================
# CLASSIFICATION
# ============================================================

def classify_distance_to_river_absolute(dist_metres):
    """
    Closer to rivers means higher flood susceptibility.

    0–1 km       = 5
    >1–3 km      = 4
    >3–7 km      = 3
    >7–15 km     = 2
    >15 km       = 1
    """
    risk = np.full(dist_metres.shape, np.nan, dtype=np.float32)
    valid = np.isfinite(dist_metres)

    risk[valid & (dist_metres <= 1000)] = 5
    risk[valid & (dist_metres > 1000) & (dist_metres <= 3000)] = 4
    risk[valid & (dist_metres > 3000) & (dist_metres <= 7000)] = 3
    risk[valid & (dist_metres > 7000) & (dist_metres <= 15000)] = 2
    risk[valid & (dist_metres > 15000)] = 1

    return risk


def classify_rainfall_percentile(rain, sample_size=1_000_000):
    """Classify rainfall into five percentile-based risk classes."""
    sample = _sample_valid(rain, max_samples=sample_size)

    if sample.size == 0:
        raise ValueError("Rainfall raster contains no valid data.")

    thresholds = np.percentile(sample, [20, 40, 60, 80])
    risk = np.full(rain.shape, np.nan, dtype=np.float32)
    valid = np.isfinite(rain)

    risk[valid] = (
        1
        + (rain[valid] > thresholds[0]).astype(np.uint8)
        + (rain[valid] > thresholds[1]).astype(np.uint8)
        + (rain[valid] > thresholds[2]).astype(np.uint8)
        + (rain[valid] > thresholds[3]).astype(np.uint8)
    )

    log(
        "Rainfall percentile thresholds (20/40/60/80): "
        f"{thresholds[0]:.3f}, {thresholds[1]:.3f}, "
        f"{thresholds[2]:.3f}, {thresholds[3]:.3f}"
    )

    return risk


def jenks_classify(arr, n_classes=5, sample_size=50_000):
    """Calculate Jenks breaks from a sample and classify all valid pixels."""
    started = timed_start()
    valid = np.isfinite(arr)
    sample = _sample_valid(arr, max_samples=sample_size)

    if sample.size == 0:
        raise ValueError("Cannot classify a raster with no valid values.")

    if sample.size < n_classes:
        raise ValueError(
            f"Not enough valid sampled values for {n_classes} Jenks classes."
        )

    if np.unique(sample).size < n_classes:
        raise ValueError(
            "The raster has fewer unique sampled values than requested "
            f"class count ({n_classes})."
        )

    breaks = jenkspy.jenks_breaks(
        sample.tolist(),
        n_classes=n_classes,
    )
    log(f"Jenks breaks: {breaks}")

    classes = np.full(arr.shape, np.nan, dtype=np.float32)
    classes[valid] = (
        np.searchsorted(
            np.asarray(breaks[1:-1]),
            arr[valid],
            side="right",
        ).astype(np.float32)
        + 1
    )

    timed_end("Jenks classification", started)
    return classes


# ============================================================
# STEP 1 — REFERENCE GRID
# ============================================================

def build_reference_grid(config):
    """Build the common analysis grid using rainfall as reference."""
    started = timed_start()

    boundary = gpd.read_file(config["county_boundary"])

    if boundary.empty:
        raise ValueError("The county boundary file is empty.")

    if boundary.crs is None:
        raise ValueError("The county boundary has no defined CRS.")

    boundary = boundary.to_crs(config["target_crs"])

    with rasterio.open(config["rainfall_path"]) as src:
        if src.crs is None:
            raise ValueError("The rainfall raster has no defined CRS.")

        transform, width, height = calculate_default_transform(
            src.crs,
            config["target_crs"],
            src.width,
            src.height,
            *src.bounds,
            resolution=config["target_resolution"],
        )

        ref_profile = src.profile.copy()
        ref_profile.update(
            driver="GTiff",
            crs=config["target_crs"],
            transform=transform,
            width=width,
            height=height,
            dtype="float32",
            count=1,
            nodata=np.nan,
            compress="LZW",
            tiled=True,
            BIGTIFF="IF_SAFER",
        )

    log(f"Reference grid: {width:,} × {height:,} pixels")
    log(f"Approximate pixel count: {width * height:,}")
    timed_end("Reference grid", started)

    return boundary, ref_profile


# ============================================================
# STEP 2 — DISTANCE TO RIVER
# ============================================================

def process_distance_to_river(config, ref_profile, boundary, out_dir):
    """Rasterize rivers, calculate distances and assign river-risk scores."""
    started = timed_start()
    log("Reading river geometries")

    rivers = gpd.read_file(config["river_path"])

    if rivers.empty:
        raise ValueError("The river input contains no features.")

    if rivers.crs is None:
        raise ValueError("The river data has no defined CRS.")

    rivers = rivers.to_crs(get_profile_crs(ref_profile))
    rivers = gpd.clip(rivers, boundary)

    geometries = [
        geom
        for geom in rivers.geometry
        if geom is not None and not geom.is_empty
    ]

    if not geometries:
        raise ValueError(
            "No river geometries were found inside Tana River County."
        )

    shape = (ref_profile["height"], ref_profile["width"])

    log("Rasterizing river network")
    river_raster = rasterize(
        [(geom, 1) for geom in geometries],
        out_shape=shape,
        transform=ref_profile["transform"],
        fill=0,
        dtype="uint8",
    )

    if not np.any(river_raster):
        raise ValueError(
            "River rasterization produced no river pixels. "
            "Check the river CRS and reference grid."
        )

    pixel_size_x = abs(ref_profile["transform"].a)
    pixel_size_y = abs(ref_profile["transform"].e)

    if not np.isclose(pixel_size_x, pixel_size_y, rtol=0.01):
        log(
            "Warning: pixels are not square; distance calculations "
            "use the horizontal pixel size."
        )

    log("Calculating Euclidean distance transform")
    dist_metres = distance_transform_edt(
        river_raster == 0,
        sampling=(pixel_size_y, pixel_size_x),
    ).astype(np.float32)

    del river_raster
    print_data_range("Raw river distance (metres)", dist_metres)

    sigma = float(config.get("river_dist_smooth_sigma", 0))

    if sigma > 0:
        log(f"Smoothing distance raster with sigma={sigma}")
        smoothed = np.empty_like(dist_metres)
        gaussian_filter(dist_metres, sigma=sigma, output=smoothed)
        del dist_metres
        dist_metres = smoothed
        print_data_range("Smoothed river distance (metres)", dist_metres)

    risk = classify_distance_to_river_absolute(dist_metres)
    del dist_metres

    timed_end("Distance-to-river processing", started)
    return None, risk


# ============================================================
# STEP 3 — RAINFALL
# ============================================================

def process_rainfall(config, ref_profile, boundary, out_dir):
    """Reproject rainfall, mask it to the county and classify risk."""
    started = timed_start()
    reproj_path = os.path.join(out_dir, "rainfall_reproj.tif")

    reproject_raster_to_match(
        config["rainfall_path"],
        ref_profile,
        reproj_path,
        resampling=Resampling.bilinear,
    )

    with rasterio.open(reproj_path) as src:
        rain = src.read(1).astype(np.float32, copy=False)
        transform = src.transform
        nodata = src.nodata

    log("Building county mask for rainfall")
    county_mask = build_county_mask(boundary, rain.shape, transform)

    invalid = ~np.isfinite(rain)

    if nodata is not None and np.isfinite(nodata):
        invalid |= rain == nodata

    rain[invalid | ~county_mask] = np.nan
    print_data_range("Rainfall", rain)

    risk = classify_rainfall_percentile(
        rain,
        sample_size=int(
            config.get("rainfall_sample_size", 1_000_000)
        ),
    )

    risk[~county_mask] = np.nan

    del rain
    del county_mask

    timed_end("Rainfall processing", started)
    return risk


# ============================================================
# STEP 4 — LAND COVER
# ============================================================

def process_landcover(config, ref_profile, boundary, out_dir):
    """Reproject categorical land cover and convert codes into risk scores."""
    started = timed_start()
    reproj_path = os.path.join(out_dir, "landcover_reproj.tif")

    reproject_raster_to_match(
        config["landcover_path"],
        ref_profile,
        reproj_path,
        resampling=Resampling.nearest,
    )

    with rasterio.open(reproj_path) as src:
        lc = src.read(1)
        transform = src.transform
        nodata = src.nodata

    log("Building county mask for land cover")
    county_mask = build_county_mask(boundary, lc.shape, transform)

    valid_pixels = county_mask.copy()

    if nodata is not None and np.isfinite(nodata):
        valid_pixels &= lc != nodata

    risk = np.full(lc.shape, np.nan, dtype=np.float32)

    for code, score in LANDCOVER_RISK.items():
        risk[(lc == code) & valid_pixels] = score

    del lc
    del county_mask
    del valid_pixels

    print_data_range("Land-cover risk", risk)
    timed_end("Land-cover processing", started)

    return risk


# ============================================================
# STEP 5 — WEIGHTED OVERLAY
# ============================================================

def compute_flood_hotspot_index(factor_risks, weights):
    """
    Calculate the weighted Flood Hotspot Index.
    Pixels without valid values for every factor are excluded.
    """
    started = timed_start()

    if not factor_risks:
        raise ValueError("No factor rasters were supplied.")

    first_factor = next(iter(factor_risks.values()))
    fhi = np.zeros(first_factor.shape, dtype=np.float32)
    valid_mask = np.ones(first_factor.shape, dtype=bool)
    weighted = np.empty_like(fhi)

    for name, risk_arr in factor_risks.items():
        if name not in weights:
            raise ValueError(f"No weight configured for factor '{name}'.")

        if risk_arr.shape != fhi.shape:
            raise ValueError(
                f"Factor '{name}' does not match the reference grid."
            )

        valid = np.isfinite(risk_arr)
        valid_mask &= valid

        np.multiply(
            risk_arr,
            np.float32(weights[name]),
            out=weighted,
            where=valid,
            casting="unsafe",
        )

        np.add(fhi, weighted, out=fhi, where=valid)

    fhi[~valid_mask] = np.nan

    del weighted
    del valid_mask

    timed_end("Weighted overlay", started)
    return fhi


def classify_fhi(fhi, sample_size=50_000):
    labels = ["Very Low", "Low", "Moderate", "High", "Very High"]
    print_data_range("Flood Hotspot Index", fhi)

    classes = jenks_classify(
        fhi,
        n_classes=5,
        sample_size=sample_size,
    )

    return classes, labels


# ============================================================
# STEP 6 — RASTER EXPORT
# ============================================================

def export_raster(arr, profile, out_path):
    """Write a tiled, compressed GeoTIFF."""
    started = timed_start()
    ensure_out_dir(os.path.dirname(out_path))

    out_profile = profile.copy()
    out_profile.update(
        driver="GTiff",
        dtype="float32",
        count=1,
        nodata=np.nan,
        compress="LZW",
        tiled=True,
        BIGTIFF="IF_SAFER",
    )

    with rasterio.open(out_path, "w", **out_profile) as dst:
        dst.write(arr.astype(np.float32, copy=False), 1)

    timed_end(f"Exported {os.path.basename(out_path)}", started)
    return out_path


# ============================================================
# PLOT HELPERS
# ============================================================

def _display_array(arr, max_dimension=1800):
    """Downsample for plotting only; the analysis raster is unchanged."""
    height, width = arr.shape
    step = max(1, int(np.ceil(max(height, width) / max_dimension)))
    return arr[::step, ::step]


def _extent(profile, shape):
    height, width = shape
    transform = profile["transform"]

    return [
        transform.c,
        transform.c + transform.a * width,
        transform.f + transform.e * height,
        transform.f,
    ]


def _display_extent(profile, original_shape, display_shape):
    """
    Calculate the extent matching the downsampled array dimensions.
    This avoids stretching the final row/column across the full raster.
    """
    height, width = original_shape
    display_height, display_width = display_shape
    transform = profile["transform"]

    return [
        transform.c,
        transform.c + transform.a * min(width, display_width * max(
            1, int(np.ceil(max(height, width) / max(display_height, display_width)))
        )),
        transform.f + transform.e * min(height, display_height * max(
            1, int(np.ceil(max(height, width) / max(display_height, display_width)))
        )),
        transform.f,
    ]


# ============================================================
# STEP 7 — FACTOR DIAGNOSTIC MAP
# ============================================================

def plot_factor_diagnostic(factor_risks, profile, out_dir):
    started = timed_start()
    names = list(factor_risks.keys())

    ncols = 3
    nrows = int(np.ceil(len(names) / ncols))

    fig, axes = plt.subplots(
        nrows,
        ncols,
        figsize=(6 * ncols, 5 * nrows),
        squeeze=False,
    )

    axes = axes.flatten()

    for ax, name in zip(axes, names):
        arr = factor_risks[name]
        view = _display_array(
            arr,
            int(CONFIG.get("plot_max_dimension", 1800)),
        )

        im = ax.imshow(
            view,
            cmap="RdYlBu_r",
            extent=_extent(profile, arr.shape),
            vmin=1,
            vmax=5,
            interpolation="nearest",
        )

        ax.set_title(
            name.replace("_", " ").title(),
            fontsize=12,
            fontweight="bold",
        )
        ax.set_xticks([])
        ax.set_yticks([])

        fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    for ax in axes[len(names):]:
        ax.axis("off")

    fig.tight_layout()

    out_path = os.path.join(out_dir, "factor_diagnostic.png")
    fig.savefig(out_path, dpi=160, bbox_inches="tight")
    plt.close(fig)

    log(f"Diagnostic saved: {out_path}")
    timed_end("Factor diagnostic plot", started)

    return out_path


# ============================================================
# SCALE BAR
# ============================================================

def draw_scale_bar(
    ax,
    length_m,
    location=(0.60, 0.04),
    n_divisions=3,
    bar_height_frac=0.012,
    fontsize=9,
):
    xlim = ax.get_xlim()
    ylim = ax.get_ylim()

    x_range = xlim[1] - xlim[0]
    y_range = ylim[1] - ylim[0]

    x0 = xlim[0] + location[0] * x_range
    y0 = ylim[0] + location[1] * y_range

    bar_height = bar_height_frac * y_range
    segment_length = length_m / n_divisions

    for i in range(n_divisions):
        rect = mpatches.Rectangle(
            (x0 + i * segment_length, y0),
            segment_length,
            bar_height,
            facecolor="black" if i % 2 == 0 else "white",
            edgecolor="black",
            linewidth=0.8,
            zorder=10,
        )
        ax.add_patch(rect)

    ax.add_patch(
        mpatches.Rectangle(
            (x0, y0),
            length_m,
            bar_height,
            facecolor="none",
            edgecolor="black",
            linewidth=0.8,
            zorder=11,
        )
    )

    for i in range(n_divisions + 1):
        label_km = segment_length * i / 1000
        ax.text(
            x0 + i * segment_length,
            y0 + bar_height * 1.8,
            f"{label_km:.0f}" if i else "0",
            ha="center",
            va="bottom",
            fontsize=fontsize,
            zorder=11,
        )

    ax.text(
        x0 + length_m / 2,
        y0 - bar_height * 2.2,
        "km",
        ha="center",
        va="top",
        fontsize=fontsize,
        zorder=11,
    )


# ============================================================
# FINAL HOTSPOT MAP
# ============================================================

def plot_hotspot_map(
    classes,
    labels,
    profile,
    boundary,
    towns_gdf,
    out_path,
    title,
):
    started = timed_start()
    fig, ax = plt.subplots(figsize=(12, 12))

    colors = ["#2c7bb6", "#abd9e9", "#ffffbf", "#fdae61", "#d7191c"]
    cmap = ListedColormap(colors)
    norm = BoundaryNorm([0.5, 1.5, 2.5, 3.5, 4.5, 5.5], cmap.N)

    view = _display_array(
        classes,
        int(CONFIG.get("plot_max_dimension", 1800)),
    )

    # Use the same projected CRS for the raster, county and basemap.
    raster_crs = get_profile_crs(profile)
    extent = _extent(profile, classes.shape)

    ax.imshow(
        view,
        cmap=cmap,
        norm=norm,
        extent=extent,
        alpha=0.75,
        interpolation="nearest",
        zorder=2,
    )

    boundary.boundary.plot(
        ax=ax,
        color="black",
        linewidth=1.2,
        zorder=3,
    )

    # FIX: profile["crs"] may be a string. Convert it to a Rasterio CRS
    # before passing it to Contextily.
    try:
        cx.add_basemap(
            ax,
            crs=raster_crs.to_string(),
            source=cx.providers.OpenStreetMap.Mapnik,
            zorder=1,
        )
    except Exception as exc:
        # Keep the calculation successful even if basemap tiles are offline.
        log(f"Basemap unavailable; continuing without it: {exc}")

    if towns_gdf is not None and not towns_gdf.empty:
        towns_gdf.plot(
            ax=ax,
            color="black",
            marker="o",
            markersize=30,
            edgecolor="white",
            linewidth=0.8,
            zorder=4,
        )

        for _, row in towns_gdf.iterrows():
            ax.annotate(
                row["name"],
                xy=(row.geometry.x, row.geometry.y),
                xytext=(5, 5),
                textcoords="offset points",
                fontsize=8,
                fontweight="bold",
                color="black",
                path_effects=[
                    path_effects.withStroke(
                        linewidth=2.5,
                        foreground="white",
                    )
                ],
                zorder=5,
            )

    # North arrow.
    ax.annotate(
        "N",
        xy=(0.95, 0.96),
        xycoords="axes fraction",
        xytext=(0.95, 0.88),
        textcoords="axes fraction",
        fontsize=14,
        fontweight="bold",
        ha="center",
        va="center",
        arrowprops={"arrowstyle": "-|>", "color": "black", "lw": 2},
        zorder=6,
    )

    # Scale bar.
    map_width_m = extent[1] - extent[0]
    raw_length = max(map_width_m * 0.20, 1000)
    magnitude = 10 ** np.floor(np.log10(raw_length))
    scale_length_m = round(raw_length / magnitude) * magnitude

    draw_scale_bar(
        ax,
        length_m=scale_length_m,
        location=(0.60, 0.035),
        n_divisions=3,
    )

    for spine in ax.spines.values():
        spine.set_edgecolor("black")
        spine.set_linewidth(1.2)
        spine.set_visible(True)

    legend_patches = [
        mpatches.Patch(color=colors[i], label=labels[i])
        for i in range(5)
    ]

    ax.legend(
        handles=legend_patches,
        title="Flood Hotspot Category",
        loc="lower left",
        fontsize=9,
        title_fontsize=10,
        framealpha=0.92,
    )

    ax.set_title(title, fontsize=14, fontweight="bold", pad=14)
    ax.set_xlabel("Easting (m)")
    ax.set_ylabel("Northing (m)")
    ax.ticklabel_format(style="plain", axis="both")

    fig.tight_layout()
    fig.savefig(out_path, dpi=200, bbox_inches="tight")
    plt.close(fig)

    log(f"Hotspot map saved: {out_path}")
    timed_end("Final hotspot map", started)

    return out_path


# ============================================================
# STEP 8 — AREA SUMMARY
# ============================================================

def build_area_summary(classes, labels, pixel_size):
    """Calculate class area and percentage from valid classified pixels."""
    started = timed_start()
    valid = np.isfinite(classes)
    total_valid = int(np.count_nonzero(valid))
    pixel_area_km2 = (float(pixel_size) ** 2) / 1_000_000

    summary = []

    for class_number, label in enumerate(labels, start=1):
        count = int(np.count_nonzero(classes == class_number))
        area_km2 = count * pixel_area_km2
        percentage = (100.0 * count / total_valid) if total_valid else 0.0

        item = {
            "class": class_number,
            "label": label,
            "pixel_count": count,
            "area_km2": float(area_km2),
            "percentage": float(percentage),
        }
        summary.append(item)

        log(
            f"{label:<12}: {percentage:5.1f}% "
            f"({area_km2:,.2f} km²; {count:,} pixels)"
        )

    timed_end("Area summary", started)
    return summary


# ============================================================
# MAIN FLOOD HOTSPOT CALCULATION
# ============================================================

def run_flood_hotspot(config=None, weights=None):
    """
    Main Django-callable flood hotspot calculation.

    Available factors:
      1. Distance to river
      2. Rainfall
      3. Land cover

    Elevation and slope remain excluded because their input data
    are not currently available.

    Output files:
      - rainfall_reproj.tif
      - landcover_reproj.tif
      - flood_hotspot_index.tif
      - flood_hotspot_classes.tif
      - factor_diagnostic.png
      - flood_hotspot_map.png
    """
    overall_started = timed_start()
    config = dict(CONFIG if config is None else config)
    weights = dict(WEIGHTS if weights is None else weights)

    log("=" * 65)
    log("STARTING FLOOD HOTSPOT CALCULATION")
    log("=" * 65)

    expected_factors = {"dist_to_river", "rainfall", "landcover"}

    if set(weights) != expected_factors:
        raise ValueError(
            "Flood hotspot weights must contain exactly: "
            "dist_to_river, rainfall, landcover."
        )

    if not all(
        np.isfinite(value) and value >= 0
        for value in weights.values()
    ):
        raise ValueError(
            "All flood hotspot weights must be finite and non-negative."
        )

    weight_sum = sum(weights.values())

    if not np.isclose(weight_sum, 1.0, atol=1e-6):
        raise ValueError(
            f"Flood hotspot weights must sum to 1.0. Current sum: {weight_sum}"
        )

    required_keys = [
        "county_boundary",
        "rainfall_path",
        "landcover_path",
        "river_path",
        "out_dir",
        "target_crs",
        "target_resolution",
    ]

    for key in required_keys:
        if key not in config:
            raise ValueError(
                f"Missing required flood configuration value: '{key}'."
            )

    for key in (
        "county_boundary",
        "rainfall_path",
        "landcover_path",
        "river_path",
    ):
        path = config[key]
        if not os.path.isfile(path):
            raise FileNotFoundError(
                f"Required flood hotspot input '{key}' was not found: {path}"
            )

    ensure_out_dir(config["out_dir"])
    out_dir = config["out_dir"]

    log(f"Output directory: {os.path.abspath(out_dir)}")
    log(f"Target CRS: {config['target_crs']}")
    log(f"Target resolution: {config['target_resolution']} metres")
    log(f"Distance-to-river weight: {weights['dist_to_river']:.6f}")
    log(f"Rainfall weight:          {weights['rainfall']:.6f}")
    log(f"Land-cover weight:        {weights['landcover']:.6f}")
    log("Elevation: EXCLUDED")
    log("Slope: EXCLUDED")

    # STEP 1 — Reference grid.
    log("STEP 1/8 — Building reference grid")
    boundary, ref_profile = build_reference_grid(config)

    shape = (ref_profile["height"], ref_profile["width"])
    log(
        f"Analysis raster shape: {shape[0]:,} rows × "
        f"{shape[1]:,} columns"
    )

    # STEP 2 — Distance to river.
    log("STEP 2/8 — Processing distance to river")
    _, dist_risk = process_distance_to_river(
        config,
        ref_profile,
        boundary,
        out_dir,
    )

    # STEP 3 — Rainfall.
    log("STEP 3/8 — Processing rainfall")
    rain_risk = process_rainfall(
        config,
        ref_profile,
        boundary,
        out_dir,
    )

    # STEP 4 — Land cover.
    log("STEP 4/8 — Processing land cover")
    lc_risk = process_landcover(
        config,
        ref_profile,
        boundary,
        out_dir,
    )

    # STEP 5 — Weighted overlay and classification.
    log("STEP 5/8 — Computing Flood Hotspot Index")
    factor_risks = {
        "dist_to_river": dist_risk,
        "rainfall": rain_risk,
        "landcover": lc_risk,
    }

    fhi = compute_flood_hotspot_index(factor_risks, weights)
    classes, labels = classify_fhi(
        fhi,
        sample_size=int(config.get("jenks_sample_size", 50_000)),
    )

    # STEP 6 — Factor diagnostic map.
    log("STEP 6/8 — Creating factor diagnostic")
    diagnostic_path = plot_factor_diagnostic(
        factor_risks,
        ref_profile,
        out_dir,
    )

    # STEP 7 — Towns, rasters and final map.
    log("STEP 7/8 — Exporting maps and rasters")
    towns_gdf = build_towns_gdf(TOWNS, get_profile_crs(ref_profile))

    fhi_path = os.path.join(out_dir, "flood_hotspot_index.tif")
    classes_path = os.path.join(out_dir, "flood_hotspot_classes.tif")
    map_path = os.path.join(out_dir, "flood_hotspot_map.png")

    export_raster(fhi, ref_profile, fhi_path)
    export_raster(classes, ref_profile, classes_path)

    plot_hotspot_map(
        classes,
        labels,
        ref_profile,
        boundary,
        towns_gdf,
        map_path,
        "Flood Hotspot Map — Tana River County",
    )

    # STEP 8 — Area summary.
    log("STEP 8/8 — Calculating hotspot area summary")
    summary = build_area_summary(
        classes,
        labels,
        config["target_resolution"],
    )

    result = {
        "fhi": fhi,
        "classes": classes,
        "labels": labels,
        "profile": ref_profile,
        "boundary": boundary,
        "towns": towns_gdf,
        "outputs": {
            "fhi_raster": fhi_path,
            "classes_raster": classes_path,
            "diagnostic_map": diagnostic_path,
            "hotspot_map": map_path,
        },
        "summary": summary,
        "weights": weights,
        "original_weights": ORIGINAL_WEIGHTS,
        "excluded_factors": ["elevation", "slope"],
        "config": config,
    }

    timed_end("TOTAL FLOOD HOTSPOT CALCULATION", overall_started)

    log("=" * 65)
    log("FLOOD HOTSPOT CALCULATION COMPLETED")
    log(f"Outputs saved to: {os.path.abspath(out_dir)}")
    log("=" * 65)

    return result
