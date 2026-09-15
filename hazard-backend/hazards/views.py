from django.http import JsonResponse

from .models import Hazard
from .services.geoserver import GeoServerService


geoserver = GeoServerService()


def hazard_list(request):
    """
    Return all enabled hazards.
    """

    hazards = Hazard.objects.filter(enabled=True)

    data = []

    for hazard in hazards:
        item = {
            "id": hazard.id,
            "name": hazard.name,
            "hazard_type": hazard.hazard_type,
            "description": hazard.description,
            "enabled": hazard.enabled,
        }

        if hazard.geoserver_workspace and hazard.geoserver_layer:
            item["geoserver"] = geoserver.layer_config(
                workspace=hazard.geoserver_workspace,
                layer=hazard.geoserver_layer,
                coverage=hazard.geoserver_coverage,
            )

        data.append(item)

    return JsonResponse(
        {
            "success": True,
            "count": len(data),
            "hazards": data,
        }
    )


def hazard_detail(request, hazard_id):
    """
    Return one hazard and its GeoServer configuration.
    """

    try:
        hazard = Hazard.objects.get(
            id=hazard_id,
            enabled=True,
        )
    except Hazard.DoesNotExist:
        return JsonResponse(
            {
                "success": False,
                "error": f"Hazard {hazard_id} not found.",
            },
            status=404,
        )

    response = {
        "success": True,
        "hazard": {
            "id": hazard.id,
            "name": hazard.name,
            "hazard_type": hazard.hazard_type,
            "description": hazard.description,
            "enabled": hazard.enabled,
        },
    }

    if hazard.geoserver_workspace and hazard.geoserver_layer:
        response["geoserver"] = geoserver.layer_config(
            workspace=hazard.geoserver_workspace,
            layer=hazard.geoserver_layer,
            coverage=hazard.geoserver_coverage,
        )

    return JsonResponse(response)


def hazard_geoserver(request, hazard_id):
    """
    Retrieve live GeoServer metadata for a hazard layer.
    """

    try:
        hazard = Hazard.objects.get(
            id=hazard_id,
            enabled=True,
        )
    except Hazard.DoesNotExist:
        return JsonResponse(
            {
                "success": False,
                "error": f"Hazard {hazard_id} not found.",
            },
            status=404,
        )

    if not hazard.geoserver_workspace or not hazard.geoserver_layer:
        return JsonResponse(
            {
                "success": False,
                "error": (
                    f"Hazard '{hazard.name}' does not have "
                    "a GeoServer layer configured."
                ),
            },
            status=400,
        )

    try:
        metadata = geoserver.get_layer_metadata(
            workspace=hazard.geoserver_workspace,
            layer=hazard.geoserver_layer,
        )

    except RuntimeError as exc:
        return JsonResponse(
            {
                "success": False,
                "error": str(exc),
                "geo_server": {
                    "workspace": hazard.geoserver_workspace,
                    "layer": hazard.geoserver_layer,
                },
            },
            status=502,
        )

    return JsonResponse(
        {
            "success": True,
            "hazard": {
                "id": hazard.id,
                "name": hazard.name,
                "hazard_type": hazard.hazard_type,
            },
            "geoserver": metadata,
        }
    )