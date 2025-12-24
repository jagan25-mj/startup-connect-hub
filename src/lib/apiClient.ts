// src/lib/apiClient.ts

import { config } from "./config";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiError {
  status: number | null;
  message: string;
  details?: any;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// ---------------- TOKEN HELPERS ----------------
function getTokens() {
  const raw = localStorage.getItem("auth_tokens");
  return raw ? JSON.parse(raw) : null;
}

function setTokens(tokens: any) {
  localStorage.setItem("auth_tokens", JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem("auth_tokens");
}

// ---------------- REFRESH TOKEN ----------------
async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const tokens = getTokens();
  if (!tokens?.refresh) {
    throw new Error("No refresh token");
  }

  isRefreshing = true;

  refreshPromise = fetch(
    `${config.API_BASE_URL}/auth/token/refresh/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    }
  )
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Token refresh failed");
      }
      const data = await res.json();
      setTokens({ ...tokens, access: data.access });
      return data.access;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

// ---------------- MAIN REQUEST ----------------
async function request<T>(
  method: HttpMethod,
  url: string,
  body?: any
): Promise<T> {
  const tokens = getTokens();

  try {
    const res = await fetch(`${config.API_BASE_URL}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(tokens?.access && {
          Authorization: `Bearer ${tokens.access}`,
        }),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    // ACCESS TOKEN EXPIRED
    if (res.status === 401 && tokens?.refresh) {
      try {
        await refreshAccessToken();
        return request<T>(method, url, body);
      } catch {
        clearTokens();
        window.location.href = "/auth";
        throw {
          status: 401,
          message: "Session expired. Please login again.",
        } as ApiError;
      }
    }

    // BACKEND ERROR
    if (!res.ok) {
      let details = null;
      try {
        details = await res.json();
      } catch {}

      throw {
        status: res.status,
        message: details?.detail || res.statusText,
        details,
      } as ApiError;
    }

    return res.json();
  } catch (error: any) {
    // REAL NETWORK FAILURE (CORS, backend asleep, DNS, HTTPS mismatch)
    if (error instanceof TypeError) {
      throw {
        status: null,
        message: "Unable to reach server",
        details: {
          networkError: true,
          cause: error.message,
        },
      } as ApiError;
    }

    throw error;
  }
}

// ---------------- EXPORT ----------------
export const apiClient = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: any) => request<T>("POST", url, body),
  put: <T>(url: string, body?: any) => request<T>("PUT", url, body),
  delete: <T>(url: string) => request<T>("DELETE", url),
};
