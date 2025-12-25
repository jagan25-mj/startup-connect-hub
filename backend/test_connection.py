#!/usr/bin/env python3
"""
Comprehensive Backend Connection Test
Tests CORS, JWT Auth, API endpoints, and network error handling
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8000/api"
FRONTEND_ORIGIN = "http://localhost:8080"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name: str):
    print(f"\n{Colors.BLUE}🧪 Testing: {name}{Colors.END}")

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def test_cors_preflight():
    """Test CORS preflight (OPTIONS) requests"""
    print_test("CORS Preflight (OPTIONS)")
    
    headers = {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
    
    response = requests.options(f"{BASE_URL}/auth/login/", headers=headers)
    
    if response.status_code == 200:
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        if cors_headers['Access-Control-Allow-Origin']:
            print_success(f"CORS Origin: {cors_headers['Access-Control-Allow-Origin']}")
        else:
            print_error("Missing Access-Control-Allow-Origin header")
            
        if cors_headers['Access-Control-Allow-Methods']:
            print_success(f"Allowed Methods: {cors_headers['Access-Control-Allow-Methods']}")
        else:
            print_error("Missing Access-Control-Allow-Methods header")
            
        if cors_headers['Access-Control-Allow-Headers']:
            print_success(f"Allowed Headers: {cors_headers['Access-Control-Allow-Headers']}")
        else:
            print_error("Missing Access-Control-Allow-Headers header")
    else:
        print_error(f"OPTIONS request failed: {response.status_code}")

def test_health_endpoint():
    """Test health check endpoint"""
    print_test("Health Endpoint (No Auth Required)")
    
    try:
        response = requests.get(f"{BASE_URL}/health/")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Status: {data.get('status')}")
            print_success(f"Message: {data.get('message')}")
            print_success(f"Version: {data.get('version')}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Connection failed: {str(e)}")
        return False

def test_user_registration():
    """Test user registration and JWT token generation"""
    print_test("User Registration & JWT Token Generation")
    
    user_data = {
        "email": f"test_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "password_confirm": "TestPassword123!",
        "full_name": "Test User",
        "role": "founder"
    }
    
    headers = {'Origin': FRONTEND_ORIGIN}
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register/",
            json=user_data,
            headers=headers
        )
        
        if response.status_code == 201:
            data = response.json()
            
            if 'tokens' in data:
                print_success(f"Access Token: {data['tokens']['access'][:50]}...")
                print_success(f"Refresh Token: {data['tokens']['refresh'][:50]}...")
                print_success(f"User ID: {data['user']['id']}")
                print_success(f"User Email: {data['user']['email']}")
                return data['tokens'], data['user']
            else:
                print_error("No tokens in response")
                return None, None
        else:
            print_error(f"Registration failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return None, None

def test_jwt_authentication(tokens: Dict[str, str]):
    """Test JWT authentication"""
    print_test("JWT Authentication")
    
    if not tokens:
        print_warning("Skipping - no tokens available")
        return False
    
    headers = {
        'Authorization': f"Bearer {tokens['access']}",
        'Origin': FRONTEND_ORIGIN
    }
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Authenticated User: {data.get('email')}")
            print_success(f"Role: {data.get('role')}")
            return True
        else:
            print_error(f"Authentication failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_token_refresh(tokens: Dict[str, str]):
    """Test JWT token refresh"""
    print_test("JWT Token Refresh")
    
    if not tokens:
        print_warning("Skipping - no tokens available")
        return
    
    headers = {'Origin': FRONTEND_ORIGIN}
    refresh_data = {'refresh': tokens['refresh']}
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/token/refresh/",
            json=refresh_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"New Access Token: {data['access'][:50]}...")
        else:
            print_error(f"Token refresh failed: {response.status_code}")
    except Exception as e:
        print_error(f"Request failed: {str(e)}")

def test_unauthorized_access():
    """Test unauthorized access (401 error)"""
    print_test("Unauthorized Access (401 Error Handling)")
    
    headers = {'Origin': FRONTEND_ORIGIN}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
        
        if response.status_code == 401:
            print_success("Correctly returns 401 for unauthorized access")
            
            # Check if response is JSON
            try:
                data = response.json()
                print_success(f"JSON error response: {json.dumps(data, indent=2)}")
            except:
                print_error("Response is not JSON")
        else:
            print_error(f"Expected 401, got {response.status_code}")
    except Exception as e:
        print_error(f"Request failed: {str(e)}")

def test_invalid_endpoint():
    """Test 404 error handling"""
    print_test("Invalid Endpoint (404 Error Handling)")
    
    headers = {'Origin': FRONTEND_ORIGIN}
    
    try:
        response = requests.get(f"{BASE_URL}/nonexistent/", headers=headers)
        
        if response.status_code == 404:
            print_success("Correctly returns 404 for invalid endpoint")
            
            try:
                data = response.json()
                print_success(f"JSON error response: {json.dumps(data, indent=2)}")
            except:
                print_warning("Response is not JSON (might be HTML)")
        else:
            print_warning(f"Expected 404, got {response.status_code}")
    except Exception as e:
        print_error(f"Request failed: {str(e)}")

def test_cors_with_credentials(tokens: Dict[str, str]):
    """Test CORS with credentials"""
    print_test("CORS with Credentials")
    
    if not tokens:
        print_warning("Skipping - no tokens available")
        return
    
    headers = {
        'Authorization': f"Bearer {tokens['access']}",
        'Origin': FRONTEND_ORIGIN
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me/",
            headers=headers,
            # Note: requests doesn't send credentials by default like browser fetch()
        )
        
        cors_creds = response.headers.get('Access-Control-Allow-Credentials')
        if cors_creds:
            print_success(f"Allow Credentials: {cors_creds}")
        else:
            print_warning("Access-Control-Allow-Credentials header not present")
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}STARTUP CONNECT HUB - BACKEND CONNECTION TEST{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"\nBackend URL: {BASE_URL}")
    print(f"Frontend Origin: {FRONTEND_ORIGIN}")
    
    # Run tests
    health_ok = test_health_endpoint()
    
    if not health_ok:
        print_error("\n❌ Backend is not accessible. Please start the Django server.")
        print_error("   Run: cd backend && python manage.py runserver")
        return
    
    test_cors_preflight()
    test_unauthorized_access()
    test_invalid_endpoint()
    
    tokens, user = test_user_registration()
    
    if tokens:
        test_jwt_authentication(tokens)
        test_token_refresh(tokens)
        test_cors_with_credentials(tokens)
    
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.GREEN}✅ Test Suite Completed{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")

if __name__ == "__main__":
    main()
