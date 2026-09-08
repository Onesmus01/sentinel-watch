from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),

    path(
        "api/hazards/",
        include("hazards.urls"),
    ),

    path(
        "api/calculations/",
        include("calculations.urls"),
    ),
]