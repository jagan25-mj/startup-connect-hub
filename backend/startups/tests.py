from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Startup

User = get_user_model()


class StartupCreateTestCase(TestCase):
    """Test cases for creating startups."""
    
    def setUp(self):
        self.client = APIClient()
        self.startups_url = '/api/startups/'
        self.founder = User.objects.create_user(
            email='founder@example.com',
            password='testpass123',
            full_name='Founder User',
            role='founder'
        )
        self.talent = User.objects.create_user(
            email='talent@example.com',
            password='testpass123',
            full_name='Talent User',
            role='talent'
        )
        self.valid_payload = {
            'name': 'Test Startup',
            'description': 'This is a test startup',
            'industry': 'Technology',
            'stage': 'Seed',
            'website': 'https://teststartup.com'
        }
    
    def test_founder_can_create_startup(self):
        """Test that founders can create startups."""
        self.client.force_authenticate(user=self.founder)
        response = self.client.post(
            self.startups_url,
            self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Startup.objects.count(), 1)
        startup = Startup.objects.first()
        self.assertEqual(startup.owner, self.founder)
    
    def test_talent_cannot_create_startup(self):
        """Test that talent users cannot create startups."""
        self.client.force_authenticate(user=self.talent)
        response = self.client.post(
            self.startups_url,
            self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_startup_requires_authentication(self):
        """Test that creating startup requires authentication."""
        response = self.client.post(
            self.startups_url,
            self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StartupListTestCase(TestCase):
    """Test cases for listing startups."""
    
    def setUp(self):
        self.client = APIClient()
        self.startups_url = '/api/startups/'
        self.founder = User.objects.create_user(
            email='founder@example.com',
            password='testpass123',
            full_name='Founder User',
            role='founder'
        )
        self.talent = User.objects.create_user(
            email='talent@example.com',
            password='testpass123',
            full_name='Talent User',
            role='talent'
        )
        # Create test startups
        Startup.objects.create(
            name='Startup 1',
            description='First startup',
            owner=self.founder
        )
        Startup.objects.create(
            name='Startup 2',
            description='Second startup',
            owner=self.founder
        )
    
    def test_authenticated_user_can_list_startups(self):
        """Test that authenticated users can list startups."""
        self.client.force_authenticate(user=self.talent)
        response = self.client.get(self.startups_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_list_requires_authentication(self):
        """Test that listing startups requires authentication."""
        response = self.client.get(self.startups_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StartupUpdateDeleteTestCase(TestCase):
    """Test cases for updating and deleting startups."""
    
    def setUp(self):
        self.client = APIClient()
        self.founder = User.objects.create_user(
            email='founder@example.com',
            password='testpass123',
            full_name='Founder User',
            role='founder'
        )
        self.other_founder = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            full_name='Other Founder',
            role='founder'
        )
        self.startup = Startup.objects.create(
            name='Test Startup',
            description='Test description',
            owner=self.founder
        )
        self.startup_url = f'/api/startups/{self.startup.id}/'
    
    def test_owner_can_update_startup(self):
        """Test that owners can update their startups."""
        self.client.force_authenticate(user=self.founder)
        payload = {'name': 'Updated Startup Name'}
        response = self.client.patch(
            self.startup_url,
            payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.startup.refresh_from_db()
        self.assertEqual(self.startup.name, 'Updated Startup Name')
    
    def test_non_owner_cannot_update_startup(self):
        """Test that non-owners cannot update startups."""
        self.client.force_authenticate(user=self.other_founder)
        payload = {'name': 'Hacked Name'}
        response = self.client.patch(
            self.startup_url,
            payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_owner_can_delete_startup(self):
        """Test that owners can delete their startups."""
        self.client.force_authenticate(user=self.founder)
        response = self.client.delete(self.startup_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Startup.objects.count(), 0)
    
    def test_non_owner_cannot_delete_startup(self):
        """Test that non-owners cannot delete startups."""
        self.client.force_authenticate(user=self.other_founder)
        response = self.client.delete(self.startup_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Startup.objects.count(), 1)