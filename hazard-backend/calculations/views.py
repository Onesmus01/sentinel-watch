from django.http import JsonResponse

from calculations.services.flood_hotspot import run_flood_hotspot


def flood_hotspot_calculation(request):
    """
    Run the Flood Hotspot Index calculation.

    Endpoint:
        GET /api/calculations/flood/
    """

    if request.method != "GET":
        return JsonResponse(
            {
                "success": False,
                "error": "Only GET requests are allowed.",
            },
            status=405,
        )

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
                    "summary": result["summary"],
                    "weights": result["weights"],
                    "outputs": result["outputs"],
                },
            }
        )

    except FileNotFoundError as exc:
        return JsonResponse(
            {
                "success": False,
                "error": "Required flood hotspot input file was not found.",
                "details": str(exc),
            },
            status=404,
        )

    except Exception as exc:
        return JsonResponse(
            {
                "success": False,
                "error": "Flood hotspot calculation failed.",
                "details": str(exc),
            },
            status=500,
        )