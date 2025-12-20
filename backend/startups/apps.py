from django.apps import AppConfig


class StartupsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'startups'
    verbose_name = 'Startups'
    
    def ready(self):
        """Import signals when the app is ready."""
        # You can import signals here if needed in the future
        pass