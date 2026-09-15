from django.core.management.base import BaseCommand, CommandError

from locations.services.geoserver_sync import (
    GeoServerLocationSyncService,
)


class Command(BaseCommand):
    help = (
        "Synchronize counties and towns "
        "from GeoServer into PostGIS."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--counties-only",
            action="store_true",
            help="Synchronize counties only.",
        )

        parser.add_argument(
            "--towns-only",
            action="store_true",
            help="Synchronize towns only.",
        )

    def handle(self, *args, **options):

        counties_only = options["counties_only"]
        towns_only = options["towns_only"]

        if counties_only and towns_only:
            raise CommandError(
                "Use either --counties-only or "
                "--towns-only, not both."
            )

        service = GeoServerLocationSyncService()

        self.stdout.write("")
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                "========================================"
            )
        )
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                "SENTINEL WATCH LOCATION SYNC"
            )
        )
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                "========================================"
            )
        )
        self.stdout.write("")

        try:

            if counties_only:

                self.stdout.write(
                    "Synchronizing counties..."
                )

                result = service.sync_counties()

                self.stdout.write(
                    self.style.SUCCESS(
                        "Counties synchronized successfully."
                    )
                )

                self.stdout.write(
                    f"  Total:   {result['total']}"
                )
                self.stdout.write(
                    f"  Created: {result['created']}"
                )
                self.stdout.write(
                    f"  Updated: {result['updated']}"
                )
                self.stdout.write(
                    f"  Skipped: {result['skipped']}"
                )

                return

            if towns_only:

                self.stdout.write(
                    "Synchronizing towns..."
                )

                result = service.sync_towns()

                self.stdout.write(
                    self.style.SUCCESS(
                        "Towns synchronized successfully."
                    )
                )

                self.stdout.write(
                    f"  Total:   {result['total']}"
                )
                self.stdout.write(
                    f"  Created: {result['created']}"
                )
                self.stdout.write(
                    f"  Updated: {result['updated']}"
                )
                self.stdout.write(
                    f"  Skipped: {result['skipped']}"
                )

                return

            result = service.sync_all()

            county_result = result["counties"]
            town_result = result["towns"]

            self.stdout.write("")

            self.stdout.write(
                self.style.SUCCESS("COUNTIES")
            )

            self.stdout.write(
                f"  Total:   {county_result['total']}"
            )
            self.stdout.write(
                f"  Created: {county_result['created']}"
            )
            self.stdout.write(
                f"  Updated: {county_result['updated']}"
            )
            self.stdout.write(
                f"  Skipped: {county_result['skipped']}"
            )

            self.stdout.write("")

            self.stdout.write(
                self.style.SUCCESS("TOWNS")
            )

            self.stdout.write(
                f"  Total:   {town_result['total']}"
            )
            self.stdout.write(
                f"  Created: {town_result['created']}"
            )
            self.stdout.write(
                f"  Updated: {town_result['updated']}"
            )
            self.stdout.write(
                f"  Skipped: {town_result['skipped']}"
            )

            self.stdout.write("")

            self.stdout.write(
                self.style.SUCCESS(
                    "GeoServer location synchronization "
                    "completed successfully."
                )
            )

        except Exception as exc:

            raise CommandError(
                f"Location synchronization failed: {exc}"
            ) from exc