/**
 * API Configuration
 * 
 * Configure the backend API URL based on environment
 * Supports both build-time (Vite) and runtime (config.js) configuration
 * 
 * Runtime config (for Docker): window.APP_CONFIG.API_URL
 * Build-time config (for Vite): import.meta.env.VITE_API_URL
 */

// Check for runtime config first (set by config.js loaded in index.html)
// Then fall back to build-time Vite env var, then default
export const API_BASE_URL = 
  (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001';

export const API_ENDPOINTS = {
  tournaments: `${API_BASE_URL}/api/tournaments`,
  players: `${API_BASE_URL}/api/players`,
  stats: `${API_BASE_URL}/api/stats`,
  aliases: `${API_BASE_URL}/api/aliases`,
};

/**
 * Fetch wrapper with error handling
 */
export async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

