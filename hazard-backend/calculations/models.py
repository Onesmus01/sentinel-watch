from django.db import models


class FloodCalculation(models.Model):
    """
    Stores the latest and historical successful flood calculations.

    Large raster arrays remain on disk. Only JSON-serializable
    summaries and ward-level results are stored in PostgreSQL.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    weights = models.JSONField(default=dict)
    summary = models.JSONField(default=list)
    wards = models.JSONField(default=list)
    outputs = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Flood calculation"
        verbose_name_plural = "Flood calculations"

    def __str__(self):
        return f"Flood calculation #{self.pk} — {self.created_at}"