// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { apiClient } from "@/lib/apiClient";
import type { User, AuthResponse } from "@/types/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: "founder" | "talent"
  ) => Promise<{ error: string | null }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_tokens");
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiClient.post<AuthResponse>("/auth/login/", {
        email,
        password,
      });
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      if (err.details?.networkError) {
        return {
          error:
            "Server is starting up or unreachable. Please try again.",
        };
      }
      return { error: err.message || "Login failed" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: "founder" | "talent"
  ) => {
    try {
      const data = await apiClient.post<AuthResponse>("/auth/register/", {
        email,
        password,
        password_confirm: password,
        full_name: fullName,
        role,
      });
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      if (err.details?.networkError) {
        return {
          error:
            "Server is starting up or unreachable. Please try again.",
        };
      }
      return { error: err.message || "Registration failed" };
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiClient.get<User>("/auth/me/");
      setUser(profile);
    } catch (err: any) {
      if (!err.details?.networkError) {
        signOut();
      }
    }
  };

  // SAFE INITIAL RESTORE
  useEffect(() => {
    const init = async () => {
      const tokens = localStorage.getItem("auth_tokens");
      if (!tokens) {
        setLoading(false);
        return;
      }

      try {
        const profile = await apiClient.get<User>("/auth/me/");
        setUser(profile);
      } catch (err: any) {
        if (!err.details?.networkError) {
          localStorage.removeItem("auth_tokens");
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
