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

  // ✅ FIXED: signOut no longer depends on state
  const signOut = useCallback(async () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
  }, []);

  // ✅ FIXED: refreshToken uses localStorage directly to avoid circular dependency
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (!storedTokens) return false;

    try {
      const parsedTokens = JSON.parse(storedTokens);
      if (!parsedTokens?.refresh) return false;

      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: parsedTokens.refresh }),
      });

      if (!response.ok) {
        localStorage.removeItem('auth_tokens');
        setTokens(null);
        setUser(null);
        return false;
      }

      const data = await response.json();
      const newTokens = { access: data.access, refresh: parsedTokens.refresh };
      setTokens(newTokens);
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
      return true;
    } catch (error) {
      localStorage.removeItem('auth_tokens');
      setTokens(null);
      setUser(null);
      return false;
    }
  }, []); // ✅ FIXED: No dependencies

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

  const refreshProfile = async () => {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (!storedTokens) return;

    try {
      const parsedTokens = JSON.parse(storedTokens);
      if (!parsedTokens?.access) return;

      const profile = await fetchProfile(parsedTokens.access);
      setUser(profile);
    } catch (error) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newTokens = localStorage.getItem('auth_tokens');
        if (newTokens) {
          try {
            const parsedNewTokens = JSON.parse(newTokens);
            const profile = await fetchProfile(parsedNewTokens.access);
            setUser(profile);
          } catch (error) {
            await signOut();
          }
        }
      } else {
        await signOut();
      }
    }
  };

  // ✅ FIXED: useEffect runs once on mount with no dependencies
  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing auth...');
      const storedTokens = localStorage.getItem('auth_tokens');
      if (storedTokens) {
        try {
          const parsedTokens = JSON.parse(storedTokens);
          setTokens(parsedTokens);

          try {
            const profile = await fetchProfile(parsedTokens.access);
            setUser(profile);
          } catch (error) {
            console.error('Error fetching profile with stored token:', error);
            
            // Try to refresh token
            const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh: parsedTokens.refresh }),
            });

            if (response.ok) {
              const data = await response.json();
              const newTokens = { access: data.access, refresh: parsedTokens.refresh };
              setTokens(newTokens);
              localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
              
              try {
                const profile = await fetchProfile(newTokens.access);
                setUser(profile);
              } catch (error) {
                console.error('Error fetching profile after refresh:', error);
                localStorage.removeItem('auth_tokens');
                setTokens(null);
              }
            } else {
              localStorage.removeItem('auth_tokens');
              setTokens(null);
            }
          }
        } catch (error) {
          console.error('Error parsing stored tokens:', error);
          localStorage.removeItem('auth_tokens');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []); // ✅ FIXED: Empty dependency array - runs once on mount

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