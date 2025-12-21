from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a profile for the user when the user is created."""
    if created:
        Profile.objects.create(user=instance)


# ✅ FIXED: Removed save_user_profile signal
# Profiles should be saved explicitly through the API when updated
# The previous implementation was causing unnecessary saves on every user update