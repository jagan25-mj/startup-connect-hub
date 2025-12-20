import React, { createContext, useContext, useEffect, useState } from 'react';

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

  const refreshToken = async (): Promise<boolean> => {
    if (!tokens?.refresh) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      if (!response.ok) {
        signOut();
        return false;
      }

      const data = await response.json();
      const newTokens = { access: data.access, refresh: tokens.refresh };
      setTokens(newTokens);
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
      return true;
    } catch (error) {
      signOut();
      return false;
    }
  };

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
        return { error: data.error || 'Registration failed' };
      }

      setUser(data.user);
      setTokens(data.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens));
      return { error: null };
    } catch (error) {
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
        return { error: data.error || 'Login failed' };
      }

      setUser(data.user);
      setTokens(data.tokens);
      localStorage.setItem('auth_tokens', JSON.stringify(data.tokens));
      return { error: null };
    } catch (error) {
      return { error: 'Network error' };
    }
  };

  const signOut = async () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
  };

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
          signOut();
        }
      } else {
        signOut();
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
          // Try to refresh token
          const refreshed = await refreshToken();
          if (refreshed && tokens?.access) {
            try {
              const profile = await fetchProfile(tokens.access);
              setUser(profile);
            } catch (error) {
              localStorage.removeItem('auth_tokens');
            }
          } else {
            localStorage.removeItem('auth_tokens');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

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
