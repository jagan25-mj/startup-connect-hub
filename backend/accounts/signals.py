from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from .models import Profile

User = settings.AUTH_USER_MODEL


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create a profile for the user when the user is created.
    Only runs on user creation (not on every save).
    """
    if created:
        Profile.objects.create(user=instance)
        print(f"✅ Profile created for user: {instance.email}")
