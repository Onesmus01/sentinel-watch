
import json
import logging
import math

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from calculations.services.flood_hotspot import run_flood_hotspot


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


def error_response(message, details, status):
    return JsonResponse(
        {
            "success": False,
            "hazard": FLOOD_HAZARD,
            "error": message,
            "details": details,
        },
        status=status,
    )


def parse_flood_weights(request):
    """
    Read and validate custom weights from a JSON POST body.

    Accepts positive weights as relative values or fractions.
    Normalizes them to fractions whose sum equals 1.
    """

    try:
        payload = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Request body must contain valid JSON.")

    if not isinstance(payload, dict):
        raise ValueError("The request body must be a JSON object.")

    weights = payload.get("weights")

    if not isinstance(weights, dict):
        raise ValueError(
            "Provide a weights object containing dist_to_river, "
            "rainfall, and landcover."
        )

    if set(weights.keys()) != EXPECTED_WEIGHT_KEYS:
        raise ValueError(
            "Weights must contain exactly these keys: "
            "dist_to_river, rainfall, landcover."
        )

    validated = {}

    for name in DEFAULT_WEIGHTS:
        value = weights[name]

        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"The '{name}' weight must be a number.")

        value = float(value)

        if not math.isfinite(value) or value < 0:
            raise ValueError(
                f"The '{name}' weight must be finite and non-negative."
            )

        validated[name] = value

    total = sum(validated.values())

    if total <= 0 or not math.isfinite(total):
        raise ValueError("At least one weight must be greater than zero.")

    return {
        name: value / total
        for name, value in validated.items()
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def flood_hotspot_calculation(request):
    """
    Run the Flood Hotspot Index calculation.

    GET:
        /api/calculations/flood/
        Runs with the default weights.

    POST:
        /api/calculations/flood/
        JSON body: {"weights": {
            "dist_to_river": 0.583333,
            "rainfall": 0.333333,
            "landcover": 0.083334
        }}

    Weights are normalized before the calculation.
    """

    try:
        if request.method == "POST":
            try:
                weights = parse_flood_weights(request)
            except ValueError as exc:
                return error_response(
                    "Invalid flood hotspot weights.",
                    str(exc),
                    400,
                )
        else:
            weights = DEFAULT_WEIGHTS.copy()

        result = run_flood_hotspot(weights=weights)

        return JsonResponse(
            {
                "success": True,
                "hazard": FLOOD_HAZARD,
                "calculation": {
                    "summary": result.get("summary", []),
                    "weights": result.get("weights", {}),
                    "outputs": result.get("outputs", {}),
                },
            },
            status=200,
        )

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
