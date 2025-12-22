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
    this.baseUrl = config.apiBaseUrl.replace(/\/$/, ""); // remove trailing slash
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
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
      });

      // ------------------ HANDLE 401 ------------------
      if (response.status === 401 && tokens?.refresh) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.subscribe(async (newToken) => {
              if (!newToken) {
                reject(this.createError("Session expired", 401));
                return;
              }

              headers["Authorization"] = `Bearer ${newToken}`;
              const retry = await fetch(url, { ...options, headers });

              if (!retry.ok) {
                reject(await this.parseError(retry));
              } else {
                resolve(await retry.json());
              }
            });
          });
        }

        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;
        this.notify(newToken);

        if (!newToken) {
          window.location.href = "/auth";
          throw this.createError("Session expired", 401);
        }

        headers["Authorization"] = `Bearer ${newToken}`;
        const retry = await fetch(url, { ...options, headers });

        if (!retry.ok) throw await this.parseError(retry);
        return await retry.json();
      }

      // ------------------ OTHER ERRORS ------------------
      if (!response.ok) {
        throw await this.parseError(response);
      }

      // ------------------ SUCCESS ------------------
      if (response.status === 204) return {} as T;

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
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

  private createError(
    message: string,
    status?: number,
    details?: unknown
  ): ApiError {
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

// Singleton
export const apiClient = new ApiClient();
