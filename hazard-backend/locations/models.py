from django.contrib.gis.db import models


class County(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.IntegerField(unique=True)
    geom = models.MultiPolygonField(srid=4326)

    def __str__(self):
        return self.name


class Town(models.Model):
    name = models.CharField(max_length=100)
    county = models.ForeignKey(
        County,
        on_delete=models.CASCADE,
        related_name="towns"
    )
    geom = models.PointField(srid=4326)

    def __str__(self):
        return self.name