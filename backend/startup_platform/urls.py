"""
URL configuration for startup_platform project.
"""
from django.contrib import admin
from django.urls import path, include
from accounts.views import health_check

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Health check
    path('api/health/', health_check, name='health-check'),
    
    # API endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/startups/', include('startups.urls')),
]