/**
 * API Client Configuration
 * 
 * Uses NEXT_PUBLIC_API_URL environment variable for production.
 * Falls back to relative URLs for development/localhost.
 */

export function getApiBaseUrl(): string {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Use NEXT_PUBLIC_API_URL if available (production)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Fall back to relative URLs (localhost development)
    return '';
  }
  
  // Server-side (if needed)
  return process.env.NEXT_PUBLIC_API_URL || '';
}

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function fetchApi(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(path);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}
