/**
 * Centralized application configuration - PRODUCTION ONLY
 * Always uses Render backend URL (no localhost)
 */

const getApiBaseUrl = (): string => {
  // Always use production Render URL
  const productionUrl = 'https://startup-connect-hub.onrender.com/api';
  
  // Check for Vite env variable override (from vercel.json or .env)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Always return production URL (no localhost fallback)
  return productionUrl;
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