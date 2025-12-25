from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import exception_handler
from django.contrib.auth import get_user_model
from django.conf import settings

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
)
from .models import Profile

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new user.
    
    POST /api/auth/register/
    Body: {
        "email": "user@example.com",
        "password": "password123",
        "password_confirm": "password123",
        "full_name": "John Doe",
        "role": "founder"  # or "talent"
    }
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Return user data with tokens
        user_data = UserProfileSerializer(user).data
        
        return Response({
            'user': user_data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'Account created successfully!'
        }, status=status.HTTP_201_CREATED)
    
    # FIXED: Return serializer errors directly for better frontend handling
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login a user and return JWT tokens.
    
    POST /api/auth/login/
    Body: {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    serializer = UserLoginSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Return user data with tokens
        user_data = UserProfileSerializer(user).data
        
        return Response({
            'user': user_data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'Login successful!'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Get or update the current user's profile.
    
    GET /api/auth/me/
    PUT/PATCH /api/auth/me/
    Body (for PUT/PATCH): {
        "full_name": "John Doe Updated",
        "bio": "Software engineer...",
        "skills": ["Python", "Django"],
        "avatar_url": "https://..."
    }
    """
    user = request.user
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = UserUpdateSerializer(
            user,
            data=request.data,
            partial=partial
        )
        
        if serializer.is_valid():
            serializer.save()
            user_data = UserProfileSerializer(user).data
            return Response({
                'user': user_data,
                'message': 'Profile updated successfully!'
            })
        
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint.
    
    GET /api/health/
    """
    return Response({
        'status': 'ok',
        'message': 'Startup Platform API is running',
        'version': '1.0.0'
    })


class UserListView(generics.ListAPIView):
    """
    List all users (for admin or discovery).
    
    GET /api/users/
    """
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter users by role if specified."""
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        
        if role and role in [User.Role.FOUNDER, User.Role.TALENT]:
            queryset = queryset.filter(role=role)
        
        return queryset


class UserDetailView(generics.RetrieveAPIView):
    """
    Get a specific user's profile.
    
    GET /api/users/<uuid:pk>/
    """
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


class ProfileDetailView(generics.RetrieveAPIView):
    """
    Get a user's profile.
    
    GET /api/profiles/<uuid:user_id>/
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'user_id'
    lookup_url_kwarg = 'user_id'
    
    def get_queryset(self):
        """Return profiles for active users."""
        return Profile.objects.select_related('user').filter(user__is_active=True)


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    """
    Get and update the current user's profile.
    
    GET /api/profiles/me/
    PUT /api/profiles/me/
    """
    serializer_class = ProfileUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Return the current user's profile."""
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    def get_serializer_class(self):
        """Use different serializer for GET vs PUT."""
        if self.request.method == 'GET':
            return ProfileSerializer
        return ProfileUpdateSerializer


def custom_exception_handler(exc, context):
    """
    Custom exception handler that always returns JSON
    """
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception
        return Response(
            {
                "error": "An unexpected error occurred",
                "detail": str(exc) if settings.DEBUG else "Internal server error"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Normalize error format
    if isinstance(response.data, dict):
        if 'detail' not in response.data and 'error' not in response.data:
            response.data = {"error": "Validation error", "details": response.data}
    
    return response