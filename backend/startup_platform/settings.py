"""
Django settings for startup_platform project.
Production-ready configuration for Render deployment with Vercel frontend.
"""

import os
from pathlib import Path
from datetime import timedelta

# ------------------------------------------------------------------------------
# BASE DIR
# ------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent


# ------------------------------------------------------------------------------
# ENV CONFIG
# ------------------------------------------------------------------------------
try:
    from decouple import config
except ImportError:
    config = lambda key, default=None, cast=None: os.environ.get(key, default)


# ------------------------------------------------------------------------------
# SECURITY
# ------------------------------------------------------------------------------
SECRET_KEY = config(
    "SECRET_KEY",
    default="django-insecure-CHANGE-ME-IN-PRODUCTION"
)

DEBUG = config(
    "DEBUG",
    default="False",
    cast=lambda v: str(v).lower() in ("true", "1", "yes")
)

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    ".onrender.com",  # Allows all Render subdomains
    "startup-connect-hub.onrender.com",  # Explicit domain
]


# ------------------------------------------------------------------------------
# APPLICATIONS
# ------------------------------------------------------------------------------
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party - CORS MUST be before rest_framework
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",

    # Local apps
    "accounts",
    "startups",
]


# ------------------------------------------------------------------------------
# MIDDLEWARE - ORDER IS CRITICAL
# ------------------------------------------------------------------------------
MIDDLEWARE = [
    "startup_platform.middleware.CorsOptionsMiddleware",  # CORS OPTIONS handler FIRST
    "corsheaders.middleware.CorsMiddleware",  # CORS middleware SECOND
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ------------------------------------------------------------------------------
# URLS / WSGI
# ------------------------------------------------------------------------------
ROOT_URLCONF = "startup_platform.urls"

WSGI_APPLICATION = "startup_platform.wsgi.application"


# ------------------------------------------------------------------------------
# TEMPLATES
# ------------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ------------------------------------------------------------------------------
# DATABASE
# ------------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# ------------------------------------------------------------------------------
# AUTH
# ------------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 6},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ------------------------------------------------------------------------------
# INTERNATIONALIZATION
# ------------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ------------------------------------------------------------------------------
# STATIC & MEDIA
# ------------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ------------------------------------------------------------------------------
# DJANGO REST FRAMEWORK
# ------------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "accounts.views.custom_exception_handler",
}


# ------------------------------------------------------------------------------
# JWT
# ------------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,

    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,

    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",

    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    
    # Critical: These must match your token structure
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}


# ------------------------------------------------------------------------------
# CORS (VERCEL FRONTEND) - CRITICAL CONFIGURATION
# ------------------------------------------------------------------------------
# Read from environment variable first, then use production defaults (NO LOCALHOST)
CORS_ALLOWED_ORIGINS_ENV = config(
    "CORS_ALLOWED_ORIGINS",
    default="https://startup-connect-hub.vercel.app"
)

# Convert comma-separated string to list
CORS_ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in CORS_ALLOWED_ORIGINS_ENV.split(",") 
    if origin.strip()
]

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://startup-connect-.*\.vercel\.app$",
]


# Explicitly allow these methods
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# CRITICAL: Explicitly allow Authorization header

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_EXPOSE_HEADERS = [
    "content-type",
    "x-csrftoken",
]

CORS_PREFLIGHT_MAX_AGE = 86400


# ------------------------------------------------------------------------------
# CSRF (REQUIRED FOR RENDER + VERCEL)
# ------------------------------------------------------------------------------
# Read from environment variable first, then use defaults
CSRF_TRUSTED_ORIGINS_ENV = config(
    "CSRF_TRUSTED_ORIGINS",
    default="https://startup-connect-hub.vercel.app,https://*.vercel.app,https://startup-connect-hub.onrender.com"
)

# Convert comma-separated string to list
CSRF_TRUSTED_ORIGINS = [
    origin.strip() 
    for origin in CSRF_TRUSTED_ORIGINS_ENV.split(",") 
    if origin.strip()
]

# IMPORTANT: Disable CSRF for API endpoints using JWT
# Django REST Framework with JWT doesn't need CSRF protection
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = not DEBUG

# ------------------------------------------------------------------------------
# PRODUCTION SECURITY (ONLY WHEN DEBUG = FALSE)
# ------------------------------------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 3600
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True