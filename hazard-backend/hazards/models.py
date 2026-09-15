from django.db import models


class Hazard(models.Model):
    HAZARD_TYPES = [
        ("flood", "Flood"),
        ("landslide", "Landslide"),
        ("drought", "Drought"),
        ("fire", "Fire"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=150, unique=True)
    hazard_type = models.CharField(
        max_length=50,
        choices=HAZARD_TYPES,
    )
    description = models.TextField(blank=True)
    enabled = models.BooleanField(default=True)
    geoserver_workspace = models.CharField(
        max_length=100,
        blank=True,
    )
    geoserver_layer = models.CharField(
        max_length=200,
        blank=True,
    )
    geoserver_coverage = models.CharField(
        max_length=200,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name