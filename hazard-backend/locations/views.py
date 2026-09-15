from django.db.models import Q

from rest_framework import generics

from .models import County, Town
from .serializers import (
    CountyListSerializer,
    CountySerializer,
    TownListSerializer,
    TownSerializer,
)


class CountyListView(generics.ListAPIView):
    """
    GET /api/locations/counties/

    Returns all counties.
    """

    serializer_class = CountyListSerializer

    def get_queryset(self):
        queryset = County.objects.all().order_by("name")

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
            )

        return queryset


class CountyDetailView(generics.RetrieveAPIView):
    """
    GET /api/locations/counties/<id>/

    Returns one county including geometry.
    """

    queryset = County.objects.all()
    serializer_class = CountySerializer


class CountyTownsView(generics.ListAPIView):
    """
    GET /api/locations/counties/<id>/towns/

    Returns towns belonging to a county.
    """

    serializer_class = TownListSerializer

    def get_queryset(self):
        county_id = self.kwargs["county_id"]

        queryset = (
            Town.objects
            .filter(county_id=county_id)
            .select_related("county")
            .order_by("name")
        )

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                name__icontains=search
            )

        return queryset


class TownListView(generics.ListAPIView):
    """
    GET /api/locations/towns/

    Returns all towns.
    """

    serializer_class = TownListSerializer

    def get_queryset(self):
        queryset = (
            Town.objects
            .select_related("county")
            .order_by("name")
        )

        county_id = self.request.query_params.get(
            "county"
        )

        if county_id:
            queryset = queryset.filter(
                county_id=county_id
            )

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(county__name__icontains=search)
            )

        return queryset


class TownDetailView(generics.RetrieveAPIView):
    """
    GET /api/locations/towns/<id>/

    Returns one town including geometry.
    """

    queryset = (
        Town.objects
        .select_related("county")
    )

    serializer_class = TownSerializer