from django.contrib import admin
from .models import Startup


@admin.register(Startup)
class StartupAdmin(admin.ModelAdmin):
    """Admin interface for Startup model."""
    
    list_display = ['name', 'industry', 'stage', 'owner_display', 'created_at']
    list_filter = ['industry', 'stage', 'created_at']
    search_fields = ['name', 'description', 'owner__email', 'owner__full_name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'website')
        }),
        ('Classification', {
            'fields': ('industry', 'stage')
        }),
        ('Ownership', {
            'fields': ('owner',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['owner']
    
    def owner_display(self, obj):
        """Display owner's full name and email."""
        return f"{obj.owner.get_full_name()} ({obj.owner.email})"
    
    owner_display.short_description = 'Owner'