from django.urls import path
from . import views

app_name = 'startups'

urlpatterns = [
    # Startup CRUD endpoints
    path('', views.StartupListCreateView.as_view(), name='startup-list-create'),
    path('my/', views.MyStartupsView.as_view(), name='my-startups'),
    path('<uuid:startup_id>/', views.StartupDetailView.as_view(), name='startup-detail'),
    
    # Interest endpoints
    path('<uuid:startup_id>/interest/', views.StartupInterestCreateDestroyView.as_view(), name='startup-interest'),
    path('<uuid:startup_id>/interests/', views.StartupInterestsListView.as_view(), name='startup-interests'),
]