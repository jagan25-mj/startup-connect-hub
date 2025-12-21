from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'full_name', 'role']
        extra_kwargs = {
            'full_name': {'required': True},
            'role': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match.'
            })
        # FIXED: Remove password_confirm before returning
        attrs.pop('password_confirm')
        return attrs
    
    def validate_email(self, value):
        """Validate that email is unique."""
        if User.objects.filter(email=value.lower()).exists():
            # SECURITY NOTE: This reveals if email exists
            # Consider using generic message in production
            raise serializers.ValidationError(
                'A user with this email already exists.'
            )
        return value.lower()
    
    def validate_role(self, value):
        """Validate role is one of the allowed choices."""
        if value not in [User.Role.FOUNDER, User.Role.TALENT]:
            raise serializers.ValidationError(
                'Invalid role. Must be either "founder" or "talent".'
            )
        return value
    
    def create(self, validated_data):
        """Create and return a new user."""
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate user credentials."""
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError(
                    'Invalid email or password.',
                    code='authorization'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.',
                    code='authorization'
                )
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password".',
                code='authorization'
            )
        
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'bio',
            'skills',
            'avatar_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']
    
    def validate_skills(self, value):
        """Validate that skills is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError('Skills must be a list.')
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = ['full_name', 'bio', 'skills', 'avatar_url']
    
    def validate_skills(self, value):
        """Validate that skills is a list."""
        if value is not None and not isinstance(value, list):
            raise serializers.ValidationError('Skills must be a list.')
        return value


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing profiles."""
    
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id',
            'user_id',
            'user_email',
            'user_full_name',
            'user_role',
            'bio',
            'skills',
            'experience',
            'github_url',
            'linkedin_url',
            'website_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user_id', 'user_email', 'user_full_name', 'user_role', 'created_at', 'updated_at']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating profiles."""
    
    class Meta:
        model = Profile
        fields = [
            'bio',
            'skills',
            'experience',
            'github_url',
            'linkedin_url',
            'website_url',
        ]
    
    def validate_skills(self, value):
        """Validate that skills is a list."""
        if value is not None and not isinstance(value, list):
            raise serializers.ValidationError('Skills must be a list.')
        return value
    
    def validate_github_url(self, value):
        """Validate GitHub URL format."""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError('GitHub URL must start with http:// or https://')
        return value
    
    def validate_linkedin_url(self, value):
        """Validate LinkedIn URL format."""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError('LinkedIn URL must start with http:// or https://')
        return value
    
    def validate_website_url(self, value):
        """Validate website URL format."""
        if value and not (value.startswith('http://') or value.startswith('https://')):
            raise serializers.ValidationError('Website URL must start with http:// or https://')
        return value