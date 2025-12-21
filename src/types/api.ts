/**
 * Centralized API type definitions
 * Ensures type safety across the application
 */

// ============================================================================
// AUTH TYPES
// ============================================================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined');
}

export const apiClient = {
  post: (path: string, body?: any, options?: RequestInit) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      ...options,
    }),
};




export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'founder' | 'talent';
  bio: string | null;
  skills: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  role: 'founder' | 'talent';
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  user_role: 'founder' | 'talent';
  bio: string | null;
  skills: string[];
  experience: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateRequest {
  bio?: string;
  skills?: string[];
  experience?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
}

// ============================================================================
// STARTUP TYPES
// ============================================================================

export interface Startup {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  website: string | null;
  owner_id: string;
  owner_name: string;
  interest_count: number;
  created_at: string;
  updated_at: string;
}

export interface StartupCreateRequest {
  name: string;
  description?: string;
  industry?: string;
  stage?: string;
  website?: string;
}

export interface StartupUpdateRequest {
  name?: string;
  description?: string;
  industry?: string;
  stage?: string;
  website?: string;
}

export interface StartupResponse {
  startup: Startup;
  message: string;
}

// ============================================================================
// INTEREST TYPES
// ============================================================================

export interface Interest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  startup_id: string;
  startup_name: string;
  created_at: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  message: string;
  status?: number;
  details?: Record<string, string[]>;
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

export interface HealthResponse {
  status: string;
  message: string;
  version: string;
}
