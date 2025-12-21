import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'founder' | 'talent';
  bio: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthContextType {
  user: Profile | null;
  tokens: AuthTokens | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'founder' | 'talent') => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:8000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  };

  const refreshToken = useCallback(async (): Promise<boolean> => {
    // FIXED: Use local variable to avoid race conditions
    const currentTokens = tokens;
    if (!currentTokens?.refresh) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: currentTokens.refresh }),
      });

      if (!response.ok) {
        await signOut();
        return false;
      }

      const data = await response.json();
      const newTokens = { access: data.access, refresh: currentTokens.refresh };
      setTokens(newTokens);
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
      return true;
    } catch (error) {
      await signOut();
      return false;
    }
  }, [tokens, signOut]);

  const signUp = async (email: string, password: string, fullName: string, role: 'founder' | 'talent') => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          password_confirm: password,
          full_name: fullName,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors properly
        if (data.password) {
          return { error: data.password[0] || 'Password validation failed' };
        }
        if (data.email) {
          return { error: data.email[0] || 'Email validation failed' };
        }
        return { error: data.error || data.detail || 'Registration failed' };
      }

      setUser(data.user);
      setTokens(data.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens));
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Network error' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || data.detail || 'Login failed' };
      }

      setUser(data.user);
      setTokens(data.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens));
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Network error' };
    }
  };

  const signOut = useCallback(async () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
  }, []);

  const refreshProfile = async () => {
    if (!tokens?.access) return;

    try {
      const profile = await fetchProfile(tokens.access);
      setUser(profile);
    } catch (error) {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed && tokens?.access) {
        try {
          const profile = await fetchProfile(tokens.access);
          setUser(profile);
        } catch (error) {
          await signOut();
        }
      } else {
        await signOut();
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = localStorage.getItem('auth_tokens');
      if (storedTokens) {
        try {
          const parsedTokens = JSON.parse(storedTokens);
          setTokens(parsedTokens);

          // Try to fetch profile with stored token
          const profile = await fetchProfile(parsedTokens.access);
          setUser(profile);
        } catch (error) {
          // Token might be expired, try refresh
          setTokens(JSON.parse(storedTokens));
          const refreshed = await refreshToken();
          if (refreshed) {
            try {
              const newTokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
              const profile = await fetchProfile(newTokens.access);
              setUser(profile);
            } catch (error) {
              localStorage.removeItem('auth_tokens');
              setTokens(null);
            }
          } else {
            localStorage.removeItem('auth_tokens');
            setTokens(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [refreshToken]);

  return (
    <AuthContext.Provider value={{
      user,
      tokens,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      refreshToken,
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
