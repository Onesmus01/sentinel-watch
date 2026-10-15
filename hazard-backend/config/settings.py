
from pathlib import Path
import os

from dotenv import load_dotenv


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(BASE_DIR / ".env")


# ============================================================
# SECURITY

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key" if os.name == "nt" else "",
)

if not SECRET_KEY:
    raise RuntimeError(
        "Set the SECRET_KEY environment variable before running in production."
    )

DEBUG = os.getenv(
    "DEBUG",
    "True" if os.name == "nt" else "False",
).lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1",
    ).split(",")
    if host.strip()
]


# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # GeoDjango
    "django.contrib.gis",

    # Third-party
    "rest_framework",
    "corsheaders",
    "rest_framework_gis",
    "django_filters",

    # Local applications
    "hazards",
    "locations",
    "spatial",
    "calculations",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL CONFIGURATION
# ============================================================

ROOT_URLCONF = "config.urls"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# WSGI / ASGI
# ============================================================

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# ============================================================
# DATABASE ? POSTGIS

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            engine="django.contrib.gis.db.backends.postgis",
            conn_max_age=600,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": os.getenv("DB_NAME", "hazard_db"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }


# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],

    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],

    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],

    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],

    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),

    "PAGE_SIZE": 50,
}


# ============================================================
# CORS

CORS_ALLOW_ALL_ORIGINS = (
    os.getenv(
        "CORS_ALLOW_ALL_ORIGINS",
        "true" if os.name == "nt" else "false",
    ).lower() == "true"
)

CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]


# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Africa/Nairobi"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================================
# EMAIL
# ============================================================

EMAIL_BACKEND = (
    "django.core.mail.backends.console.EmailBackend"
)


# ============================================================
# GEOSERVER
# ============================================================

GEOSERVER_URL = os.getenv(
    "GEOSERVER_URL",
    "http://localhost:8080/geoserver",
)

GEOSERVER_WORKSPACE = os.getenv(
    "GEOSERVER_WORKSPACE",
    "hazards",
)

GEOSERVER_USERNAME = os.getenv(
    "GEOSERVER_USERNAME",
    "admin",
)

GEOSERVER_PASSWORD = os.getenv(
    "GEOSERVER_PASSWORD",
    "",
)


# ============================================================
# ============================================================
# GEO DJANGO — WINDOWS GIS LIBRARIES
# ============================================================
#
# QGIS 3.40.2 provides the native GIS libraries used by
# GeoDjango:
#
# - GDAL 3.9.3
# - GEOS
# - PROJ
#
# PostgreSQL 18 / PostGIS 3.6.2 provides the spatial database.
#
# PostgreSQL 16 is intentionally NOT used.
#
# QGIS installation:
# C:\Program Files\QGIS 3.40.2
#
# PostgreSQL installation:
# C:\Program Files\PostgreSQL\18
#
# Python environment:
# .venv-new
#
# IMPORTANT:
# Rasterio and pyproj installed in .venv-new have their own
# compatible PROJ installation.
#
# We intentionally DO NOT override PROJ_LIB or PROJ_DATA with
# the QGIS proj.db.
#
# ============================================================


# ============================================================
# QGIS / POSTGRESQL ROOT DIRECTORIES
# ============================================================

QGIS_ROOT = r"C:\Program Files\QGIS 3.40.2"

QGIS_BIN = os.path.join(
    QGIS_ROOT,
    "bin",
)

POSTGRES_ROOT = r"C:\Program Files\PostgreSQL\18"

POSTGRES_BIN = os.path.join(
    POSTGRES_ROOT,
    "bin",
)


# ============================================================
# GDAL
# ============================================================
#
# QGIS 3.40.2 provides the native GDAL library used by
# GeoDjango for raster and vector operations.
#
# Verified DLL:
# C:\Program Files\QGIS 3.40.2\bin\gdal309.dll
#
# ============================================================

# Windows uses the GDAL DLL bundled with QGIS.
# Linux lets GeoDjango discover the installed GDAL library.
if os.name == "nt":
    GDAL_LIBRARY_PATH = os.path.join(
        QGIS_BIN,
        "gdal309.dll",
    )
else:
    GDAL_LIBRARY_PATH = os.getenv(
        "GDAL_LIBRARY_PATH",
        "/usr/lib/x86_64-linux-gnu/libgdal.so",
    )


# ============================================================
# GEOS
# ============================================================
#
# QGIS 3.40.2 provides the GEOS native library used by
# GeoDjango for geometry operations.
#
# ============================================================

# Windows uses the GEOS DLL bundled with QGIS.
# Linux lets GeoDjango discover the installed GEOS library.
if os.name == "nt":
    GEOS_LIBRARY_PATH = os.path.join(
        QGIS_BIN,
        "geos_c.dll",
    )
else:
    GEOS_LIBRARY_PATH = os.getenv(
        "GEOS_LIBRARY_PATH",
        "/usr/lib/x86_64-linux-gnu/libgeos_c.so",
    )


# ============================================================
# PROJ
# ============================================================
#
# QGIS 3.40.2 contains its own PROJ installation and proj.db.
#
# IMPORTANT:
#
# DO NOT execute:
#
# os.environ["PROJ_LIB"] = PROJ_LIB
# os.environ["PROJ_DATA"] = PROJ_LIB
#
# Rasterio and pyproj in .venv-new use their own compatible
# PROJ installation (PROJ 9.8.1).
#
# Forcing QGIS's proj.db into the Python process causes a
# PROJ database-version conflict.
#
# Therefore PROJ_LIB below is ONLY a reference path.
# It is NOT injected into the environment.
#
# ============================================================

PROJ_LIB = os.path.join(
    QGIS_ROOT,
    "share",
    "proj",
)


# ============================================================
# GIS NATIVE LIBRARY PATH
# ============================================================
#
# Put QGIS first so GeoDjango can resolve the native GDAL,
# GEOS and related GIS libraries from QGIS.
#
# PostgreSQL 18 follows so PostgreSQL client tools can be
# located when required.
#
# IMPORTANT:
# This changes PATH only.
# It does NOT change PROJ_LIB or PROJ_DATA.
#
# ============================================================

# Add Windows GIS and PostgreSQL binaries only on Windows.
# Render/Linux uses its installed native GIS libraries.
if os.name == "nt":
    os.environ["PATH"] = (
        QGIS_BIN
        + os.pathsep
        + POSTGRES_BIN
        + os.pathsep
        + os.environ.get("PATH", "")
    )


# ============================================================
# GIS ENVIRONMENT NOTES
# ============================================================
#
# QGIS 3.40.2 provides:
#
# - GDAL
# - GEOS
# - PROJ
#
# PostgreSQL 18 / PostGIS 3.6.2 provides:
#
# - PostgreSQL database
# - PostGIS spatial database extension
#
# GeoDjango provides:
#
# - Spatial models
# - Geometry operations
# - Raster/vector integration
# - PostGIS database integration
#
# Rasterio and pyproj use their own compatible Python GIS
# dependencies.
#
# Their PROJ environment must NOT be overridden by the
# QGIS proj.db.
#
# This prevents conflicts between:
#
# - QGIS PROJ
# - PostgreSQL/PostGIS PROJ
# - Python Rasterio/pyproj PROJ
#
# ============================================================


# Production security settings
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
