from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from .models import Startup, StartupInterest
from .serializers import (
    StartupSerializer,
    StartupCreateSerializer,
    StartupUpdateSerializer,
    StartupInterestSerializer,
)
from accounts.models import User


class IsOwnerOrReadOnly(IsAuthenticated):
    """
    Custom permission to only allow owners to edit their startups.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.owner == request.user


class IsTalent(IsAuthenticated):
    """
    Custom permission to only allow talent users.
    """
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.Role.TALENT


class IsFounderAndOwner(IsAuthenticated):
    """
    Custom permission to only allow founders to view interests for their startups.
    """
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.Role.FOUNDER
    
    def has_object_permission(self, request, view, obj):
        # Only founder owners can view interests for their startup
        return obj.owner == request.user


class StartupListCreateView(generics.ListCreateAPIView):
    """
    List all startups or create a new startup.
    
    GET /api/startups/
    POST /api/startups/
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StartupCreateSerializer
        return StartupSerializer
    
    def get_queryset(self):
        """
        Return all startups or filter by owner if requested.
        """
        queryset = Startup.objects.select_related('owner').all()
        
        # Filter by owner if 'my' parameter is present
        if self.request.query_params.get('my') == 'true':
            queryset = queryset.filter(owner=self.request.user)
        
        # Filter by owner_id if specified
        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner__id=owner_id)
        
        # Filter by industry if specified
        industry = self.request.query_params.get('industry')
        if industry:
            queryset = queryset.filter(industry__iexact=industry)
        
        # Filter by stage if specified
        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage__iexact=stage)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Create a new startup with the current user as owner.
        Only founders can create startups.
        """
        if self.request.user.role != User.Role.FOUNDER:
            raise PermissionDenied(
                'Only founders can create startups.'
            )
        
        serializer.save(owner=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override to return custom success message."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return full startup data
        startup = Startup.objects.get(id=serializer.instance.id)
        response_serializer = StartupSerializer(startup)
        
        return Response({
            'startup': response_serializer.data,
            'message': 'Startup created successfully!'
        }, status=status.HTTP_201_CREATED)


class StartupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a startup.
    
    GET /api/startups/<uuid:startup_id>/
    PUT/PATCH /api/startups/<uuid:startup_id>/
    DELETE /api/startups/<uuid:startup_id>/
    """
    queryset = Startup.objects.select_related('owner').all()
    permission_classes = [IsOwnerOrReadOnly]
    lookup_field = 'id'  # ✅ FIXED: Added lookup field
    lookup_url_kwarg = 'startup_id'  # ✅ FIXED: Added lookup URL kwarg
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return StartupUpdateSerializer
        return StartupSerializer
    
    def update(self, request, *args, **kwargs):
        """Override to return custom success message."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return full startup data
        response_serializer = StartupSerializer(instance)
        
        return Response({
            'startup': response_serializer.data,
            'message': 'Startup updated successfully!'
        })
    
    def destroy(self, request, *args, **kwargs):
        """Override to return custom success message."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'message': 'Startup deleted successfully!'
        }, status=status.HTTP_200_OK)


class MyStartupsView(generics.ListAPIView):
    """
    List all startups owned by the current user.
    
    GET /api/startups/my/
    """
    serializer_class = StartupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return startups owned by the current user."""
        return Startup.objects.filter(owner=self.request.user).select_related('owner')


class StartupInterestCreateDestroyView(generics.CreateAPIView, generics.DestroyAPIView):
    """
    Create or delete interest in a startup.
    
    POST /api/startups/<id>/interest/
    DELETE /api/startups/<id>/interest/
    """
    serializer_class = StartupInterestSerializer
    permission_classes = [IsTalent]
    
    def get_queryset(self):
        """Return interests for the current user."""
        return StartupInterest.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create interest with current user and startup."""
        startup = get_object_or_404(Startup, id=self.kwargs['startup_id'])
        serializer.save(user=self.request.user, startup=startup)
    
    def create(self, request, *args, **kwargs):
        """Override to check for existing interest."""
        startup = get_object_or_404(Startup, id=self.kwargs['startup_id'])
        
        # Check if interest already exists
        if StartupInterest.objects.filter(user=request.user, startup=startup).exists():
            return Response({
                'message': 'You have already expressed interest in this startup.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return super().create(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete interest if it exists."""
        startup = get_object_or_404(Startup, id=self.kwargs['startup_id'])
        
        try:
            interest = StartupInterest.objects.get(user=request.user, startup=startup)
            interest.delete()
            return Response({
                'message': 'Interest withdrawn successfully!'
            }, status=status.HTTP_200_OK)
        except StartupInterest.DoesNotExist:
            return Response({
                'message': 'You have not expressed interest in this startup.'
            }, status=status.HTTP_400_BAD_REQUEST)


class StartupInterestsListView(generics.ListAPIView):
    """
    List all interests for a specific startup.
    
    GET /api/startups/<id>/interests/
    """
    serializer_class = StartupInterestSerializer
    permission_classes = [IsFounderAndOwner]
    
    def get_queryset(self):
        """Return interests for the startup, only if user is the owner."""
        startup = get_object_or_404(Startup, id=self.kwargs['startup_id'])
        self.check_object_permissions(self.request, startup)
        return StartupInterest.objects.filter(startup=startup).select_related('user', 'startup')


class MyInterestsView(generics.ListAPIView):
    """
    List all interests expressed by the current user.
    
    GET /api/my/interests/
    """
    serializer_class = StartupInterestSerializer
    permission_classes = [IsTalent]
    
    def get_queryset(self):
        """Return interests for the current user."""
        return StartupInterest.objects.filter(user=self.request.user).select_related('user', 'startup')