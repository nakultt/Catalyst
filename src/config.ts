/**
 * Application configuration
 * Uses environment variables for production API URL
 */

// In production (Vercel), use the Render backend URL
// In development, use relative path (handled by Vite proxy)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Build full API endpoint URL
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
