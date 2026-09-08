from django.urls import path

from .views import (
    hazard_list,
    hazard_detail,
    hazard_geoserver,
)


urlpatterns = [
    path(
        "",
        hazard_list,
        name="hazard-list",
    ),

    path(
        "<str:hazard_id>/",
        hazard_detail,
        name="hazard-detail",
    ),

    path(
        "<str:hazard_id>/geoserver/",
        hazard_geoserver,
        name="hazard-geoserver",
    ),
]