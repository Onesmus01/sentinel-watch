import os
from urllib.parse import urlencode
from urllib.request import urlopen
from urllib.error import HTTPError, URLError

from django.conf import settings


class GeoServerDataService:
    """
    Handles downloading Sentinel Watch spatial data
    from the configured GeoServer instance.
    """

    def __init__(self):
        self.base_url = settings.GEOSERVER_URL.rstrip("/")

    # ------------------------------------------------------------------
    # URL HELPERS
    # ------------------------------------------------------------------

    def workspace_url(self, workspace):
        return f"{self.base_url}/{workspace}"

    def wms_url(self, workspace):
        return f"{self.workspace_url(workspace)}/wms"

    def wfs_url(self, workspace):
        return f"{self.workspace_url(workspace)}/wfs"

    def wcs_url(self, workspace):
        return f"{self.workspace_url(workspace)}/wcs"

    def qualified_name(self, workspace, layer):
        return f"{workspace}:{layer}"

    def wcs_coverage_id(self, workspace, coverage):
        return f"{workspace}__{coverage}"

    # ------------------------------------------------------------------
    # WMS
    # ------------------------------------------------------------------

    def wms_get_map_url(
        self,
        workspace,
        layer,
        bbox,
        width=1024,
        height=768,
        crs="EPSG:4326",
        image_format="image/png",
        transparent=True,
    ):
        params = {
            "service": "WMS",
            "version": "1.3.0",
            "request": "GetMap",
            "layers": self.qualified_name(
                workspace,
                layer,
            ),
            "styles": "",
            "bbox": ",".join(
                str(value)
                for value in bbox
            ),
            "width": width,
            "height": height,
            "crs": crs,
            "format": image_format,
            "transparent": str(
                transparent
            ).lower(),
        }

        return (
            f"{self.wms_url(workspace)}?"
            f"{urlencode(params)}"
        )

    # ------------------------------------------------------------------
    # WFS
    # ------------------------------------------------------------------

    def wfs_get_features_url(
        self,
        workspace,
        layer,
        output_format="application/json",
        max_features=None,
    ):
        params = {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeNames": self.qualified_name(
                workspace,
                layer,
            ),
            "outputFormat": output_format,
        }

        if max_features is not None:
            params["count"] = max_features

        return (
            f"{self.wfs_url(workspace)}?"
            f"{urlencode(params)}"
        )

    # ------------------------------------------------------------------
    # WCS
    # ------------------------------------------------------------------

    def wcs_get_coverage_url(
        self,
        workspace,
        coverage,
        output_format="image/tiff",
        bbox=None,
        crs="EPSG:32637",
        resolution=None,
    ):
        """
        Build a WCS 2.0.1 GetCoverage URL.

        GeoServer coverage IDs use:

            Workspace__Coverage

        The Tana River raster coverages use projected
        CRS EPSG:32637 with axis labels:

            E
            N

        Therefore WCS 2.0 subsets must use:

            subset=E(min,max)
            subset=N(min,max)
        """

        coverage_id = self.wcs_coverage_id(
            workspace,
            coverage,
        )

        params = {
            "service": "WCS",
            "version": "2.0.1",
            "request": "GetCoverage",
            "coverageId": coverage_id,
            "format": output_format,
        }

        if bbox is not None:
            params["subset"] = [
                f"E({bbox[0]},{bbox[2]})",
                f"N({bbox[1]},{bbox[3]})",
            ]

        if crs:
            params["subsettingCRS"] = crs
            params["outputCRS"] = crs

        if resolution is not None:
            params["resolution"] = resolution

        query_parts = []

        for key, value in params.items():
            if isinstance(value, list):
                for item in value:
                    query_parts.append(
                        f"{key}={item}"
                    )
            else:
                query_parts.append(
                    f"{key}={value}"
                )

        return (
            f"{self.wcs_url(workspace)}?"
            + "&".join(query_parts)
        )

    # ------------------------------------------------------------------
    # DOWNLOAD
    # ------------------------------------------------------------------

    def download(
        self,
        url,
        output_path,
        timeout=120,
    ):
        """
        Stream a GeoServer resource to disk.

        Large WCS GeoTIFF files should not be loaded completely
        into memory. The response is therefore downloaded in
        chunks and written directly to a temporary file.

        The temporary file is renamed to the final path only
        after the download completes successfully.
        """

        output_path = os.path.abspath(
            output_path
        )

        output_dir = os.path.dirname(
            output_path
        )

        if output_dir:
            os.makedirs(
                output_dir,
                exist_ok=True,
            )

        temporary_path = (
            f"{output_path}.part"
        )

        try:
            with urlopen(
                url,
                timeout=timeout,
            ) as response:

                with open(
                    temporary_path,
                    "wb",
                ) as output_file:

                    while True:

                        chunk = response.read(
                            1024 * 1024
                        )

                        if not chunk:
                            break

                        output_file.write(
                            chunk
                        )

            os.replace(
                temporary_path,
                output_path,
            )

            return output_path

        except HTTPError as exc:

            if os.path.exists(
                temporary_path
            ):
                os.remove(
                    temporary_path
                )

            raise RuntimeError(
                "GeoServer returned HTTP "
                f"{exc.code}: {exc.reason}"
            ) from exc

        except URLError as exc:

            if os.path.exists(
                temporary_path
            ):
                os.remove(
                    temporary_path
                )

            raise RuntimeError(
                "Unable to connect to GeoServer: "
                f"{exc.reason}"
            ) from exc

        except TimeoutError as exc:

            if os.path.exists(
                temporary_path
            ):
                os.remove(
                    temporary_path
                )

            raise RuntimeError(
                "Connection to GeoServer timed out."
            ) from exc

        except Exception:

            if os.path.exists(
                temporary_path
            ):
                os.remove(
                    temporary_path
                )

            raise

    # ------------------------------------------------------------------
    # VECTOR DOWNLOAD
    # ------------------------------------------------------------------

    def download_vector(
        self,
        workspace,
        layer,
        output_path,
        timeout=60,
    ):
        """
        Download a GeoServer vector layer
        as GeoJSON.
        """

        url = self.wfs_get_features_url(
            workspace=workspace,
            layer=layer,
            output_format="application/json",
        )

        return self.download(
            url=url,
            output_path=output_path,
            timeout=timeout,
        )

    # ------------------------------------------------------------------
    # RASTER DOWNLOAD
    # ------------------------------------------------------------------

    def download_raster(
        self,
        workspace,
        coverage,
        output_path,
        bbox=None,
        crs="EPSG:32637",
        timeout=120,
    ):
        """
        Download a GeoServer raster coverage
        as GeoTIFF.
        """

        url = self.wcs_get_coverage_url(
            workspace=workspace,
            coverage=coverage,
            output_format="image/tiff",
            bbox=bbox,
            crs=crs,
        )

        return self.download(
            url=url,
            output_path=output_path,
            timeout=timeout,
        )

    # ------------------------------------------------------------------
    # SENTINEL WATCH VECTOR DATA
    # ------------------------------------------------------------------

    def kenya_counties(
        self,
        output_path,
    ):
        return self.download_vector(
            workspace="Hazards_Dashboard",
            layer="Kenya_Counties",
            output_path=output_path,
        )

    def tana_river_rivers(
        self,
        output_path,
    ):
        return self.download_vector(
            workspace="Hazards_Dashboard",
            layer="TR_Rivers",
            output_path=output_path,
        )

    def tana_river_towns(
        self,
        output_path,
    ):
        return self.download_vector(
            workspace="TR_Towns",
            layer="TR_Towns",
            output_path=output_path,
        )

    # ------------------------------------------------------------------
    # SENTINEL WATCH RASTER DATA
    # ------------------------------------------------------------------

    def tana_river_rainfall(
        self,
        output_path,
        bbox=None,
    ):
        return self.download_raster(
            workspace="Hazards_Dashboard",
            coverage="TanaRiver_Rainfall",
            output_path=output_path,
            bbox=bbox,
            crs="EPSG:32637",
        )

    def tana_river_slope(
        self,
        output_path,
        bbox=None,
    ):
        return self.download_raster(
            workspace="Hazards_Dashboard",
            coverage="TanaRiver_Slope",
            output_path=output_path,
            bbox=bbox,
            crs="EPSG:32637",
        )

    def tana_river_lulc(
        self,
        output_path,
        bbox=None,
    ):
        return self.download_raster(
            workspace="Hazards_Dashboard",
            coverage="TanaRiver_LULC",
            output_path=output_path,
            bbox=bbox,
            crs="EPSG:4326",
        )

    def tana_river_flood_susceptibility(
        self,
        output_path,
        bbox=None,
    ):
        return self.download_raster(
            workspace="Hazards_Dashboard",
            coverage="TanaRiver_Flood_Susceptability_Map",
            output_path=output_path,
            bbox=bbox,
            crs="EPSG:32637",
        )

    def tana_river_flood_hotspots(
        self,
        output_path,
        bbox=None,
    ):
        return self.download_raster(
            workspace="TanaRiver_Floods",
            coverage="TanaRiver_Flood_Hotspots",
            output_path=output_path,
            bbox=bbox,
            crs="EPSG:32637",
        )

    # ------------------------------------------------------------------
    # DATASET CONFIGURATION
    # ------------------------------------------------------------------

    def flood_sources(self):
        return {
            "county_boundary": {
                "type": "vector",
                "workspace": "Hazards_Dashboard",
                "layer": "Kenya_Counties",
                "format": "GeoJSON",
            },
            "river": {
                "type": "vector",
                "workspace": "Hazards_Dashboard",
                "layer": "TR_Rivers",
                "format": "GeoJSON",
            },
            "rainfall": {
                "type": "raster",
                "workspace": "Hazards_Dashboard",
                "coverage": "TanaRiver_Rainfall",
                "wcs_coverage_id": (
                    "Hazards_Dashboard__"
                    "TanaRiver_Rainfall"
                ),
                "format": "GeoTIFF",
                "crs": "EPSG:32637",
            },
            "slope": {
                "type": "raster",
                "workspace": "Hazards_Dashboard",
                "coverage": "TanaRiver_Slope",
                "wcs_coverage_id": (
                    "Hazards_Dashboard__"
                    "TanaRiver_Slope"
                ),
                "format": "GeoTIFF",
                "crs": "EPSG:32637",
            },
            "landcover": {
                "type": "raster",
                "workspace": "Hazards_Dashboard",
                "coverage": "TanaRiver_LULC",
                "wcs_coverage_id": (
                    "Hazards_Dashboard__"
                    "TanaRiver_LULC"
                ),
                "format": "GeoTIFF",
                "crs": "EPSG:4326",
            },
            "flood_susceptibility": {
                "type": "raster",
                "workspace": "Hazards_Dashboard",
                "coverage": (
                    "TanaRiver_Flood_Susceptability_Map"
                ),
                "wcs_coverage_id": (
                    "Hazards_Dashboard__"
                    "TanaRiver_Flood_Susceptability_Map"
                ),
                "format": "GeoTIFF",
                "crs": "EPSG:32637",
            },
            "existing_flood_result": {
                "type": "raster",
                "workspace": "TanaRiver_Floods",
                "coverage": "TanaRiver_Flood_Hotspots",
                "format": "GeoTIFF",
                "crs": "EPSG:32637",
            },
        }