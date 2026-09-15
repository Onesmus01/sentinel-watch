from django.urls import path

from .views import flood_hotspot_calculation


urlpatterns = [
    path(
        "flood/",
        flood_hotspot_calculation,
        name="flood-hotspot-calculation",
    ),
]