from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for User model with email as the unique identifier."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model that uses email as the primary identifier.
    Supports FOUNDER and TALENT roles for the startup platform.
    """
    
    class Role(models.TextChoices):
        FOUNDER = 'founder', 'Founder'
        TALENT = 'talent', 'Talent'
    
    # Remove username field, use email instead
    username = None
    
    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Role field
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.TALENT,
    )
    
    # Profile fields
    bio = models.TextField(blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)  # Array of skills for talent
    avatar_url = models.URLField(blank=True, null=True, max_length=500)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Set email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is already required by USERNAME_FIELD
    
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email
    
    @property
    def is_founder(self):
        """Check if user is a founder."""
        return self.role == self.Role.FOUNDER
    
    @property
    def is_talent(self):
        """Check if user is talent."""
        return self.role == self.Role.TALENT
    
    def get_full_name(self):
        """Return the full name of the user."""
        return self.full_name or self.email
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.full_name.split()[0] if self.full_name else self.email.split('@')[0]