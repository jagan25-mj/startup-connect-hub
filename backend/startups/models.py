from django.db import models
from django.conf import settings
import uuid


class Startup(models.Model):
    """
    Startup model representing a startup company on the platform.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    stage = models.CharField(max_length=50, blank=True, null=True)
    website = models.URLField(blank=True, null=True, max_length=500)
    
    # Owner relationship (founder)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='startups'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'startups'
        ordering = ['-created_at']
        verbose_name = 'Startup'
        verbose_name_plural = 'Startups'
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['industry']),
            models.Index(fields=['stage']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def owner_name(self):
        """Return the owner's full name."""
        return self.owner.get_full_name()
    
    @property
    def is_owned_by(self):
        """Helper to check ownership."""
        return self.owner


class StartupInterest(models.Model):
    """
    Model representing a talent's interest in a startup.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='startup_interests'
    )
    startup = models.ForeignKey(
        Startup,
        on_delete=models.CASCADE,
        related_name='interests'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'startup_interests'
        ordering = ['-created_at']
        verbose_name = 'Startup Interest'
        verbose_name_plural = 'Startup Interests'
        unique_together = ['user', 'startup']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['startup']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} interested in {self.startup.name}"