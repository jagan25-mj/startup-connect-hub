from django.urls import path
from . import views

app_name = 'startups'

urlpatterns = [
    # Startup CRUD endpoints
    path('', views.StartupListCreateView.as_view(), name='startup-list-create'),
    path('my/', views.MyStartupsView.as_view(), name='my-startups'),
    path('<uuid:pk>/', views.StartupDetailView.as_view(), name='startup-detail'),
]