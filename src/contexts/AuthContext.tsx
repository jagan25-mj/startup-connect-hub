import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { apiClient, ApiError } from '@/lib/apiClient';
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@/types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'founder' | 'talent'
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('auth_tokens');
  }, []);

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

      const data = await apiClient.post<AuthResponse>(
        '/auth/register/',
        requestData
      );

      setUser(data.user);
      return { error: null };
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Sign up error:', apiError);

      if (apiError.isNetworkError) {
        return {
          error: apiError.message,
        };
      }

      if (apiError.isValidationError && apiError.details) {
        const message =
          apiError.details.email?.[0] ||
          apiError.details.password?.[0] ||
          apiError.details.full_name?.[0] ||
          apiError.details.role?.[0] ||
          'Invalid registration details';
        return { error: message };
      }

      return { error: apiError.message || 'Registration failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const requestData: LoginRequest = { email, password };

      const data = await apiClient.post<AuthResponse>(
        '/auth/login/',
        requestData
      );

      setUser(data.user);
      return { error: null };
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Sign in error:', apiError);

      if (apiError.isNetworkError) {
        return { error: apiError.message };
      }

      if (apiError.isAuthError) {
        return { error: 'Invalid email or password' };
      }

      return { error: apiError.message || 'Login failed' };
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiClient.get<User>('/auth/me/');
      setUser(profile);
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Failed to refresh profile:', apiError);

      if (apiError.isNetworkError) return;
      await signOut();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = localStorage.getItem('auth_tokens');

      if (storedTokens) {
        try {
          const profile = await apiClient.get<User>('/auth/me/');
          setUser(profile);
        } catch (error) {
          const apiError = error as ApiError;
          console.error('Failed to restore session:', apiError);

          if (!apiError.isNetworkError) {
            localStorage.removeItem('auth_tokens');
          }
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}