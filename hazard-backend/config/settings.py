
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
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key",
)

DEBUG = os.getenv(
    "DEBUG",
    "True",
).lower() == "true"


ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
]


# ============================================================
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
# DATABASE — POSTGIS
# ============================================================

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",

        "NAME": os.getenv(
            "DB_NAME",
            "hazard_db",
        ),

        "USER": os.getenv(
            "DB_USER",
            "postgres",
        ),

        "PASSWORD": os.getenv(
            "DB_PASSWORD",
            "",
        ),

        "HOST": os.getenv(
            "DB_HOST",
            "127.0.0.1",
        ),

        "PORT": os.getenv(
            "DB_PORT",
            "5432",
        ),
    }
}


# ============================================================
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
# ============================================================

CORS_ALLOW_ALL_ORIGINS = True


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Africa/Nairobi"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ============================================================
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
# GEO DJANGO — WINDOWS GIS LIBRARIES
# ============================================================

# OSGeo4W installation verified at:
# C:\Users\onesm\AppData\Local\Programs\OSGeo4W
#
# Verified GDAL:
# GDAL 3.13.3
#
# These native DLLs are required by GeoDjango.

OSGEO4W_BIN = (
    r"C:\Users\onesm\AppData\Local\Programs\OSGeo4W\bin"
)

GDAL_LIBRARY_PATH = os.path.join(
    OSGEO4W_BIN,
    "gdal313.dll",
)

GEOS_LIBRARY_PATH = os.path.join(
    OSGEO4W_BIN,
    "geos_c.dll",
)


# ============================================================
# PROJ
# ============================================================

# PROJ is used by GDAL/GeoPandas/Rasterio for coordinate
# reference systems and CRS transformations.

PROJ_LIB = os.path.join(
    OSGEO4W_BIN,
    "proj",
)

os.environ.setdefault(
    "PROJ_LIB",
    PROJ_LIB,
)

# Make OSGeo4W native libraries available to Python processes.
os.environ["PATH"] = (
    OSGEO4W_BIN
    + os.pathsep
    + os.environ.get("PATH", "")
)


# ============================================================
# GIS ENVIRONMENT
# ============================================================

# OSGeo4W provides the native:
# - GDAL
# - GEOS
# - PROJ
#
# PostgreSQL/PostGIS handles database-side spatial operations.
#
# GeoDjango provides Django-side spatial models and operations.
# Rasterio/GeoPandas will use the same native GIS ecosystem.
