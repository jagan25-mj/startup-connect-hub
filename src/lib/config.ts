/**
 * Centralized application configuration
 * Reads from environment variables with fallbacks
 */

const getApiBaseUrl = (): string => {
  // Check for Vite env variable first
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback to localhost for development
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }
  
  // Production fallback (should be set via env)
  console.warn('VITE_API_BASE_URL not set, using relative path');
  return '/api';
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

// Validate configuration on load
if (!config.apiBaseUrl) {
  throw new Error('API Base URL is not configured');
}

console.log('🚀 App configured:', {
  apiBaseUrl: config.apiBaseUrl,
  environment: config.isDevelopment ? 'development' : 'production',
});