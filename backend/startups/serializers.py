from rest_framework import serializers
from .models import Startup


class StartupSerializer(serializers.ModelSerializer):
    """Serializer for Startup model."""
    
    owner_id = serializers.UUIDField(source='owner.id', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    
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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner_id', 'owner_name', 'created_at', 'updated_at']
    
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