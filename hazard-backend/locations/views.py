import requests

from django.conf import settings
from django.db.models import Q
from django.http import JsonResponse

from rest_framework import generics

from .models import County, Town
from .serializers import (
    CountySerializer,
    TownListSerializer,
    TownSerializer,
)


GEOSERVER_COUNTIES_LAYER = (
    "Hazards_Dashboard:Kenya_Counties"
)


def geoserver_counties(request):
    """
    GET /api/locations/counties/

    Returns counties directly from the real
    GeoServer Kenya_Counties WFS layer.

    The browser communicates with Django only.
    Django communicates with GeoServer server-side.
    """

    search = request.GET.get("search", "").strip()

    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": GEOSERVER_COUNTIES_LAYER,
        "outputFormat": "application/json",
        "srsName": "EPSG:4326",
    }

    try:
        response = requests.get(
            f"{settings.GEOSERVER_URL}/ows",
            params=params,
            timeout=30,
        )

        response.raise_for_status()
        data = response.json()

    except requests.RequestException as exc:
        return JsonResponse(
            {
                "count": 0,
                "next": None,
                "previous": None,
                "results": [],
                "error": "Unable to connect to GeoServer.",
                "details": str(exc),
            },
            status=502,
        )

    except ValueError as exc:
        return JsonResponse(
            {
                "count": 0,
                "next": None,
                "previous": None,
                "results": [],
                "error": "GeoServer returned invalid JSON.",
                "details": str(exc),
            },
            status=502,
        )

    features = data.get("features", [])

    counties = []
    seen_names = set()

    for feature in features:
        properties = feature.get("properties") or {}

        name = properties.get("COUNTY")

        if not isinstance(name, str):
            continue

        name = name.strip()

        if not name or name in seen_names:
            continue

        if search and search.lower() not in name.lower():
            continue

        seen_names.add(name)

        counties.append(
            {
                "id": properties.get("OBJECTID")
                or properties.get("FID")
                or name,
                "name": name,
                "code": (
                    properties.get("CODE")
                    or properties.get("COUNTY_CODE")
                    or None
                ),
            }
        )

    counties.sort(
        key=lambda item: item["name"].lower()
    )

    return JsonResponse(
        {
            "count": len(counties),
            "next": None,
            "previous": None,
            "results": counties,
        },
        status=200,
    )


class CountyDetailView(generics.RetrieveAPIView):
    """
    GET /api/locations/counties/<id>/

    Returns one county from the Django database.
    """

    queryset = County.objects.all()
    serializer_class = CountySerializer


class CountyTownsView(generics.ListAPIView):
    """
    GET /api/locations/counties/<id>/towns/

    Returns towns belonging to a county.
    """

    serializer_class = TownListSerializer

    def get_queryset(self):
        county_id = self.kwargs["county_id"]

        queryset = (
            Town.objects
            .filter(county_id=county_id)
            .select_related("county")
            .order_by("name")
        )

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                name__icontains=search
            )

        return queryset


class TownListView(generics.ListAPIView):
    """
    GET /api/locations/towns/

    Returns all towns.
    """

    serializer_class = TownListSerializer

    def get_queryset(self):
        queryset = (
            Town.objects
            .select_related("county")
            .order_by("name")
        )

        county_id = self.request.query_params.get(
            "county"
        )

        if county_id:
            queryset = queryset.filter(
                county_id=county_id
            )

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(county__name__icontains=search)
            )

        return queryset


class TownDetailView(generics.RetrieveAPIView):
    """
    GET /api/locations/towns/<id>/

    Returns one town including geometry.
    """

    queryset = (
        Town.objects
        .select_related("county")
    )

    serializer_class = TownSerializer
