from rest_framework import serializers

from .models import County, Town


class CountySerializer(serializers.ModelSerializer):
    class Meta:
        model = County
        fields = [
            "id",
            "name",
            "code",
            "geom",
        ]


class CountyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = County
        fields = [
            "id",
            "name",
            "code",
        ]


class TownSerializer(serializers.ModelSerializer):
    county_name = serializers.CharField(
        source="county.name",
        read_only=True,
    )

    class Meta:
        model = Town
        fields = [
            "id",
            "name",
            "county",
            "county_name",
            "geom",
        ]


class TownListSerializer(serializers.ModelSerializer):
    county_name = serializers.CharField(
        source="county.name",
        read_only=True,
    )

    class Meta:
        model = Town
        fields = [
            "id",
            "name",
            "county",
            "county_name",
        ]