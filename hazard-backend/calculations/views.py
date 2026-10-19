import hashlib
import json
import logging
import math
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from calculations.models import FloodCalculation
from calculations.services.flood_hotspot import CONFIG, run_flood_hotspot
from calculations.services.ward_flood_stats import calculate_ward_flood_stats


logger = logging.getLogger(__name__)

FLOOD_HAZARD = {
    "id": 1,
    "name": "Flood",
    "hazard_type": "flood",
}

DEFAULT_WEIGHTS = {
    "dist_to_river": 0.5833333333333334,
    "rainfall": 0.3333333333333333,
    "landcover": 0.0833333333333333,
}

EXPECTED_WEIGHT_KEYS = set(DEFAULT_WEIGHTS.keys())

CACHE_ALGORITHM_VERSION = 1

CACHE_INPUT_KEYS = (
    "county_boundary",
    "rainfall_path",
    "landcover_path",
    "river_path",
)

CACHE_SETTING_KEYS = (
    "target_crs",
    "target_resolution",
    "river_dist_smooth_sigma",
    "rainfall_sample_size",
    "jenks_sample_size",
    "plot_max_dimension",
)

REQUIRED_OUTPUT_KEYS = (
    "fhi_raster",
    "classes_raster",
    "diagnostic_map",
    "hotspot_map",
)


def error_response(message, details=None, status=500):
    response = {
        "success": False,
        "hazard": FLOOD_HAZARD,
        "error": message,
    }

    if details:
        response["details"] = str(details)

    return JsonResponse(response, status=status)


def parse_flood_weights(request):
    try:
        payload = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ValueError(
            "The request body must contain valid JSON."
        ) from exc

    if not isinstance(payload, dict):
        raise ValueError("The request body must be a JSON object.")

    weights = payload.get("weights")

    if not isinstance(weights, dict):
        raise ValueError("Provide a weights object.")

    if set(weights.keys()) != EXPECTED_WEIGHT_KEYS:
        expected = ", ".join(sorted(EXPECTED_WEIGHT_KEYS))
        raise ValueError(
            f"Weights must contain exactly these keys: {expected}."
        )

    validated = {}

    for key in EXPECTED_WEIGHT_KEYS:
        value = weights[key]

        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"The '{key}' weight must be a number.")

        value = float(value)

        if not math.isfinite(value) or value < 0:
            raise ValueError(
                f"The '{key}' weight must be finite and non-negative."
            )

        validated[key] = value

    total = sum(validated.values())

    if not math.isfinite(total) or total <= 0:
        raise ValueError("The total weight must be greater than zero.")

    # Normalize the weights for the GIS calculation.
    return {
        key: value / total
        for key, value in validated.items()
    }


def _flood_cache_key(weights):
    """
    Create a stable cache key from model settings, weights, and input metadata.

    File size and modification time are used instead of hashing the full
    raster contents on every request.
    """
    inputs = {}

    for key in CACHE_INPUT_KEYS:
        configured_path = CONFIG.get(key)

        if not configured_path:
            inputs[key] = {"missing": True}
            continue

        path = os.path.abspath(os.fspath(configured_path))

        try:
            stat = os.stat(path)

            inputs[key] = {
                "path": path,
                "size": stat.st_size,
                "mtime_ns": stat.st_mtime_ns,
            }
        except OSError:
            # Missing files must not match a previously successful result.
            inputs[key] = {
                "path": path,
                "missing": True,
            }

    settings_payload = {
        key: CONFIG.get(key)
        for key in CACHE_SETTING_KEYS
    }

    payload = {
        "algorithm_version": CACHE_ALGORITHM_VERSION,
        "weights": {
            key: float(weights[key])
            for key in sorted(weights)
        },
        "inputs": inputs,
        "settings": settings_payload,
    }

    encoded = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")

    return hashlib.sha256(encoded).hexdigest()


def _cached_outputs_are_available(calculation):
    """Check that all expected cached output files still exist."""
    outputs = calculation.outputs or {}

    for key in REQUIRED_OUTPUT_KEYS:
        path = outputs.get(key)

        if not isinstance(path, str) or not path:
            return False

        if not os.path.isfile(path):
            return False

    return True


def serialize_calculation(calculation):
    """Return the public response without exposing internal cache metadata."""
    outputs = dict(calculation.outputs or {})
    outputs.pop("_cache_key", None)

    return {
        "summary": calculation.summary,
        "wards": calculation.wards,
        "weights": calculation.weights,
        "outputs": outputs,
        "created_at": calculation.created_at.isoformat(),
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def flood_hotspot_calculation(request):
    """
    GET:
        Return the latest saved successful flood calculation.

    POST:
        Reuse a valid cached calculation when possible; otherwise run
        the GIS model and save the successful result.

        JSON body: {"weights": {...}}
    """

    if request.method == "GET":
        try:
            calculation = FloodCalculation.objects.first()

            if calculation is None:
                return error_response(
                    "No saved flood calculation is available yet. "
                    "Run the flood calculation from the Hazard Model page first.",
                    status=404,
                )

            return JsonResponse({
                "success": True,
                "hazard": FLOOD_HAZARD,
                "calculation": serialize_calculation(calculation),
            })

        except Exception as exc:
            logger.exception(
                "Unable to retrieve the saved flood calculation."
            )
            return error_response(
                "Unable to retrieve saved flood results.",
                str(exc),
                500,
            )

    try:
        try:
            weights = parse_flood_weights(request)
        except ValueError as exc:
            return error_response(
                "Invalid flood hotspot weights.",
                str(exc),
                400,
            )

        cache_key = _flood_cache_key(weights)

        # Reuse a previous successful calculation only when its cache key
        # matches and every required output file is still available.
        cached = FloodCalculation.objects.filter(
            outputs__cache_key=cache_key,
        ).first()

        if cached is not None and _cached_outputs_are_available(cached):
            logger.info(
                "Reusing cached flood calculation %s.",
                cached.pk,
            )

            return JsonResponse({
                "success": True,
                "hazard": FLOOD_HAZARD,
                "calculation": serialize_calculation(cached),
                "cached": True,
            })

        # Cache miss: run the full GIS model.
        result = run_flood_hotspot(weights=weights)
        wards = calculate_ward_flood_stats(result)

        saved_outputs = dict(result.get("outputs", {}))
        saved_outputs["_cache_key"] = cache_key

        # Persist only after both GIS processing and ward statistics succeed.
        calculation = FloodCalculation.objects.create(
            summary=result.get("summary", []),
            wards=wards,
            weights=result.get("weights", weights),
            outputs=saved_outputs,
        )

        logger.info(
            "Saved flood calculation %s with %d ward records.",
            calculation.pk,
            len(wards),
        )

        return JsonResponse({
            "success": True,
            "hazard": FLOOD_HAZARD,
            "calculation": serialize_calculation(calculation),
            "cached": False,
        })

    except FileNotFoundError as exc:
        logger.exception(
            "Required flood hotspot input file was not found."
        )
        return error_response(
            "Required flood hotspot input file was not found.",
            str(exc),
            404,
        )

    except Exception as exc:
        logger.exception("Flood hotspot calculation failed.")
        return error_response(
            "Flood hotspot calculation failed.",
            str(exc),
            500,
        )
