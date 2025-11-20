/**
 * API Configuration
 * 
 * Configure the backend API URL based on environment
 */

// Use environment variable if available, otherwise default to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

