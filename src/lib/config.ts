// src/lib/config.ts

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_URL is not defined. Set it in Vercel environment variables."
  );
}

export const config = Object.freeze({
  API_BASE_URL: API_BASE_URL.replace(/\/$/, ""), // remove trailing slash
});
