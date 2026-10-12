
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


GEOSERVER_COUNTIES_LAYER = "Hazards_Dashboard:Kenya_Counties"
GEOSERVER_SUBCOUNTIES_LAYER = "Kenya_SubCounties:ke_subcounty"
GEOSERVER_WARDS_LAYER = "Rangelands:wards"


# ---------------------------------------------------------------------
# GeoServer helpers
# ---------------------------------------------------------------------

def _quote_cql(value):
    """Escape a value used inside a GeoServer CQL string literal."""
    return str(value).replace("\\", "\\\\").replace("'", "''")


def _get_geoserver_features(
    layer,
    property_names=None,
    cql_filter=None,
):
    """
    Fetch features from GeoServer using WFS.

    When property_names is omitted, request all properties and geometry.
    This is required by the administrative-boundary map endpoint.
    """

    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": layer,
        "outputFormat": "application/json",
        "srsName": "EPSG:4326",
    }

    if property_names:
        params["propertyName"] = ",".join(property_names)

    if cql_filter:
        params["CQL_FILTER"] = cql_filter

    response = requests.get(
        f"{settings.GEOSERVER_URL.rstrip('/')}/ows",
        params=params,
        timeout=60,
    )
    response.raise_for_status()

    data = response.json()

    if not isinstance(data, dict) or not isinstance(
        data.get("features"), list
    ):
        raise ValueError(
            f"GeoServer returned an invalid feature collection "
            f"for {layer}."
        )

    return data["features"]


def _geoserver_error(exc):
    """Return a consistent response when GeoServer requests fail."""

    return JsonResponse(
        {
            "count": 0,
            "next": None,
            "previous": None,
            "results": [],
            "error": (
                "Unable to retrieve administrative boundaries "
                "from GeoServer."
            ),
            "details": str(exc),
        },
        status=502,
    )


def _required_parameter(request, name):
    """Read and trim a required query parameter."""
    return request.GET.get(name, "").strip()


# ---------------------------------------------------------------------
# County dropdown
# ---------------------------------------------------------------------

def geoserver_counties(request):
    """
    GET /api/locations/counties/
    Optional query: ?search=Tana
    """

    search = _required_parameter(request, "search")

    try:
        features = _get_geoserver_features(
            GEOSERVER_COUNTIES_LAYER,
            ["COUNTY"],
        )
    except (requests.RequestException, ValueError) as exc:
        return _geoserver_error(exc)

    counties = []
    seen_names = set()

    for feature in features:
        if not isinstance(feature, dict):
            continue

        properties = feature.get("properties") or {}
        name = properties.get("COUNTY")

        if not isinstance(name, str):
            continue

        name = name.strip()
        name_key = name.casefold()

        if not name or name_key in seen_names:
            continue

        if search and search.casefold() not in name_key:
            continue

        seen_names.add(name_key)

        counties.append(
            {
                "id": name,
                "name": name,
                "code": None,
            }
        )

    counties.sort(key=lambda item: item["name"].casefold())

    return JsonResponse(
        {
            "count": len(counties),
            "next": None,
            "previous": None,
            "results": counties,
        }
    )


# ---------------------------------------------------------------------
# Sub-county dropdown
# ---------------------------------------------------------------------

def geoserver_subcounties(request):
    """
    GET /api/locations/subcounties/?county=Tana%20River

    Uses the national Kenya sub-county boundary layer.
    """

    county = _required_parameter(request, "county")

    if not county:
        return JsonResponse(
            {
                "count": 0,
                "results": [],
                "error": "Provide a county query parameter.",
            },
            status=400,
        )

    try:
        features = _get_geoserver_features(
            GEOSERVER_SUBCOUNTIES_LAYER,
            ["county", "subcounty", "scpcode"],
            f"county='{_quote_cql(county)}'",
        )
    except (requests.RequestException, ValueError) as exc:
        return _geoserver_error(exc)

    unique = {}

    for feature in features:
        if not isinstance(feature, dict):
            continue

        properties = feature.get("properties") or {}

        name = properties.get("subcounty")
        actual_county = properties.get("county")
        code = properties.get("scpcode")

        if not isinstance(name, str):
            continue

        if not isinstance(actual_county, str):
            continue

        name = name.strip()
        actual_county = actual_county.strip()

        if not name:
            continue

        if actual_county.casefold() != county.casefold():
            continue

        unique.setdefault(
            name.casefold(),
            {
                "id": code or name,
                "name": name,
                "county": actual_county,
                "code": code,
            },
        )

    results = sorted(
        unique.values(),
        key=lambda item: item["name"].casefold(),
    )

    return JsonResponse(
        {
            "count": len(results),
            "results": results,
        }
    )


# ---------------------------------------------------------------------
# Ward dropdown
# ---------------------------------------------------------------------

def geoserver_wards(request):
    """
    GET /api/locations/wards/?county=Tana%20River

    Uses the Rangelands wards layer.
    Constituency is returned separately from the ward name.
    """

    county = _required_parameter(request, "county")

    if not county:
        return JsonResponse(
            {
                "count": 0,
                "results": [],
                "error": "Provide a county query parameter.",
            },
            status=400,
        )

    try:
        features = _get_geoserver_features(
            GEOSERVER_WARDS_LAYER,
            [
                "name_1",
                "name_2",
                "ward",
                "constituency",
                "code",
            ],
            f"name_1='{_quote_cql(county)}'",
        )
    except (requests.RequestException, ValueError) as exc:
        return _geoserver_error(exc)

    unique = {}

    for feature in features:
        if not isinstance(feature, dict):
            continue

        properties = feature.get("properties") or {}

        name = properties.get("ward")
        actual_county = properties.get("name_1")

        if not isinstance(name, str):
            continue

        if not isinstance(actual_county, str):
            continue

        name = name.strip()
        actual_county = actual_county.strip()

        if not name:
            continue

        if actual_county.casefold() != county.casefold():
            continue

        constituency = (
            properties.get("constituency")
            or properties.get("name_2")
            or ""
        )
        constituency = str(constituency).strip()
        code = properties.get("code")

        key = (
            actual_county.casefold(),
            constituency.casefold(),
            name.casefold(),
        )

        unique.setdefault(
            key,
            {
                "id": code or name,
                "name": name,
                "county": actual_county,
                "constituency": constituency,
                "code": code,
            },
        )

    results = sorted(
        unique.values(),
        key=lambda item: (
            item["constituency"].casefold(),
            item["name"].casefold(),
        ),
    )

    return JsonResponse(
        {
            "count": len(results),
            "results": results,
        }
    )


# ---------------------------------------------------------------------
# Administrative boundaries for map zooming
# ---------------------------------------------------------------------

def geoserver_boundary(request):
    """
    Return a GeoJSON FeatureCollection for the selected administrative area.

    County:
      /api/locations/boundaries/?level=county&county=Tana%20River

    Sub-county:
      /api/locations/boundaries/?level=subcounty
      &county=Tana%20River
      &subcounty=Bura%20Sub%20County

    Ward:
      /api/locations/boundaries/?level=ward
      &county=Tana%20River
      &ward=Bangale

    The frontend can pass the returned features to Leaflet and use
    flyToBounds() to zoom to the selected boundary.
    """

    level = _required_parameter(request, "level").lower() or "county"
    county = _required_parameter(request, "county")
    subcounty = _required_parameter(request, "subcounty")
    ward = _required_parameter(request, "ward")

    if level not in {"county", "subcounty", "ward"}:
        return JsonResponse(
            {
                "error": (
                    "Invalid level. Use county, subcounty, or ward."
                )
            },
            status=400,
        )

    if not county:
        return JsonResponse(
            {"error": "Provide a county query parameter."},
            status=400,
        )

    safe_county = _quote_cql(county)

    if level == "county":
        layer = GEOSERVER_COUNTIES_LAYER
        cql_filter = f"COUNTY='{safe_county}'"

    elif level == "subcounty":
        if not subcounty:
            return JsonResponse(
                {"error": "Provide a subcounty query parameter."},
                status=400,
            )

        layer = GEOSERVER_SUBCOUNTIES_LAYER
        cql_filter = (
            f"county='{safe_county}' AND "
            f"subcounty='{_quote_cql(subcounty)}'"
        )

    else:
        if not ward:
            return JsonResponse(
                {"error": "Provide a ward query parameter."},
                status=400,
            )

        layer = GEOSERVER_WARDS_LAYER
        cql_filter = (
            f"name_1='{safe_county}' AND "
            f"ward='{_quote_cql(ward)}'"
        )

    try:
        features = _get_geoserver_features(
            layer,
            property_names=None,
            cql_filter=cql_filter,
        )
    except (requests.RequestException, ValueError) as exc:
        return _geoserver_error(exc)

    valid_features = []

    for feature in features:
        if not isinstance(feature, dict):
            continue

        geometry = feature.get("geometry")

        if not isinstance(geometry, dict):
            continue

        if not geometry.get("type") or not geometry.get("coordinates"):
            continue

        valid_features.append(feature)

    return JsonResponse(
        {
            "type": "FeatureCollection",
            "features": valid_features,
            "count": len(valid_features),
        }
    )


# ---------------------------------------------------------------------
# Existing database-backed county and town APIs
# ---------------------------------------------------------------------

class CountyDetailView(generics.RetrieveAPIView):
    """GET /api/locations/counties/<id>/"""

    queryset = County.objects.all()
    serializer_class = CountySerializer


class CountyTownsView(generics.ListAPIView):
    """GET /api/locations/counties/<id>/towns/"""

    serializer_class = TownListSerializer

    def get_queryset(self):
        queryset = (
            Town.objects
            .filter(county_id=self.kwargs["county_id"])
            .select_related("county")
            .order_by("name")
        )

        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset


class TownListView(generics.ListAPIView):
    """GET /api/locations/towns/"""

    serializer_class = TownListSerializer

    def get_queryset(self):
        queryset = (
            Town.objects
            .select_related("county")
            .order_by("name")
        )

        county_id = self.request.query_params.get("county")

        if county_id:
            queryset = queryset.filter(county_id=county_id)

        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(county__name__icontains=search)
            )

        return queryset


class TownDetailView(generics.RetrieveAPIView):
    """GET /api/locations/towns/<id>/"""

    queryset = Town.objects.select_related("county")
    serializer_class = TownSerializer
