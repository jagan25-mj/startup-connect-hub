from rest_framework import serializers
from .models import Startup, StartupInterest


class StartupSerializer(serializers.ModelSerializer):
    """Serializer for Startup model."""
    
    owner_id = serializers.UUIDField(source='owner.id', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    interest_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Startup
        fields = [
            'id',
            'name',
            'description',
            'industry',
            'stage',
            'website',
            'owner_id',
            'owner_name',
            'interest_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner_id', 'owner_name', 'interest_count', 'created_at', 'updated_at']
    
    def get_interest_count(self, obj):
        """Return the number of interests for this startup."""
        return obj.interests.count()
    
    def validate_name(self, value):
        """Validate that name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Startup name cannot be empty.')
        return value.strip()
    
    def validate_website(self, value):
        """Validate website URL format."""
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError(
                'Website URL must start with http:// or https://'
            )
        return value


class StartupCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new startup."""
    
    class Meta:
        model = Startup
        fields = [
            'name',
            'description',
            'industry',
            'stage',
            'website',
        ]
    
    def validate_name(self, value):
        """Validate that name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Startup name cannot be empty.')
        return value.strip()
    
    def validate_website(self, value):
        """Validate website URL format."""
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError(
                'Website URL must start with http:// or https://'
            )
        return value


class StartupUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a startup."""
    
    class Meta:
        model = Startup
        fields = [
            'name',
            'description',
            'industry',
            'stage',
            'website',
        ]
    
    def validate_name(self, value):
        """Validate that name is not empty."""
        if value is not None and (not value or not value.strip()):
            raise serializers.ValidationError('Startup name cannot be empty.')
        return value.strip() if value else value
    
    def validate_website(self, value):
        """Validate website URL format."""
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError(
                'Website URL must start with http:// or https://'
            )
        return value


class StartupInterestSerializer(serializers.ModelSerializer):
    """Serializer for StartupInterest model."""
    
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    startup_id = serializers.UUIDField(source='startup.id', read_only=True)
    startup_name = serializers.CharField(source='startup.name', read_only=True)
    
    class Meta:
        model = StartupInterest
        fields = [
            'id',
            'user_id',
            'user_name',
            'user_email',
            'startup_id',
            'startup_name',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']