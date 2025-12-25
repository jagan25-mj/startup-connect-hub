/**
 * Production-ready API client with comprehensive error handling
 * Handles Render cold starts, network failures, and token refresh
 */

import { config } from "./config";

interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  details?: Record<string, any>;
  isNetworkError?: boolean;
  isRenderColdStart?: boolean;
  isAuthError?: boolean;
  isValidationError?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];
  private requestCache = new Map<string, Promise<any>>();

  constructor() {
    this.baseUrl = config.apiBaseUrl.replace(/\/$/, "");
  }

  // ---------------------------------------------------------------------------
  // TOKEN MANAGEMENT
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
  // TOKEN REFRESH QUEUE
  // ---------------------------------------------------------------------------
  private subscribe(callback: (token: string | null) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private notify(token: string | null): void {
    this.refreshSubscribers.forEach((cb) => cb(token));
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
  // ERROR NORMALIZATION
  // ---------------------------------------------------------------------------
  private createError(
    message: string,
    status?: number,
    details?: any,
    response?: Response
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.statusText = response?.statusText;
    error.details = details;

    // Classify error types
    error.isNetworkError = !status && message.includes("network");
    error.isRenderColdStart =
      error.isNetworkError && this.baseUrl.includes("onrender.com");
    error.isAuthError = status === 401 || status === 403;
    error.isValidationError = status === 400;

    return error;
  }

  private async parseError(response: Response): Promise<ApiError> {
    let message = `HTTP ${response.status}`;
    let details: any;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        message = data.detail || data.error || data.message || message;
        details = data;
      } else {
        message = response.statusText || message;
      }
    } catch {
      message = response.statusText || message;
    }

    return this.createError(message, response.status, details, response);
  }

  // ---------------------------------------------------------------------------
  // NETWORK ERROR DETECTION
  // ---------------------------------------------------------------------------
  private async handleNetworkError(error: any, retryCount = 0): Promise<never> {
    // Detect network failures (CORS, DNS, connection refused, etc.)
    if (
      error instanceof TypeError &&
      (error.message === "Failed to fetch" || error.message.includes("network"))
    ) {
      const isRenderColdStart = this.baseUrl.includes("onrender.com");

      let userMessage = "Unable to connect to server.";
      
      if (isRenderColdStart && retryCount === 0) {
        userMessage =
          "Backend is starting up (Render free tier takes ~30s). Retrying automatically...";
      } else if (isRenderColdStart) {
        userMessage =
          "Backend is still starting up. This can take 30-60 seconds on Render free tier.";
      } else {
        userMessage = "Please check your internet connection.";
      }

      throw this.createError(userMessage, undefined, {
        networkError: true,
        isRenderColdStart,
        originalError: error.message,
        retryCount,
      });
    }

    throw error;
  }

  // ---------------------------------------------------------------------------
  // RETRY LOGIC FOR RENDER COLD STARTS
  // ---------------------------------------------------------------------------
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    const maxRetries = this.baseUrl.includes("onrender.com") ? 3 : 1;
    const retryDelay = [2000, 5000, 10000][retryCount] || 10000;

    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // Network error - retry for Render cold starts
      if (
        retryCount < maxRetries &&
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        console.warn(
          `Network error (attempt ${retryCount + 1}/${maxRetries + 1}). Retrying in ${retryDelay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // CORE REQUEST METHOD
  // ---------------------------------------------------------------------------
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipCache = false
  ): Promise<T> {
    const tokens = this.getTokens();
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    // Request deduplication
    const cacheKey = `${options.method || "GET"}:${url}:${JSON.stringify(options.body || {})}`;
    if (!skipCache && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (tokens?.access) {
      headers["Authorization"] = `Bearer ${tokens.access}`;
    }

    const executeRequest = async (): Promise<T> => {
      try {
        const response = await this.fetchWithRetry(
          url,
          {
            ...options,
            headers,
            credentials: "include",
          },
          0
        );

        // --------------- HANDLE 401 (TOKEN REFRESH) ---------------
        if (response.status === 401 && tokens?.refresh) {
          if (this.isRefreshing) {
            // Wait for ongoing refresh
            return new Promise((resolve, reject) => {
              this.subscribe(async (newToken) => {
                if (!newToken) {
                  reject(this.createError("Session expired", 401));
                  return;
                }

                headers["Authorization"] = `Bearer ${newToken}`;

                try {
                  const retry = await this.fetchWithRetry(
                    url,
                    { ...options, headers, credentials: "include" },
                    0
                  );

                  if (!retry.ok) {
                    reject(await this.parseError(retry));
                  } else {
                    resolve(await this.handleSuccessResponse<T>(retry));
                  }
                } catch (error) {
                  reject(await this.handleNetworkError(error));
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
          const retry = await this.fetchWithRetry(
            url,
            { ...options, headers, credentials: "include" },
            0
          );

          if (!retry.ok) throw await this.parseError(retry);
          return this.handleSuccessResponse<T>(retry);
        }

        // --------------- HANDLE OTHER ERRORS ---------------
        if (!response.ok) {
          throw await this.parseError(response);
        }

        // --------------- SUCCESS ---------------
        return this.handleSuccessResponse<T>(response);
      } catch (error) {
        throw await this.handleNetworkError(error);
      }
    };

    const promise = executeRequest();
    
    if (!skipCache) {
      this.requestCache.set(cacheKey, promise);
      setTimeout(() => this.requestCache.delete(cacheKey), 1000);
    }

    return promise;
  }

  private async handleSuccessResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return {} as T;

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return {} as T;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      true
    );
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      true
    );
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      },
      true
    );
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" }, true);
  }
}

export const apiClient = new ApiClient();