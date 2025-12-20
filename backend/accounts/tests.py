from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class UserRegistrationTestCase(TestCase):
    """Test cases for user registration."""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.valid_payload = {
            'email': 'testuser@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'full_name': 'Test User',
            'role': 'founder'
        }
    
    def test_register_user_success(self):
        """Test successful user registration."""
        response = self.client.post(
            self.register_url,
            self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(User.objects.count(), 1)
    
    def test_register_user_password_mismatch(self):
        """Test registration with mismatched passwords."""
        payload = self.valid_payload.copy()
        payload['password_confirm'] = 'differentpass'
        response = self.client.post(
            self.register_url,
            payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_user_duplicate_email(self):
        """Test registration with duplicate email."""
        User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            full_name='Existing User',
            role='talent'
        )
        response = self.client.post(
            self.register_url,
            self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginTestCase(TestCase):
    """Test cases for user login."""
    
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            full_name='Test User',
            role='founder'
        )
    
    def test_login_success(self):
        """Test successful login."""
        payload = {
            'email': 'testuser@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        payload = {
            'email': 'testuser@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileTestCase(TestCase):
    """Test cases for user profile endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.me_url = '/api/auth/me/'
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            full_name='Test User',
            role='talent'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_get_profile(self):
        """Test getting user profile."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
    
    def test_update_profile(self):
        """Test updating user profile."""
        payload = {
            'full_name': 'Updated Name',
            'bio': 'This is my bio'
        }
        response = self.client.patch(self.me_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, 'Updated Name')
        self.assertEqual(self.user.bio, 'This is my bio')
    
    def test_profile_requires_authentication(self):
        """Test that profile endpoint requires authentication."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)