import os

import geopandas as gpd

from calculations.services.geoserver_data import GeoServerDataService
from calculations.services.flood_hotspot import (
    CONFIG,
    WEIGHTS,
    run_flood_hotspot,
)


class FloodGeoServerService:
    """
    Connects the Sentinel Watch flood calculation to the
    organization's GeoServer.

    The active flood calculation uses only the spatial
    datasets currently available from GeoServer:

        1. Tana River County boundary
        2. Tana River rivers
        3. Tana River rainfall
        4. Tana River land cover

    DEM, elevation, and slope are intentionally not used.
    """

    def __init__(self):
        self.geoserver = GeoServerDataService()

        self.base_dir = os.path.join(
            str(CONFIG.get("out_dir", "")),
            "geoserver_inputs",
        )

        self.target_crs = CONFIG.get(
            "target_crs",
            "EPSG:32637",
        )

        self.target_resolution = CONFIG.get(
            "target_resolution",
            30,
        )

        self.river_dist_smooth_sigma = CONFIG.get(
            "river_dist_smooth_sigma",
            3,
        )

        os.makedirs(
            self.base_dir,
            exist_ok=True,
        )

    # ========================================================
    # PATHS
    # ========================================================

    @property
    def county_boundary_path(self):
        return os.path.join(
            self.base_dir,
            "TanaRiver_County.geojson",
        )

    @property
    def rainfall_path(self):
        return os.path.join(
            self.base_dir,
            "TanaRiver_Rainfall.tif",
        )

    @property
    def landcover_path(self):
        return os.path.join(
            self.base_dir,
            "TanaRiver_LULC.tif",
        )

    @property
    def river_path(self):
        return os.path.join(
            self.base_dir,
            "TR_Rivers.geojson",
        )

    # ========================================================
    # COUNTY BOUNDARY
    # ========================================================

    def download_tana_river_boundary(self):
        """
        Download Kenya counties from GeoServer and extract
        Tana River County into a dedicated GeoJSON file.

        Source:

            Hazards_Dashboard:Kenya_Counties
        """

        source_path = os.path.join(
            self.base_dir,
            "Kenya_Counties.geojson",
        )

        if not os.path.exists(
            source_path
        ):
            self.geoserver.kenya_counties(
                output_path=source_path,
            )

        counties = gpd.read_file(
            source_path,
        )

        if counties.empty:
            raise ValueError(
                "GeoServer Kenya_Counties returned "
                "no features."
            )

        # ----------------------------------------------------
        # Find county-name column
        # ----------------------------------------------------

        possible_name_columns = [
            "county",
            "County",
            "COUNTY",
            "county_name",
            "County_Name",
            "COUNTY_NAM",
            "name",
            "Name",
            "NAME",
        ]

        name_column = None

        for column in possible_name_columns:

            if column in counties.columns:

                name_column = column

                break

        if name_column is None:

            raise ValueError(
                "Could not identify the county-name field "
                "in GeoServer Kenya_Counties layer. "
                f"Available fields: "
                f"{list(counties.columns)}"
            )

        # ----------------------------------------------------
        # Normalize county names
        # ----------------------------------------------------

        names = (
            counties[name_column]
            .astype(str)
            .str.strip()
            .str.lower()
        )

        # ----------------------------------------------------
        # Find Tana River County
        # ----------------------------------------------------

        tana_river = counties[
            names.isin(
                [
                    "tana river",
                    "tanariver",
                    "tana river county",
                ]
            )
        ].copy()

        # ----------------------------------------------------
        # Fallback partial matching
        # ----------------------------------------------------

        if tana_river.empty:

            tana_river = counties[
                names.str.contains(
                    "tana",
                    na=False,
                )
                &
                names.str.contains(
                    "river",
                    na=False,
                )
            ].copy()

        if tana_river.empty:

            raise ValueError(
                "Tana River County could not be found "
                "in GeoServer Kenya_Counties layer. "
                f"Available county names: "
                f"{sorted(names.dropna().unique().tolist())}"
            )

        # ----------------------------------------------------
        # Validate CRS
        # ----------------------------------------------------

        if tana_river.crs is None:

            raise ValueError(
                "Tana River County boundary has no CRS."
            )

        # ----------------------------------------------------
        # Convert to analysis CRS
        # ----------------------------------------------------

        tana_river = tana_river.to_crs(
            self.target_crs,
        )

        # ----------------------------------------------------
        # Save
        # ----------------------------------------------------

        tana_river.to_file(
            self.county_boundary_path,
            driver="GeoJSON",
        )

        return self.county_boundary_path

    # ========================================================
    # RIVERS
    # ========================================================

    def download_rivers(self):
        """
        Download Tana River rivers from GeoServer.

        Source:

            Hazards_Dashboard:TR_Rivers
        """

        if not os.path.exists(
            self.river_path
        ):

            self.geoserver.tana_river_rivers(
                output_path=self.river_path,
            )

        rivers = gpd.read_file(
            self.river_path,
        )

        if rivers.empty:

            raise ValueError(
                "GeoServer TR_Rivers returned "
                "no river features."
            )

        return self.river_path

    # ========================================================
    # RAINFALL
    # ========================================================

    def download_rainfall(self):
        """
        Download Tana River rainfall raster from GeoServer.

        Source:

            Hazards_Dashboard:TanaRiver_Rainfall
        """

        if not os.path.exists(
            self.rainfall_path
        ):

            self.geoserver.tana_river_rainfall(
                output_path=self.rainfall_path,
            )

        return self.rainfall_path

    # ========================================================
    # LAND COVER
    # ========================================================

    def download_landcover(self):
        """
        Download Tana River land-cover raster from GeoServer.

        Source:

            Hazards_Dashboard:TanaRiver_LULC
        """

        if not os.path.exists(
            self.landcover_path
        ):

            self.geoserver.tana_river_lulc(
                output_path=self.landcover_path,
            )

        return self.landcover_path

    # ========================================================
    # PREPARE ALL FLOOD INPUTS
    # ========================================================

    def prepare_inputs(self):
        """
        Prepare all spatial inputs required by the active
        flood hotspot calculation.

        DEM is intentionally excluded.
        """

        print(
            "\n============================================================"
        )

        print(
            "PREPARING FLOOD INPUTS FROM GEOSERVER"
        )

        print(
            "============================================================"
        )

        # ----------------------------------------------------
        # County boundary
        # ----------------------------------------------------

        print(
            "\n── County boundary ──"
        )

        county_boundary = (
            self.download_tana_river_boundary()
        )

        print(
            f"  ✓ {county_boundary}"
        )

        # ----------------------------------------------------
        # Rivers
        # ----------------------------------------------------

        print(
            "\n── Rivers ──"
        )

        river_path = (
            self.download_rivers()
        )

        print(
            f"  ✓ {river_path}"
        )

        # ----------------------------------------------------
        # Rainfall
        # ----------------------------------------------------

        print(
            "\n── Rainfall ──"
        )

        rainfall_path = (
            self.download_rainfall()
        )

        print(
            f"  ✓ {rainfall_path}"
        )

        # ----------------------------------------------------
        # Land cover
        # ----------------------------------------------------

        print(
            "\n── Land cover ──"
        )

        landcover_path = (
            self.download_landcover()
        )

        print(
            f"  ✓ {landcover_path}"
        )

        # ----------------------------------------------------
        # DEM intentionally excluded
        # ----------------------------------------------------

        print(
            "\n── DEM ──"
        )

        print(
            "  - EXCLUDED"
        )

        print(
            "  - DEM is not required by the "
            "available-data flood model."
        )

        print(
            "\n============================================================"
        )

        print(
            "GeoServer input preparation completed."
        )

        print(
            "============================================================"
        )

        return {
            "county_boundary": county_boundary,
            "rainfall_path": rainfall_path,
            "landcover_path": landcover_path,
            "river_path": river_path,
        }

    # ========================================================
    # BUILD FLOOD CALCULATION CONFIG
    # ========================================================

    def build_calculation_config(
        self,
        inputs=None,
    ):
        """
        Build the configuration expected by
        run_flood_hotspot().
        """

        if inputs is None:

            inputs = self.prepare_inputs()

        calculation_config = {
            "county_boundary": inputs[
                "county_boundary"
            ],

            "rainfall_path": inputs[
                "rainfall_path"
            ],

            "landcover_path": inputs[
                "landcover_path"
            ],

            "river_path": inputs[
                "river_path"
            ],

            "out_dir": str(
                CONFIG["out_dir"]
            ),

            "target_crs": self.target_crs,

            "target_resolution": (
                self.target_resolution
            ),

            "river_dist_smooth_sigma": (
                self.river_dist_smooth_sigma
            ),
        }

        return calculation_config

    # ========================================================
    # RUN FLOOD CALCULATION
    # ========================================================

    def run(self):
        """
        Prepare GeoServer inputs and execute the active
        available-data flood hotspot calculation.
        """

        inputs = self.prepare_inputs()

        calculation_config = (
            self.build_calculation_config(
                inputs=inputs,
            )
        )

        print(
            "\n============================================================"
        )

        print(
            "RUNNING FLOOD HOTSPOT CALCULATION"
        )

        print(
            "============================================================"
        )

        print(
            "\nActive flood factors:"
        )

        print(
            f"  Distance to River : "
            f"{WEIGHTS['dist_to_river']:.6f}"
        )

        print(
            f"  Rainfall          : "
            f"{WEIGHTS['rainfall']:.6f}"
        )

        print(
            f"  Landcover         : "
            f"{WEIGHTS['landcover']:.6f}"
        )

        print(
            "\nExcluded:"
        )

        print(
            "  Elevation         : EXCLUDED"
        )

        print(
            "  Slope             : EXCLUDED"
        )

        result = run_flood_hotspot(
            config=calculation_config,
            weights=WEIGHTS,
        )

        return result

    # ========================================================
    # STATUS
    # ========================================================

    def status(self):
        """
        Return availability status of the flood inputs.

        DEM is deliberately not included because it is not
        required by the active calculation.
        """

        return {
            "county_boundary": {
                "available": os.path.exists(
                    self.county_boundary_path
                ),
                "path": self.county_boundary_path,
            },

            "rainfall": {
                "available": os.path.exists(
                    self.rainfall_path
                ),
                "path": self.rainfall_path,
            },

            "landcover": {
                "available": os.path.exists(
                    self.landcover_path
                ),
                "path": self.landcover_path,
            },

            "rivers": {
                "available": os.path.exists(
                    self.river_path
                ),
                "path": self.river_path,
            },
        }