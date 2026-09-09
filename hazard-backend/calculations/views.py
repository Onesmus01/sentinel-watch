from django.http import JsonResponse
from django.views.decorators.http import require_GET

from calculations.services.flood_hotspot import run_flood_hotspot


@require_GET
def flood_hotspot_calculation(request):
    """
    Run the Flood Hotspot Index calculation.

    Endpoint:
        GET /api/calculations/flood/

    Returns:
        - hazard information
        - calculation summary
        - AHP weights
        - generated output files
    """

    try:
        result = run_flood_hotspot()

        return JsonResponse(
            {
                "success": True,
                "hazard": {
                    "id": 1,
                    "name": "Flood",
                    "hazard_type": "flood",
                },
                "calculation": {
                    "summary": result.get("summary", {}),
                    "weights": result.get("weights", {}),
                    "outputs": result.get("outputs", {}),
                },
            },
            status=200,
        )

    except FileNotFoundError as exc:
        return JsonResponse(
            {
                "success": False,
                "hazard": {
                    "id": 1,
                    "name": "Flood",
                    "hazard_type": "flood",
                },
                "error": "Required flood hotspot input file was not found.",
                "details": str(exc),
            },
            status=404,
        )

    except Exception as exc:
        return JsonResponse(
            {
                "success": False,
                "hazard": {
                    "id": 1,
                    "name": "Flood",
                    "hazard_type": "flood",
                },
                "error": "Flood hotspot calculation failed.",
                "details": str(exc),
            },
            status=500,
        )