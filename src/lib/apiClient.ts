/**
 * Centralized API client with automatic token refresh
 * Handles authentication, retries, and error normalization
 */

import { config } from './config';

interface AuthTokens {
  access: string;
  refresh: string;
}

interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  /**
   * Get stored auth tokens from localStorage
   */
  private getTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem('auth_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save auth tokens to localStorage
   */
  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  /**
   * Clear auth tokens from localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem('auth_tokens');
  }

  /**
   * Subscribe to token refresh completion
   */
  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers of new token
   */
  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    const tokens = this.getTokens();
    if (!tokens?.refresh) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      const newTokens = { access: data.access, refresh: tokens.refresh };
      this.setTokens(newTokens);
      return data.access;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Make authenticated request with automatic retry on 401
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const tokens = this.getTokens();

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (tokens?.access) {
      headers['Authorization'] = `Bearer ${tokens.access}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - Token expired
      if (response.status === 401 && tokens?.access) {
        // If already refreshing, wait for it
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.subscribeTokenRefresh(async (newToken) => {
              try {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(url, {
                  ...options,
                  headers,
                });
                if (!retryResponse.ok) {
                  reject(await this.handleErrorResponse(retryResponse));
                } else {
                  resolve(await retryResponse.json());
                }
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        // Start refresh process
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (newToken) {
          // Notify subscribers
          this.onTokenRefreshed(newToken);

          // Retry original request
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });

          if (!retryResponse.ok) {
            throw await this.handleErrorResponse(retryResponse);
          }

          return await retryResponse.json();
        } else {
          // Refresh failed, force logout
          window.location.href = '/auth';
          throw new Error('Session expired. Please log in again.');
        }
      }

      // Handle other errors
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      // Parse and return response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      // Return empty object for non-JSON responses
      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  /**
   * Handle error response and create normalized error
   */
  private async handleErrorResponse(response: Response): Promise<ApiError> {
    let message = 'Request failed';
    let details: unknown = null;

    try {
      const data = await response.json();
      if (data.error) {
        message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      } else if (data.detail) {
        message = data.detail;
      } else if (data.message) {
        message = data.message;
      } else {
        details = data;
      }
    } catch {
      message = response.statusText || `HTTP ${response.status}`;
    }

    return {
      message,
      status: response.status,
      details,
    };
  }

  /**
   * Convenience methods
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();