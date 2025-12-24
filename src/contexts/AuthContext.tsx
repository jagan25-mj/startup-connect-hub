import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { apiClient } from '@/lib/apiClient';
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

  // ------------------------------------------------------------------
  // SIGN OUT
  // ------------------------------------------------------------------
  const signOut = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('auth_tokens');
  }, []);

  // ------------------------------------------------------------------
  // SIGN UP
  // ------------------------------------------------------------------
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
    } catch (error: any) {
      console.error('Sign up error:', error);

      // NETWORK / COLD START
      if (error.details?.networkError) {
        return {
          error:
            'Unable to connect to server. The backend may be starting up. Please wait a moment and try again.',
        };
      }

      // VALIDATION ERRORS
      if (error.status === 400 && error.details) {
        const message =
          error.details.email?.[0] ||
          error.details.password?.[0] ||
          error.details.full_name?.[0] ||
          error.details.role?.[0];

        return { error: message || 'Invalid registration details' };
      }

      return { error: error.message || 'Registration failed' };
    }
  };

  // ------------------------------------------------------------------
  // SIGN IN
  // ------------------------------------------------------------------
  const signIn = async (email: string, password: string) => {
    try {
      const requestData: LoginRequest = { email, password };

      const data = await apiClient.post<AuthResponse>(
        '/auth/login/',
        requestData
      );

      setUser(data.user);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);

      // NETWORK / COLD START
      if (error.details?.networkError) {
        return {
          error:
            'Unable to connect to server. The backend may be starting up. Please wait and try again.',
        };
      }

      // AUTH ERRORS
      if (error.status === 401) {
        return { error: 'Invalid email or password' };
      }

      return { error: error.message || 'Login failed' };
    }
  };

  // ------------------------------------------------------------------
  // REFRESH PROFILE
  // ------------------------------------------------------------------
  const refreshProfile = async () => {
    try {
      const profile = await apiClient.get<User>('/auth/me/');
      setUser(profile);
    } catch (error: any) {
      console.error('Failed to refresh profile:', error);

      // If network issue, keep user logged in
      if (error.details?.networkError) return;

      // Otherwise invalidate session
      await signOut();
    }
  };

  // ------------------------------------------------------------------
  // INITIAL AUTH RESTORE
  // ------------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = localStorage.getItem('auth_tokens');

      if (storedTokens) {
        try {
          const profile = await apiClient.get<User>('/auth/me/');
          setUser(profile);
        } catch (error: any) {
          console.error('Failed to restore session:', error);

          // Only clear tokens if NOT a network issue
          if (!error.details?.networkError) {
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

// ------------------------------------------------------------------
// HOOK
// ------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
