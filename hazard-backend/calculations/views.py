
import json
import logging
import math

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from calculations.models import FloodCalculation
from calculations.services.flood_hotspot import run_flood_hotspot
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
        raise ValueError("The request body must contain valid JSON.") from exc

    if not isinstance(payload, dict):
        raise ValueError("The request body must be a JSON object.")

    weights = payload.get("weights")

    if not isinstance(weights, dict):
        raise ValueError("Provide a weights object.")

    if set(weights.keys()) != EXPECTED_WEIGHT_KEYS:
        expected = ", ".join(sorted(EXPECTED_WEIGHT_KEYS))
        raise ValueError(f"Weights must contain exactly these keys: {expected}.")

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

    if total <= 0:
        raise ValueError("The total weight must be greater than zero.")

    # Normalize so the GIS engine receives weights that sum to 1.
    return {
        key: value / total
        for key, value in validated.items()
    }


def serialize_calculation(calculation):
    return {
        "summary": calculation.summary,
        "wards": calculation.wards,
        "weights": calculation.weights,
        "outputs": calculation.outputs,
        "created_at": calculation.created_at.isoformat(),
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def flood_hotspot_calculation(request):
    """
    GET:
        Return the latest saved flood calculation without running GIS.

    POST:
        Run a new flood calculation, then persist its successful results.
        JSON body: {"weights": {...}}
    """

    # Reports and other read-only consumers use this branch.
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
            logger.exception("Unable to retrieve the saved flood calculation.")
            return error_response(
                "Unable to retrieve saved flood results.",
                str(exc),
                500,
            )

    # Only POST starts the expensive GIS calculation.
    try:
        try:
            weights = parse_flood_weights(request)
        except ValueError as exc:
            return error_response(
                "Invalid flood hotspot weights.",
                str(exc),
                400,
            )

        result = run_flood_hotspot(weights=weights)
        wards = calculate_ward_flood_stats(result)

        # Save only after both the GIS calculation and ward statistics succeed.
        calculation = FloodCalculation.objects.create(
            summary=result.get("summary", []),
            wards=wards,
            weights=result.get("weights", weights),
            outputs=result.get("outputs", {}),
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
        })

    except FileNotFoundError as exc:
        logger.exception("Required flood hotspot input file was not found.")
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
