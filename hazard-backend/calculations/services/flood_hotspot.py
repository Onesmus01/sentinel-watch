import os

import numpy as np
import geopandas as gpd
import rasterio
from rasterio.mask import mask
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.features import rasterize

from scipy.ndimage import distance_transform_edt, gaussian_filter

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import ListedColormap, BoundaryNorm

import jenkspy
import contextily as cx

from django.conf import settings


# ============================================================
# DJANGO CONFIGURATION
# ============================================================

BASE_DIR = getattr(settings, "BASE_DIR", None)

if BASE_DIR is not None:
    BASE_DIR = str(BASE_DIR)


# ------------------------------------------------------------
# Input/output configuration
#
# These can later be moved completely into Django settings,
# database models, or GeoServer/WCS sources.
# ------------------------------------------------------------

CONFIG = {
    "county_boundary": getattr(
        settings,
        "FLOOD_COUNTY_BOUNDARY",
        r"C:\Users\HP\VIOML\TR_Flood_Hotspots_Mapping\TanaRiver_County.geojson",
    ),

    "dem_path": getattr(
        settings,
        "FLOOD_DEM_PATH",
        r"C:\Users\HP\VIOML\TR_Flood_Hotspots_Mapping\TanaRiver_DEM.tif",
    ),

    "rainfall_path": getattr(
        settings,
        "FLOOD_RAINFALL_PATH",
        r"C:\Users\HP\VIOML\TR_Flood_Hotspots_Mapping\TanaRiver_Rainfall_2026.tif",
    ),

    "landcover_path": getattr(
        settings,
        "FLOOD_LANDCOVER_PATH",
        r"C:\Users\HP\VIOML\TR_Flood_Hotspots_Mapping\TanaRiver_ESA_WorldCover_2021.tif",
    ),

    "river_path": getattr(
        settings,
        "FLOOD_RIVER_PATH",
        r"C:\Users\HP\VIOML\TR_Flood_Hotspots_Mapping\TR_Rivers.geojson",
    ),

    "out_dir": getattr(
        settings,
        "FLOOD_OUTPUT_DIR",
        os.path.join(BASE_DIR, "media", "flood_hotspots")
        if BASE_DIR
        else r"C:\sentinel-watch\flood_outputs",
    ),

    "target_crs": getattr(
        settings,
        "FLOOD_TARGET_CRS",
        "EPSG:32637",
    ),

    "target_resolution": getattr(
        settings,
        "FLOOD_TARGET_RESOLUTION",
        30,
    ),

    "river_dist_smooth_sigma": getattr(
        settings,
        "FLOOD_RIVER_DISTANCE_SMOOTH_SIGMA",
        3,
    ),
}


# ============================================================
# AHP WEIGHTS
# ============================================================

WEIGHTS = {
    "elevation": 0.25,
    "slope": 0.15,
    "dist_to_river": 0.35,
    "rainfall": 0.20,
    "landcover": 0.05,
}


# ============================================================
# ESA WORLDCOVER 2021 RISK SCORES
# 1 = Low Risk
# 5 = High Risk
# ============================================================

LANDCOVER_RISK = {
    10: 1,    # Tree cover
    20: 2,    # Shrubland
    30: 3,    # Grassland
    40: 5,    # Cropland
    50: 4,    # Built-up
    60: 5,    # Bare / sparse vegetation
    70: 1,    # Snow/ice
    80: 5,    # Permanent water
    90: 5,    # Herbaceous wetland
    95: 3,    # Mangroves
    100: 3,   # Moss/lichen
}


# ============================================================
# MAJOR TOWNS — TANA RIVER COUNTY
# WGS84 longitude / latitude
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
# HELPERS
# ============================================================

def ensure_out_dir(path):
    os.makedirs(path, exist_ok=True)


def reproject_raster_to_match(
    src_path,
    ref_profile,
    out_path,
    resampling=Resampling.bilinear,
):
    """
    Reproject a raster so that it matches the reference raster grid.
    """

    with rasterio.open(src_path) as src:

        out_profile = ref_profile.copy()

        out_profile.update(
            dtype="float32",
            count=1,
            nodata=np.nan,
        )

        out_arr = np.full(
            (
                ref_profile["height"],
                ref_profile["width"],
            ),
            np.nan,
            dtype="float32",
        )

        reproject(
            source=rasterio.band(src, 1),
            destination=out_arr,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=ref_profile["transform"],
            dst_crs=ref_profile["crs"],
            resampling=resampling,
        )

        with rasterio.open(
            out_path,
            "w",
            **out_profile,
        ) as dst:

            dst.write(out_arr, 1)

    return out_path


def clip_raster_to_boundary(
    raster_path,
    boundary_gdf,
    out_path,
):
    """
    Clip raster to county boundary.
    """

    with rasterio.open(raster_path) as src:

        geoms = boundary_gdf.geometry.values

        out_image, out_transform = mask(
            src,
            geoms,
            crop=True,
            nodata=np.nan,
        )

        out_profile = src.profile.copy()

        out_profile.update(
            height=out_image.shape[1],
            width=out_image.shape[2],
            transform=out_transform,
            nodata=np.nan,
            dtype="float32",
        )

        with rasterio.open(
            out_path,
            "w",
            **out_profile,
        ) as dst:

            dst.write(
                out_image.astype("float32")
            )

    return out_path


def print_data_range(name, arr):
    """
    Print diagnostic statistics.
    """

    valid = arr[~np.isnan(arr)]

    if valid.size == 0:
        print(f"  [{name}] No valid data")
        return

    print(
        f"  [{name}] "
        f"min={valid.min():.1f}  "
        f"p10={np.percentile(valid, 10):.1f}  "
        f"p25={np.percentile(valid, 25):.1f}  "
        f"median={np.median(valid):.1f}  "
        f"p75={np.percentile(valid, 75):.1f}  "
        f"p90={np.percentile(valid, 90):.1f}  "
        f"max={valid.max():.1f}"
    )


def build_towns_gdf(towns_dict, target_crs):
    """
    Convert town coordinates from WGS84 into target CRS.
    """

    names = list(towns_dict.keys())

    lons = [
        value[0]
        for value in towns_dict.values()
    ]

    lats = [
        value[1]
        for value in towns_dict.values()
    ]

    gdf = gpd.GeoDataFrame(
        {"name": names},
        geometry=gpd.points_from_xy(
            lons,
            lats,
        ),
        crs="EPSG:4326",
    )

    return gdf.to_crs(target_crs)


# ============================================================
# CLASSIFICATION METHODS
# ============================================================

def jenks_classify(arr, n_classes=5):
    """
    Jenks Natural Breaks classification.

    Uses up to 50,000 sampled valid pixels for performance.
    """

    valid = arr[~np.isnan(arr)].flatten()

    if valid.size == 0:
        return np.full(
            arr.shape,
            np.nan,
            dtype="float32",
        )

    if valid.size < n_classes:
        raise ValueError(
            f"Not enough valid values for "
            f"{n_classes} Jenks classes."
        )

    sample = valid[
        ::max(
            1,
            len(valid) // 50000,
        )
    ]

    breaks = jenkspy.jenks_breaks(
        sample.tolist(),
        n_classes=n_classes,
    )

    classed = np.full(
        arr.shape,
        np.nan,
        dtype="float32",
    )

    for i in range(n_classes):

        lo = breaks[i]

        hi = (
            breaks[i + 1]
            + (1e-6 if i == n_classes - 1 else 0)
        )

        classed[
            (arr >= lo) &
            (arr < hi)
        ] = i + 1

    return classed


def classify_elevation_absolute(dem):
    """
    Elevation risk classification.

    Lower elevation = higher flood risk.
    """

    risk = np.full(
        dem.shape,
        np.nan,
        dtype="float32",
    )

    risk[dem <= 50] = 5

    risk[
        (dem > 50) &
        (dem <= 150)
    ] = 4

    risk[
        (dem > 150) &
        (dem <= 300)
    ] = 3

    risk[
        (dem > 300) &
        (dem <= 500)
    ] = 2

    risk[dem > 500] = 1

    risk[np.isnan(dem)] = np.nan

    return risk


def classify_slope_absolute(slope_deg):
    """
    Slope risk classification.

    Flatter terrain = higher pooling risk.
    """

    risk = np.full(
        slope_deg.shape,
        np.nan,
        dtype="float32",
    )

    risk[slope_deg <= 2] = 5

    risk[
        (slope_deg > 2) &
        (slope_deg <= 5)
    ] = 4

    risk[
        (slope_deg > 5) &
        (slope_deg <= 10)
    ] = 3

    risk[
        (slope_deg > 10) &
        (slope_deg <= 20)
    ] = 2

    risk[slope_deg > 20] = 1

    risk[np.isnan(slope_deg)] = np.nan

    return risk


def classify_distance_to_river_absolute(dist_metres):
    """
    River proximity classification.
    """

    risk = np.full(
        dist_metres.shape,
        np.nan,
        dtype="float32",
    )

    risk[dist_metres <= 1000] = 5

    risk[
        (dist_metres > 1000) &
        (dist_metres <= 3000)
    ] = 4

    risk[
        (dist_metres > 3000) &
        (dist_metres <= 7000)
    ] = 3

    risk[
        (dist_metres > 7000) &
        (dist_metres <= 15000)
    ] = 2

    risk[dist_metres > 15000] = 1

    return risk


def classify_rainfall_percentile(rain):
    """
    Percentile-based rainfall classification.
    """

    valid = rain[~np.isnan(rain)]

    if valid.size == 0:
        raise ValueError(
            "Rainfall raster contains no valid data."
        )

    thresholds = np.percentile(
        valid,
        [20, 40, 60, 80],
    )

    risk = np.full(
        rain.shape,
        np.nan,
        dtype="float32",
    )

    risk[
        rain <= thresholds[0]
    ] = 1

    risk[
        (rain > thresholds[0]) &
        (rain <= thresholds[1])
    ] = 2

    risk[
        (rain > thresholds[1]) &
        (rain <= thresholds[2])
    ] = 3

    risk[
        (rain > thresholds[2]) &
        (rain <= thresholds[3])
    ] = 4

    risk[
        rain > thresholds[3]
    ] = 5

    risk[np.isnan(rain)] = np.nan

    print(
        "  [rainfall] percentile thresholds "
        "(20/40/60/80): "
        f"{thresholds[0]:.1f} / "
        f"{thresholds[1]:.1f} / "
        f"{thresholds[2]:.1f} / "
        f"{thresholds[3]:.1f} mm"
    )

    return risk


# ============================================================
# STEP 1 — REFERENCE GRID
# ============================================================

def build_reference_grid(config):
    """
    Build the common analysis grid from the DEM.
    """

    boundary = (
        gpd.read_file(
            config["county_boundary"]
        )
        .to_crs(
            config["target_crs"]
        )
    )

    with rasterio.open(
        config["dem_path"]
    ) as src:

        transform, width, height = (
            calculate_default_transform(
                src.crs,
                config["target_crs"],
                src.width,
                src.height,
                *src.bounds,
                resolution=config[
                    "target_resolution"
                ],
            )
        )

        ref_profile = src.profile.copy()

        ref_profile.update(
            crs=config["target_crs"],
            transform=transform,
            width=width,
            height=height,
            dtype="float32",
            nodata=np.nan,
        )

    return boundary, ref_profile


# ============================================================
# STEP 2 — ELEVATION
# ============================================================

def process_elevation(
    config,
    ref_profile,
    boundary,
    out_dir,
):

    reproj_path = os.path.join(
        out_dir,
        "dem_reproj.tif",
    )

    reproject_raster_to_match(
        config["dem_path"],
        ref_profile,
        reproj_path,
    )

    clipped_path = os.path.join(
        out_dir,
        "dem_clipped.tif",
    )

    clip_raster_to_boundary(
        reproj_path,
        boundary,
        clipped_path,
    )

    with rasterio.open(
        clipped_path
    ) as src:

        dem = src.read(1)
        profile = src.profile

    print_data_range(
        "elevation (m)",
        dem,
    )

    risk = classify_elevation_absolute(
        dem
    )

    return dem, risk, profile


# ============================================================
# STEP 3 — SLOPE
# ============================================================

def compute_slope(
    dem,
    profile,
):

    px = profile["transform"][0]
    py = -profile["transform"][4]

    dzdx, dzdy = np.gradient(
        dem,
        px,
        py,
    )

    slope_rad = np.arctan(
        np.sqrt(
            dzdx ** 2 +
            dzdy ** 2
        )
    )

    slope_deg = np.degrees(
        slope_rad
    )

    slope_deg[
        np.isnan(dem)
    ] = np.nan

    return slope_deg


def process_slope(
    dem,
    profile,
):

    slope_deg = compute_slope(
        dem,
        profile,
    )

    print_data_range(
        "slope (degrees)",
        slope_deg,
    )

    risk = classify_slope_absolute(
        slope_deg
    )

    return risk


# ============================================================
# STEP 4 — DISTANCE TO RIVER
# ============================================================

def process_distance_to_river(
    config,
    ref_profile,
    boundary,
    out_dir,
):

    rivers = (
        gpd.read_file(
            config["river_path"]
        )
        .to_crs(
            ref_profile["crs"]
        )
    )

    rivers = gpd.clip(
        rivers,
        boundary,
    )

    geometries = [
        geom
        for geom in rivers.geometry
        if geom is not None
    ]

    if not geometries:
        raise ValueError(
            "No river geometries were found "
            "inside the county boundary."
        )

    river_raster = rasterize(
        [
            (geom, 1)
            for geom in geometries
        ],
        out_shape=(
            ref_profile["height"],
            ref_profile["width"],
        ),
        transform=ref_profile["transform"],
        fill=0,
        dtype="uint8",
    )

    pixel_size = (
        ref_profile["transform"][0]
    )

    dist_pixels = distance_transform_edt(
        river_raster == 0
    )

    dist_metres = (
        dist_pixels *
        pixel_size
    )

    print_data_range(
        "distance to river (m) — raw",
        dist_metres,
    )

    sigma = config.get(
        "river_dist_smooth_sigma",
        0,
    )

    if sigma and sigma > 0:

        dist_metres = gaussian_filter(
            dist_metres,
            sigma=sigma,
        )

        print_data_range(
            "distance to river (m) — smoothed",
            dist_metres,
        )

    risk = classify_distance_to_river_absolute(
        dist_metres
    )

    return dist_metres, risk


# ============================================================
# STEP 5 — RAINFALL
# ============================================================

def process_rainfall(
    config,
    ref_profile,
    boundary,
    out_dir,
):

    reproj_path = os.path.join(
        out_dir,
        "rainfall_reproj.tif",
    )

    reproject_raster_to_match(
        config["rainfall_path"],
        ref_profile,
        reproj_path,
    )

    clipped_path = os.path.join(
        out_dir,
        "rainfall_clipped.tif",
    )

    clip_raster_to_boundary(
        reproj_path,
        boundary,
        clipped_path,
    )

    with rasterio.open(
        clipped_path
    ) as src:

        rain = src.read(1)

    print_data_range(
        "rainfall (mm)",
        rain,
    )

    risk = classify_rainfall_percentile(
        rain
    )

    return risk


# ============================================================
# STEP 6 — LAND COVER
# ============================================================

def process_landcover(
    config,
    ref_profile,
    boundary,
    out_dir,
):

    reproj_path = os.path.join(
        out_dir,
        "landcover_reproj.tif",
    )

    reproject_raster_to_match(
        config["landcover_path"],
        ref_profile,
        reproj_path,
        resampling=Resampling.nearest,
    )

    clipped_path = os.path.join(
        out_dir,
        "landcover_clipped.tif",
    )

    clip_raster_to_boundary(
        reproj_path,
        boundary,
        clipped_path,
    )

    with rasterio.open(
        clipped_path
    ) as src:

        lc = src.read(1)

    risk = np.full(
        lc.shape,
        np.nan,
        dtype="float32",
    )

    for code, score in LANDCOVER_RISK.items():

        risk[
            lc == code
        ] = score

    return risk


# ============================================================
# STEP 7 — WEIGHTED OVERLAY
# ============================================================

def compute_flood_hotspot_index(
    factor_risks,
    weights,
):

    fhi = np.zeros_like(
        factor_risks["elevation"],
        dtype="float32",
    )

    valid_mask = np.ones_like(
        fhi,
        dtype=bool,
    )

    for name, risk_arr in factor_risks.items():

        valid_mask &= ~np.isnan(
            risk_arr
        )

        fhi += (
            np.nan_to_num(
                risk_arr,
                nan=0.0,
            )
            *
            weights[name]
        )

    fhi[
        ~valid_mask
    ] = np.nan

    return fhi


def classify_fhi(fhi):

    labels = [
        "Very Low",
        "Low",
        "Moderate",
        "High",
        "Very High",
    ]

    print_data_range(
        "Flood Hotspot Index (FHI)",
        fhi,
    )

    classes = jenks_classify(
        fhi,
        n_classes=5,
    )

    return classes, labels


# ============================================================
# STEP 8 — RASTER EXPORT
# ============================================================

def export_raster(
    arr,
    profile,
    out_path,
):

    out_profile = profile.copy()

    out_profile.update(
        dtype="float32",
        count=1,
        nodata=np.nan,
    )

    with rasterio.open(
        out_path,
        "w",
        **out_profile,
    ) as dst:

        dst.write(
            arr.astype("float32"),
            1,
        )

    return out_path


# ============================================================
# STEP 9 — FACTOR DIAGNOSTIC MAP
# ============================================================

def plot_factor_diagnostic(
    factor_risks,
    profile,
    out_dir,
):

    t = profile["transform"]

    h, w = next(
        iter(
            factor_risks.values()
        )
    ).shape

    extent = [
        t.c,
        t.c + t.a * w,
        t.f + t.e * h,
        t.f,
    ]

    n = len(factor_risks)

    ncols = 3

    nrows = int(
        np.ceil(
            n / ncols
        )
    )

    fig, axes = plt.subplots(
        nrows,
        ncols,
        figsize=(
            6 * ncols,
            6 * nrows,
        ),
    )

    axes = np.atleast_1d(
        axes
    ).flatten()

    for ax, (
        name,
        arr,
    ) in zip(
        axes,
        factor_risks.items(),
    ):

        im = ax.imshow(
            arr,
            cmap="RdYlBu_r",
            extent=extent,
            vmin=1,
            vmax=5,
        )

        ax.set_title(
            name,
            fontsize=12,
            fontweight="bold",
        )

        ax.set_xticks([])
        ax.set_yticks([])

        plt.colorbar(
            im,
            ax=ax,
            fraction=0.046,
            pad=0.04,
        )

    for ax in axes[n:]:
        ax.axis("off")

    plt.tight_layout()

    out_path = os.path.join(
        out_dir,
        "factor_diagnostic.png",
    )

    plt.savefig(
        out_path,
        dpi=200,
        bbox_inches="tight",
    )

    plt.close()

    print(
        f"  Diagnostic saved → {out_path}"
    )

    return out_path


# ============================================================
# SCALE BAR
# ============================================================

def draw_scale_bar(
    ax,
    length_m,
    location=(0.62, 0.05),
    n_divisions=3,
    bar_height_frac=0.012,
    fontsize=9,
):

    xlim = ax.get_xlim()
    ylim = ax.get_ylim()

    x_range = (
        xlim[1] -
        xlim[0]
    )

    y_range = (
        ylim[1] -
        ylim[0]
    )

    x0 = (
        xlim[0] +
        location[0] *
        x_range
    )

    y0 = (
        ylim[0] +
        location[1] *
        y_range
    )

    bar_height = (
        bar_height_frac *
        y_range
    )

    seg_length = (
        length_m /
        n_divisions
    )

    for i in range(
        n_divisions
    ):

        color = (
            "black"
            if i % 2 == 0
            else "white"
        )

        rect = mpatches.Rectangle(
            (
                x0 +
                i *
                seg_length,
                y0,
            ),
            seg_length,
            bar_height,
            facecolor=color,
            edgecolor="black",
            linewidth=1.0,
            zorder=10,
        )

        ax.add_patch(rect)

    border = mpatches.Rectangle(
        (x0, y0),
        length_m,
        bar_height,
        facecolor="none",
        edgecolor="black",
        linewidth=1.0,
        zorder=11,
    )

    ax.add_patch(border)

    for i in range(
        n_divisions + 1
    ):

        label_val_km = (
            seg_length *
            i /
            1000
        )

        label = (
            f"{label_val_km:.0f}"
            if i > 0
            else "0"
        )

        ax.text(
            x0 +
            i *
            seg_length,
            y0 +
            bar_height *
            1.8,
            label,
            ha="center",
            va="bottom",
            fontsize=fontsize,
            zorder=11,
        )

    ax.text(
        x0 +
        length_m / 2,
        y0 -
        bar_height *
        2.2,
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

    fig, ax = plt.subplots(
        figsize=(12, 12)
    )

    colors = [
        "#2c7bb6",
        "#abd9e9",
        "#ffffbf",
        "#fdae61",
        "#d7191c",
    ]

    cmap = ListedColormap(
        colors
    )

    norm = BoundaryNorm(
        [
            0.5,
            1.5,
            2.5,
            3.5,
            4.5,
            5.5,
        ],
        cmap.N,
    )

    t = profile["transform"]

    h, w = classes.shape

    extent = [
        t.c,
        t.c + t.a * w,
        t.f + t.e * h,
        t.f,
    ]

    ax.imshow(
        classes,
        cmap=cmap,
        norm=norm,
        extent=extent,
        alpha=0.75,
        zorder=2,
    )

    boundary.boundary.plot(
        ax=ax,
        color="black",
        linewidth=1.5,
        zorder=3,
    )

    # --------------------------------------------------------
    # Basemap
    # --------------------------------------------------------

    try:

        cx.add_basemap(
            ax,
            crs=profile[
                "crs"
            ].to_string(),
            source=(
                cx.providers.CartoDB.Positron
            ),
            zorder=1,
        )

    except Exception as e:

        print(
            "  [warning] Basemap could "
            f"not be added ({e}). "
            "Check internet access / "
            "contextily installation."
        )

    # --------------------------------------------------------
    # Towns
    # --------------------------------------------------------

    if (
        towns_gdf is not None
        and not towns_gdf.empty
    ):

        towns_gdf.plot(
            ax=ax,
            color="black",
            marker="o",
            markersize=35,
            edgecolor="white",
            linewidth=0.8,
            zorder=4,
        )

        for _, row in towns_gdf.iterrows():

            ax.annotate(
                row["name"],
                xy=(
                    row.geometry.x,
                    row.geometry.y,
                ),
                xytext=(6, 6),
                textcoords="offset points",
                fontsize=9,
                fontweight="bold",
                color="black",
                path_effects=[
                    __import__(
                        "matplotlib.patheffects",
                        fromlist=[
                            "withStroke"
                        ],
                    ).withStroke(
                        linewidth=2.5,
                        foreground="white",
                    )
                ],
                zorder=5,
            )

    # --------------------------------------------------------
    # North Arrow
    # --------------------------------------------------------

    x_arrow = 0.95
    y_arrow = 0.95

    ax.annotate(
        "N",
        xy=(
            x_arrow,
            y_arrow,
        ),
        xycoords="axes fraction",
        xytext=(
            x_arrow,
            y_arrow - 0.08,
        ),
        textcoords="axes fraction",
        fontsize=14,
        fontweight="bold",
        ha="center",
        va="center",
        color="black",
        arrowprops=dict(
            arrowstyle="-|>",
            color="black",
            lw=2,
            shrinkA=0,
            shrinkB=0,
        ),
        zorder=6,
    )

    # --------------------------------------------------------
    # Scale Bar
    # --------------------------------------------------------

    map_width_m = (
        extent[1] -
        extent[0]
    )

    raw_length = (
        map_width_m *
        0.25
    )

    magnitude = (
        10 **
        np.floor(
            np.log10(
                raw_length
            )
        )
    )

    scale_length_m = (
        round(
            raw_length /
            magnitude
        )
        *
        magnitude
    )

    draw_scale_bar(
        ax,
        length_m=scale_length_m,
        location=(0.60, 0.03),
        n_divisions=3,
    )

    # --------------------------------------------------------
    # Map Border
    # --------------------------------------------------------

    for spine in ax.spines.values():

        spine.set_edgecolor(
            "black"
        )

        spine.set_linewidth(
            1.3
        )

        spine.set_visible(
            True
        )

    # --------------------------------------------------------
    # Legend
    # --------------------------------------------------------

    patches = [
        mpatches.Patch(
            color=colors[i],
            label=labels[i],
        )
        for i in range(5)
    ]

    ax.legend(
        handles=patches,
        title="Flood Hotspot Category",
        loc="lower left",
        fontsize=10,
        title_fontsize=11,
        framealpha=0.9,
    )

    # --------------------------------------------------------
    # Titles / Labels
    # --------------------------------------------------------

    ax.set_title(
        title,
        fontsize=15,
        fontweight="bold",
        pad=15,
    )

    ax.set_xlabel(
        "Easting (m)",
        fontsize=11,
    )

    ax.set_ylabel(
        "Northing (m)",
        fontsize=11,
    )

    ax.ticklabel_format(
        style="plain",
        axis="both",
    )

    plt.tight_layout()

    plt.savefig(
        out_path,
        dpi=300,
        bbox_inches="tight",
    )

    plt.close()

    print(
        f"  Map saved → {out_path}"
    )

    return out_path


# ============================================================
# MAIN FLOOD HOTSPOT CALCULATION
# ============================================================

def run_flood_hotspot(
    config=None,
    weights=None,
):
    """
    Main Django-callable flood hotspot calculation.

    Returns a dictionary containing:

        {
            "fhi": ...,
            "classes": ...,
            "labels": ...,
            "profile": ...,
            "boundary": ...,
            "towns": ...,
            "outputs": {...},
            "summary": [...]
        }

    The actual calculation logic remains the same as the
    original standalone script.
    """

    config = config or CONFIG
    weights = weights or WEIGHTS

    # --------------------------------------------------------
    # Validate weights
    # --------------------------------------------------------

    weight_sum = sum(
        weights.values()
    )

    if not np.isclose(
        weight_sum,
        1.0,
        atol=1e-6,
    ):
        raise ValueError(
            "Flood hotspot AHP weights "
            f"must sum to 1.0. "
            f"Current sum: {weight_sum}"
        )

    # --------------------------------------------------------
    # Validate input files
    # --------------------------------------------------------

    required_files = {
        "county_boundary": config[
            "county_boundary"
        ],
        "dem_path": config[
            "dem_path"
        ],
        "rainfall_path": config[
            "rainfall_path"
        ],
        "landcover_path": config[
            "landcover_path"
        ],
        "river_path": config[
            "river_path"
        ],
    }

    for name, path in required_files.items():

        if not os.path.exists(path):

            raise FileNotFoundError(
                f"Required flood hotspot input "
                f"'{name}' was not found: {path}"
            )

    # --------------------------------------------------------
    # Output directory
    # --------------------------------------------------------

    ensure_out_dir(
        config["out_dir"]
    )

    out_dir = config[
        "out_dir"
    ]

    print(
        "\n============================================================"
    )

    print(
        "FLOOD HOTSPOT CALCULATION"
    )

    print(
        "============================================================"
    )

    # --------------------------------------------------------
    # Step 1 — Reference grid
    # --------------------------------------------------------

    print(
        "\n── Step 1: Building reference grid from DEM ──"
    )

    boundary, ref_profile = (
        build_reference_grid(
            config
        )
    )

    # --------------------------------------------------------
    # Step 2 — Elevation
    # --------------------------------------------------------

    print(
        "\n── Step 2: Processing elevation ──"
    )

    dem, elev_risk, dem_profile = (
        process_elevation(
            config,
            ref_profile,
            boundary,
            out_dir,
        )
    )

    # --------------------------------------------------------
    # Step 3 — Slope
    # --------------------------------------------------------

    print(
        "\n── Step 3: Computing slope ──"
    )

    slope_risk = process_slope(
        dem,
        dem_profile,
    )

    # --------------------------------------------------------
    # Step 4 — Distance to river
    # --------------------------------------------------------

    print(
        "\n── Step 4: Distance to river ──"
    )

    _, dist_risk = (
        process_distance_to_river(
            config,
            dem_profile,
            boundary,
            out_dir,
        )
    )

    # --------------------------------------------------------
    # Step 5 — Rainfall
    # --------------------------------------------------------

    print(
        "\n── Step 5: Rainfall ──"
    )

    rain_risk = process_rainfall(
        config,
        dem_profile,
        boundary,
        out_dir,
    )

    # --------------------------------------------------------
    # Step 6 — Land cover
    # --------------------------------------------------------

    print(
        "\n── Step 6: Land cover ──"
    )

    lc_risk = process_landcover(
        config,
        dem_profile,
        boundary,
        out_dir,
    )

    # --------------------------------------------------------
    # Step 7 — Weighted overlay
    # --------------------------------------------------------

    print(
        "\n── Step 7: Weighted overlay → "
        "Flood Hotspot Index ──"
    )

    factor_risks = {
        "elevation": elev_risk,
        "slope": slope_risk,
        "dist_to_river": dist_risk,
        "rainfall": rain_risk,
        "landcover": lc_risk,
    }

    fhi = compute_flood_hotspot_index(
        factor_risks,
        weights,
    )

    classes, labels = classify_fhi(
        fhi
    )

    # --------------------------------------------------------
    # Step 7b — Diagnostics
    # --------------------------------------------------------

    print(
        "\n── Step 7b: Per-factor diagnostic plot ──"
    )

    diagnostic_path = (
        plot_factor_diagnostic(
            factor_risks,
            dem_profile,
            out_dir,
        )
    )

    # --------------------------------------------------------
    # Step 8 — Towns
    # --------------------------------------------------------

    print(
        "\n── Step 8: Preparing town labels ──"
    )

    towns_gdf = build_towns_gdf(
        TOWNS,
        dem_profile["crs"],
    )

    # --------------------------------------------------------
    # Step 9 — Export outputs
    # --------------------------------------------------------

    print(
        "\n── Step 9: Exporting outputs ──"
    )

    fhi_path = os.path.join(
        out_dir,
        "flood_hotspot_index.tif",
    )

    classes_path = os.path.join(
        out_dir,
        "flood_hotspot_classes.tif",
    )

    map_path = os.path.join(
        out_dir,
        "flood_hotspot_map.png",
    )

    export_raster(
        fhi,
        dem_profile,
        fhi_path,
    )

    export_raster(
        classes,
        dem_profile,
        classes_path,
    )

    plot_hotspot_map(
        classes,
        labels,
        dem_profile,
        boundary,
        towns_gdf,
        map_path,
        "Flood Hotspot Map — Tana River County",
    )

    # --------------------------------------------------------
    # Area summary
    # --------------------------------------------------------

    print(
        "\n── Flood Hotspot Area Summary ──"
    )

    total_valid = np.sum(
        ~np.isnan(classes)
    )

    summary = []

    for i, label in enumerate(
        labels,
        start=1,
    ):

        count = np.sum(
            classes == i
        )

        area_km2 = (
            count *
            (
                config[
                    "target_resolution"
                ] ** 2
            )
            /
            1e6
        )

        if total_valid > 0:
            pct = (
                100 *
                count /
                total_valid
            )
        else:
            pct = 0

        item = {
            "class": i,
            "label": label,
            "pixel_count": int(count),
            "area_km2": float(
                area_km2
            ),
            "percentage": float(
                pct
            ),
        }

        summary.append(item)

        print(
            f"  {label:<12}: "
            f"{pct:5.1f}%  "
            f"({area_km2:,.0f} km²)"
        )

    # --------------------------------------------------------
    # Result object for Django/API layer
    # --------------------------------------------------------

    result = {
        "fhi": fhi,
        "classes": classes,
        "labels": labels,
        "profile": dem_profile,
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

        "config": config,
    }

    print(
        "\n============================================================"
    )

    print(
        "Flood hotspot calculation completed."
    )

    print(
        f"Outputs saved to: "
        f"{os.path.abspath(out_dir)}"
    )

    print(
        "============================================================"
    )

    return result