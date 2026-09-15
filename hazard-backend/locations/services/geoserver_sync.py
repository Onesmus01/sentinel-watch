
import json
import logging
import os
import tempfile

from django.contrib.gis.geos import GEOSGeometry
from django.db import transaction

from calculations.services.geoserver_data import GeoServerDataService
from locations.models import County, Town


logger = logging.getLogger(__name__)


class GeoServerLocationSyncService:
    """
    Synchronizes location data from GeoServer into PostGIS.
    """

    COUNTY_WORKSPACE = "Hazards_Dashboard"
    COUNTY_LAYER = "Kenya_Counties"

    TOWN_WORKSPACE = "TR_Towns"
    TOWN_LAYER = "TR_Towns"

    def __init__(self):
        self.geoserver = GeoServerDataService()

    def _download_geojson(self, workspace, layer):
        with tempfile.TemporaryDirectory() as temp_dir:

            output_path = os.path.join(
                temp_dir,
                f"{layer}.geojson",
            )

            self.geoserver.download_vector(
                workspace=workspace,
                layer=layer,
                output_path=output_path,
            )

            with open(
                output_path,
                "r",
                encoding="utf-8",
            ) as file:
                return json.load(file)

    @staticmethod
    def _geometry_from_feature(feature):
        geometry = feature.get("geometry")

        if not geometry:
            return None

        geometry_json = json.dumps(geometry)

        geom = GEOSGeometry(
            geometry_json,
            srid=4326,
        )

        if geom.srid != 4326:
            geom.srid = 4326

        return geom

    def sync_counties(self):
        logger.info("Starting county synchronization...")

        data = self._download_geojson(
            workspace=self.COUNTY_WORKSPACE,
            layer=self.COUNTY_LAYER,
        )

        features = data.get("features", [])

        created = 0
        updated = 0
        skipped = 0

        with transaction.atomic():

            for feature in features:

                properties = feature.get(
                    "properties",
                    {},
                )

                county_name = properties.get("COUNTY")
                county_code = properties.get("OBJECTID")

                geometry = self._geometry_from_feature(
                    feature
                )

                if not county_name:
                    logger.warning(
                        "Skipping county without COUNTY name."
                    )
                    skipped += 1
                    continue

                if county_code is None:
                    logger.warning(
                        "Skipping county '%s' without OBJECTID.",
                        county_name,
                    )
                    skipped += 1
                    continue

                if geometry is None:
                    logger.warning(
                        "Skipping county '%s' without geometry.",
                        county_name,
                    )
                    skipped += 1
                    continue

                county, was_created = (
                    County.objects.update_or_create(
                        code=int(county_code),
                        defaults={
                            "name": county_name.strip(),
                            "geom": geometry,
                        },
                    )
                )

                if was_created:
                    created += 1
                else:
                    updated += 1

        logger.info(
            "County synchronization complete: "
            "%s created, %s updated, %s skipped.",
            created,
            updated,
            skipped,
        )

        return {
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "total": len(features),
        }

    def sync_towns(self):
        logger.info("Starting town synchronization...")

        data = self._download_geojson(
            workspace=self.TOWN_WORKSPACE,
            layer=self.TOWN_LAYER,
        )

        features = data.get("features", [])

        created = 0
        updated = 0
        skipped = 0

        counties = list(County.objects.all())

        if not counties:
            raise RuntimeError(
                "No counties exist in PostGIS. "
                "Synchronize counties before towns."
            )

        with transaction.atomic():

            for feature in features:

                properties = feature.get(
                    "properties",
                    {},
                )

                town_name = properties.get("TOWN_NAME")

                geometry = self._geometry_from_feature(
                    feature
                )

                if not town_name:
                    logger.warning(
                        "Skipping town without TOWN_NAME."
                    )
                    skipped += 1
                    continue

                if geometry is None:
                    logger.warning(
                        "Skipping town '%s' without geometry.",
                        town_name,
                    )
                    skipped += 1
                    continue

                if geometry.geom_type != "Point":
                    logger.warning(
                        "Skipping town '%s': expected Point geometry, got %s.",
                        town_name,
                        geometry.geom_type,
                    )
                    skipped += 1
                    continue

                county = None

                for candidate_county in counties:

                    if candidate_county.geom.contains(
                        geometry
                    ):
                        county = candidate_county
                        break

                if county is None:
                    logger.warning(
                        "Could not determine county for town '%s'.",
                        town_name,
                    )
                    skipped += 1
                    continue

                town, was_created = (
                    Town.objects.update_or_create(
                        name=town_name.strip(),
                        county=county,
                        defaults={
                            "geom": geometry,
                        },
                    )
                )

                if was_created:
                    created += 1
                else:
                    updated += 1

        logger.info(
            "Town synchronization complete: "
            "%s created, %s updated, %s skipped.",
            created,
            updated,
            skipped,
        )

        return {
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "total": len(features),
        }

    def sync_all(self):

        logger.info(
            "========================================"
        )
        logger.info(
            "STARTING GEOSERVER LOCATION SYNC"
        )
        logger.info(
            "========================================"
        )

        county_result = self.sync_counties()
        town_result = self.sync_towns()

        result = {
            "counties": county_result,
            "towns": town_result,
        }

        logger.info(
            "========================================"
        )
        logger.info(
            "GEOSERVER LOCATION SYNC COMPLETE"
        )
        logger.info(
            "========================================"
        )

        return result
