/**
 * Centralized API client with automatic token refresh
 * Compatible with Django REST + SimpleJWT
 */

import { config } from "./config";

interface AuthTokens {
  access: string;
  refresh: string;
}

interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor() {
    this.baseUrl = config.apiBaseUrl.replace(/\/$/, "");
  }

  // ---------------------------------------------------------------------------
  // TOKEN STORAGE
  // ---------------------------------------------------------------------------
  private getTokens(): AuthTokens | null {
    try {
      const raw = localStorage.getItem("auth_tokens");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
  }

  private clearTokens(): void {
    localStorage.removeItem("auth_tokens");
  }

  // ---------------------------------------------------------------------------
  // TOKEN REFRESH HANDLING
  // ---------------------------------------------------------------------------
  private subscribe(callback: (token: string | null) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private notify(token: string | null): void {
    this.refreshSubscribers.forEach(cb => cb(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<string | null> {
    const tokens = this.getTokens();
    if (!tokens?.refresh) return null;

    try {
      const res = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      if (!res.ok) {
        this.clearTokens();
        return null;
      }

      const data = await res.json();
      this.setTokens({ access: data.access, refresh: tokens.refresh });
      return data.access;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // CORE REQUEST METHOD
  // ---------------------------------------------------------------------------
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const tokens = this.getTokens();
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (tokens?.access) {
      headers["Authorization"] = `Bearer ${tokens.access}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // ------------------ HANDLE 401 (TOKEN REFRESH) ------------------
      if (response.status === 401 && tokens?.refresh) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.subscribe(async (newToken) => {
              if (!newToken) {
                reject(this.createError("Session expired", 401));
                return;
              }

              headers["Authorization"] = `Bearer ${newToken}`;

              try {
                const retry = await fetch(url, {
                  ...options,
                  headers,
                  credentials: "include",
                });

                if (!retry.ok) {
                  reject(await this.parseError(retry));
                } else {
                  resolve(await retry.json());
                }
              } catch {
                reject(this.createError("Network request failed"));
              }
            });
          });
        }

        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;
        this.notify(newToken);

        if (!newToken) {
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
          }
          throw this.createError("Session expired", 401);
        }

        headers["Authorization"] = `Bearer ${newToken}`;
        const retry = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });

        if (!retry.ok) throw await this.parseError(retry);
        if (retry.status === 204) return {} as T;

        return retry.headers
          .get("content-type")
          ?.includes("application/json")
          ? await retry.json()
          : ({} as T);
      }

      // ------------------ OTHER ERRORS ------------------
      if (!response.ok) {
        throw await this.parseError(response);
      }

      // ------------------ SUCCESS ------------------
      if (response.status === 204) return {} as T;

      return response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : ({} as T);

    } catch (error) {
      // ------------------ IMPROVED NETWORK ERROR HANDLING ------------------
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        const isRenderColdStart = this.baseUrl.includes("onrender.com");

        throw this.createError(
          isRenderColdStart
            ? "Backend is starting up (Render free tier takes ~30s). Please wait and try again."
            : "Unable to connect to server. Please check your internet connection.",
          undefined,
          { networkError: true, isRenderColdStart }
        );
      }

      if (error instanceof Error) throw error;
      throw this.createError("Network request failed");
    }
  }

  // ---------------------------------------------------------------------------
  // ERROR PARSING
  // ---------------------------------------------------------------------------
  private async parseError(response: Response): Promise<ApiError> {
    let message = `HTTP ${response.status}`;
    let details: unknown;

    try {
      const data = await response.json();
      message = data.detail || data.error || data.message || message;
      details = data;
    } catch {
      message = response.statusText || message;
    }

    return this.createError(message, response.status, details);
  }

  private createError(message: string, status?: number, details?: unknown): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.details = details;
    return error;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
