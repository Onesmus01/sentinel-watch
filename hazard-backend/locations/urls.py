
from django.urls import path

from .views import (
    CountyDetailView,
    CountyTownsView,
    TownDetailView,
    TownListView,
    geoserver_boundary,
    geoserver_counties,
    geoserver_subcounties,
    geoserver_wards,
)


urlpatterns = [
    # Administrative boundaries from GeoServer
    path(
        "counties/",
        geoserver_counties,
        name="county-list",
    ),

    path(
        "subcounties/",
        geoserver_subcounties,
        name="subcounty-list",
    ),

    path(
        "wards/",
        geoserver_wards,
        name="ward-list",
    ),

    # Real GeoJSON boundaries for map zooming
    path(
        "boundaries/",
        geoserver_boundary,
        name="administrative-boundaries",
    ),

    # County details and towns
    path(
        "counties/<int:pk>/",
        CountyDetailView.as_view(),
        name="county-detail",
    ),

    path(
        "counties/<int:county_id>/towns/",
        CountyTownsView.as_view(),
        name="county-towns",
    ),

    # Towns
    path(
        "towns/",
        TownListView.as_view(),
        name="town-list",
    ),

    path(
        "towns/<int:pk>/",
        TownDetailView.as_view(),
        name="town-detail",
    ),
]
