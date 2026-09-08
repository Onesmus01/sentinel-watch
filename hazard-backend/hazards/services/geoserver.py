from urllib.parse import urlencode
from urllib.request import urlopen
from urllib.error import HTTPError, URLError
import xml.etree.ElementTree as ET

from django.conf import settings


class GeoServerService:
    """
    Service for communicating with GeoServer and generating
    WMS/WCS configuration for Sentinel Watch hazard layers.
    """

    def __init__(self):
        self.base_url = settings.GEOSERVER_URL.rstrip("/")

    # =========================================================
    # BASIC URLS
    # =========================================================

    def workspace_url(self, workspace):
        return f"{self.base_url}/{workspace}"

    def wms_url(self, workspace):
        return f"{self.workspace_url(workspace)}/wms"

    def wcs_url(self, workspace):
        return f"{self.workspace_url(workspace)}/wcs"

    def layer_name(self, workspace, layer):
        return f"{workspace}:{layer}"

    # =========================================================
    # WMS
    # =========================================================

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
        """
        Build a WMS GetMap URL.

        bbox:
            (minx, miny, maxx, maxy)
        """

        params = {
            "service": "WMS",
            "version": "1.3.0",
            "request": "GetMap",
            "layers": self.layer_name(workspace, layer),
            "styles": "",
            "bbox": ",".join(str(value) for value in bbox),
            "width": width,
            "height": height,
            "crs": crs,
            "format": image_format,
            "transparent": str(transparent).lower(),
        }

        return f"{self.wms_url(workspace)}?{urlencode(params)}"

    def wms_capabilities_url(self, workspace):
        params = {
            "service": "WMS",
            "version": "1.3.0",
            "request": "GetCapabilities",
        }

        return f"{self.wms_url(workspace)}?{urlencode(params)}"

    # =========================================================
    # WCS
    # =========================================================

    def wcs_capabilities_url(self, workspace):
        params = {
            "service": "WCS",
            "version": "2.0.1",
            "request": "GetCapabilities",
        }

        return f"{self.wcs_url(workspace)}?{urlencode(params)}"

    # =========================================================
    # LEGEND
    # =========================================================

    def legend_url(self, workspace, layer):
        """
        Generate the GeoServer GetLegendGraphic URL.
        """

        params = {
            "service": "WMS",
            "version": "1.1.0",
            "request": "GetLegendGraphic",
            "format": "image/png",
            "layer": self.layer_name(workspace, layer),
        }

        return f"{self.wms_url(workspace)}?{urlencode(params)}"

    # =========================================================
    # FRONTEND LAYER CONFIGURATION
    # =========================================================

    def layer_config(self, workspace, layer, coverage=None):
        """
        Return frontend-ready configuration for a GeoServer layer.
        """

        qualified_name = self.layer_name(workspace, layer)

        return {
            "workspace": workspace,
            "layer": layer,
            "coverage": coverage or layer,
            "layer_name": qualified_name,
            "wms_url": self.wms_url(workspace),
            "wcs_url": self.wcs_url(workspace),
            "wms_capabilities_url": self.wms_capabilities_url(
                workspace
            ),
            "wcs_capabilities_url": self.wcs_capabilities_url(
                workspace
            ),
            "legend_url": self.legend_url(
                workspace,
                layer,
            ),
        }

    # =========================================================
    # REMOTE REQUEST
    # =========================================================

    def _fetch(self, url, timeout=10):
        """
        Fetch data from GeoServer.

        Returns:
            bytes

        Raises:
            RuntimeError on connection or HTTP failure.
        """

        try:
            with urlopen(url, timeout=timeout) as response:
                return response.read()

        except HTTPError as exc:
            raise RuntimeError(
                f"GeoServer returned HTTP {exc.code}: {exc.reason}"
            ) from exc

        except URLError as exc:
            raise RuntimeError(
                f"Unable to connect to GeoServer: {exc.reason}"
            ) from exc

        except TimeoutError as exc:
            raise RuntimeError(
                "Connection to GeoServer timed out."
            ) from exc

    # =========================================================
    # WMS CAPABILITIES / LAYER METADATA
    # =========================================================

    def get_wms_capabilities(
        self,
        workspace,
        timeout=10,
    ):
        """
        Retrieve and parse the WMS GetCapabilities document.
        """

        url = self.wms_capabilities_url(workspace)

        content = self._fetch(
            url,
            timeout=timeout,
        )

        try:
            return ET.fromstring(content)

        except ET.ParseError as exc:
            raise RuntimeError(
                "GeoServer returned invalid WMS capabilities XML."
            ) from exc

    def get_layer_metadata(
        self,
        workspace,
        layer,
        timeout=10,
    ):
        """
        Find a layer inside WMS GetCapabilities and return
        its basic metadata.
        """

        root = self.get_wms_capabilities(
            workspace,
            timeout=timeout,
        )

        target_name = self.layer_name(
            workspace,
            layer,
        )

        target = None

        for element in root.iter():
            if not element.tag.endswith("Layer"):
                continue

            name_element = None

            for child in element:
                if child.tag.endswith("Name"):
                    name_element = child
                    break

            if name_element is not None:
                if name_element.text == target_name:
                    target = element
                    break

                if name_element.text == layer:
                    target = element
                    break

        if target is None:
            raise RuntimeError(
                f"GeoServer layer '{target_name}' "
                "was not found in WMS capabilities."
            )

        metadata = {
            "name": layer,
            "qualified_name": target_name,
            "title": None,
            "abstract": None,
            "crs": [],
            "bounds": None,
        }

        for child in target:
            tag = child.tag.split("}")[-1]

            if tag == "Title":
                metadata["title"] = child.text

            elif tag == "Abstract":
                metadata["abstract"] = child.text

            elif tag in ("CRS", "SRS"):
                if child.text:
                    metadata["crs"].append(
                        child.text
                    )

            elif tag == "EX_GeographicBoundingBox":
                bounds = {}

                for bound in child:
                    bound_tag = bound.tag.split("}")[-1]

                    if bound.text is None:
                        continue

                    if bound_tag == "westBoundLongitude":
                        bounds["west"] = float(bound.text)

                    elif bound_tag == "southBoundLatitude":
                        bounds["south"] = float(bound.text)

                    elif bound_tag == "eastBoundLongitude":
                        bounds["east"] = float(bound.text)

                    elif bound_tag == "northBoundLatitude":
                        bounds["north"] = float(bound.text)

                if bounds:
                    metadata["bounds"] = bounds

            elif tag == "BoundingBox":
                if metadata["bounds"] is None:
                    minx = child.attrib.get("minx")
                    miny = child.attrib.get("miny")
                    maxx = child.attrib.get("maxx")
                    maxy = child.attrib.get("maxy")

                    if all(
                        value is not None
                        for value in (
                            minx,
                            miny,
                            maxx,
                            maxy,
                        )
                    ):
                        metadata["bounds"] = {
                            "west": float(minx),
                            "south": float(miny),
                            "east": float(maxx),
                            "north": float(maxy),
                        }

        metadata["wms_url"] = self.wms_url(workspace)
        metadata["wcs_url"] = self.wcs_url(workspace)
        metadata["legend_url"] = self.legend_url(
            workspace,
            layer,
        )

        return metadata