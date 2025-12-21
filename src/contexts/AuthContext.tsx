import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types/api';
import { API_ENDPOINTS } from '@/lib/api';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'founder' | 'talent') => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign out handler
  const signOut = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('auth_tokens');
  }, []);

  // Sign up handler
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'founder' | 'talent'
  ) => {
    try {
      const requestData: RegisterRequest = {
        email,
        password,
        password_confirm: password,
        full_name: fullName,
        role,
      };

      const data = await apiClient.post<AuthResponse>('/auth/register/', requestData);

      setUser(data.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        error: error.details?.password?.[0] ||
               error.details?.email?.[0] ||
               error.message ||
               'Registration failed'
      };
    }
  };

  // Sign in handler
  const signIn = async (email: string, password: string) => {
    try {
      const requestData: LoginRequest = { email, password };
      const data = await apiClient.post<AuthResponse>('/auth/login/', requestData);

      setUser(data.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        error: error.message || 'Login failed'
      };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    try {
      const profile = await apiClient.get<User>('/auth/me/');
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      await signOut();
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing auth...');
      const storedTokens = localStorage.getItem('auth_tokens');
      
      if (storedTokens) {
        try {
          const profile = await apiClient.get<User>('/auth/me/');
          setUser(profile);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('auth_tokens');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}