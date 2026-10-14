import logging

import numpy as np
import requests
import rasterio
from affine import Affine
from rasterio.errors import WindowError
from rasterio.features import rasterize
from rasterio.windows import Window, from_bounds, transform as window_transform
from shapely.geometry import shape

from django.conf import settings


logger = logging.getLogger(__name__)

COUNTY_NAME = "Tana River"

RISK_LABELS = {
    1: "Very Low",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Very High",
}

CLASS_NAMES = {
    1: "veryLow",
    2: "low",
    3: "moderate",
    4: "high",
    5: "veryHigh",
}


def _get_tana_river_wards():
    """Fetch ward polygons for Tana River from GeoServer."""

    url = settings.GEOSERVER_URL.rstrip("/") + "/wfs"

    response = requests.get(
        url,
        params={
            "service": "WFS",
            "version": "1.1.0",
            "request": "GetFeature",
            "typeName": "Rangelands:wards",
            "outputFormat": "application/json",
            "maxFeatures": 500,
            "CQL_FILTER": "name_1='Tana River'",
        },
        auth=(
            settings.GEOSERVER_USERNAME,
            settings.GEOSERVER_PASSWORD,
        ),
        timeout=120,
    )
    response.raise_for_status()

    features = response.json().get("features", [])
    wards = []

    for feature in features:
        properties = feature.get("properties") or {}
        geometry_data = feature.get("geometry")

        if properties.get("name_1") != COUNTY_NAME or not geometry_data:
            continue

        geometry = shape(geometry_data)

        if geometry.is_empty:
            continue

        wards.append({
            "id": str(
                properties.get("code")
                or feature.get("id")
                or geometry.wkb_hex[:16]
            ),
            "name": str(
                properties.get("name_3")
                or properties.get("ward")
                or "Unnamed ward"
            ),
            "subCounty": str(
                properties.get("name_2")
                or properties.get("constituency")
                or "Unknown"
            ),
            "county": COUNTY_NAME,
            "geometry": geometry,
        })

    if not wards:
        raise RuntimeError(
            "No Tana River wards were returned by Rangelands:wards. "
            "Check the layer and its name_1 attribute."
        )

    return wards


def calculate_ward_flood_stats(result):
    """Calculate flood-class percentages and affected area per ward."""

    raster_path = result.get("outputs", {}).get("classes_raster")

    if not raster_path:
        raise RuntimeError(
            "The flood calculation did not return a classes_raster path."
        )

    wards = _get_tana_river_wards()
    output = []

    with rasterio.open(raster_path) as src:
        # Overlay correction only; the stored raster is not modified.
        overlay_transform = (
            Affine.translation(0, 10_000_000) * src.transform
        )

        raster_bounds = Window(0, 0, src.width, src.height)
        cell_area_km2 = (
            abs(src.transform.a * src.transform.e) / 1_000_000
        )

        if not np.isfinite(cell_area_km2) or cell_area_km2 <= 0:
            raise RuntimeError("The raster cell area is invalid.")

        for ward in wards:
            geometry = ward["geometry"]

            try:
                window = from_bounds(
                    *geometry.bounds,
                    transform=overlay_transform,
                ).round_offsets().round_lengths()

                window = window.intersection(raster_bounds)
            except (WindowError, ValueError):
                logger.warning(
                    "Could not find a raster window for ward %s.",
                    ward["name"],
                )
                continue

            if window.width <= 0 or window.height <= 0:
                continue

            data = src.read(1, window=window)

            if data.size == 0:
                continue

            ward_mask = rasterize(
                [(geometry, 1)],
                out_shape=data.shape,
                transform=window_transform(window, overlay_transform),
                fill=0,
                all_touched=False,
                dtype="uint8",
            ).astype(bool)

            valid = (
                ward_mask
                & np.isfinite(data)
                & np.isin(data, [1, 2, 3, 4, 5])
            )
            values = data[valid].astype("uint8")

            if values.size == 0:
                logger.warning(
                    "No valid classified pixels for ward %s.",
                    ward["name"],
                )
                continue

            counts = {
                number: int(np.count_nonzero(values == number))
                for number in range(1, 6)
            }
            total = int(values.size)

            percentages = {
                CLASS_NAMES[number]: round(
                    counts[number] * 100.0 / total, 2
                )
                for number in range(1, 6)
            }

            mean_class = float(values.mean())
            risk_class = max(
                1,
                min(5, int(np.floor(mean_class + 0.5))),
            )

            output.append({
                "id": ward["id"],
                "name": ward["name"],
                "subCounty": ward["subCounty"],
                "county": ward["county"],
                "score": round(mean_class * 20.0, 2),
                "riskClass": risk_class,
                "riskLabel": RISK_LABELS[risk_class],
                "flood": {
                    **percentages,
                    "affectedAreaKm2": round(
                        (counts[4] + counts[5]) * cell_area_km2,
                        2,
                    ),
                },
            })

    output.sort(key=lambda item: item["name"].casefold())

    if not output:
        raise RuntimeError(
            "No ward statistics were produced. The raster and ward "
            "coordinate alignment must be checked before displaying results."
        )

    logger.info(
        "Calculated flood statistics for %d wards in %s.",
        len(output),
        COUNTY_NAME,
    )

    return output
