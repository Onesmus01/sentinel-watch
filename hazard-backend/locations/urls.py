from django.urls import path

from .views import (
    CountyDetailView,
    CountyListView,
    CountyTownsView,
    TownDetailView,
    TownListView,
)


urlpatterns = [
    # Counties
    path(
        "counties/",
        CountyListView.as_view(),
        name="county-list",
    ),

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