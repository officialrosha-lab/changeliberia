/**
 * Reads the csrf_token cookie (deliberately not httpOnly, so client JS can
 * echo it back) for the double-submit CSRF check the API enforces on every
 * non-GET request. Returns '' when absent — e.g. a Bearer-token session
 * that never received the cookie, which the API's CsrfGuard treats as
 * exempt from the check.
 */
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function csrfHeader(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
}

export function getApiBase(): string {
  // Browser requests always go through this app's own same-origin
  // /api/v1 proxy (apps/web/middleware.ts), which forwards to the Railway
  // API server-side. This is what makes the auth cookies the API sets
  // ordinary same-origin cookies from the browser's point of view —
  // SameSite=Lax, no cross-site cookie restrictions — rather than needing
  // true cross-site (SameSite=None) cookies for a direct Railway call.
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }

  // Server-side (SSR/RSC): call Railway directly. This leg is
  // server-to-server and isn't subject to CORS or the browser's cookie
  // jar, so it skips the proxy entirely.
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return 'https://api-production-8873.up.railway.app/api/v1';
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:4000/api/v1';
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let message = `Request failed (${res.status} ${res.statusText})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') {
        message = `${data.message} (${res.status} ${res.statusText})`;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) message = `${text} (${res.status} ${res.statusText})`;
      } catch {
        // ignore parse errors
      }
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status} ${res.statusText})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') {
        message = `${data.message} (${res.status} ${res.statusText})`;
      } else if (typeof data === 'string' && data.length) {
        message = `${data} (${res.status} ${res.statusText})`;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) message = `${text} (${res.status} ${res.statusText})`;
      } catch {
        // ignore parse errors
      }
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status} ${res.statusText})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') {
        message = `${data.message} (${res.status} ${res.statusText})`;
      } else if (typeof data === 'string' && data.length) {
        message = `${data} (${res.status} ${res.statusText})`;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) message = `${text} (${res.status} ${res.statusText})`;
      } catch {
        // ignore parse errors
      }
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status} ${res.statusText})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') {
        message = `${data.message} (${res.status} ${res.statusText})`;
      } else if (typeof data === 'string' && data.length) {
        message = `${data} (${res.status} ${res.statusText})`;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) message = `${text} (${res.status} ${res.statusText})`;
      } catch {
        // ignore parse errors
      }
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function apiDelete<T = unknown>(
  path: string,
  token?: string,
): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'DELETE',
    headers: {
      ...csrfHeader(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status} ${res.statusText})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') {
        message = `${data.message} (${res.status} ${res.statusText})`;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) message = `${text} (${res.status} ${res.statusText})`;
      } catch {
        // ignore parse errors
      }
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiGetBlob(path: string, token?: string): Promise<Blob> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = `Download failed (${res.status} ${res.statusText})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (typeof data?.message === 'string') message = `${data.message} (${res.status})`;
        } catch {
          message = `${text} (${res.status})`;
        }
      }
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.blob();
}

export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
  token: string,
): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { ...csrfHeader(), Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    let message = `Upload failed (${res.status} ${res.statusText})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (typeof data?.message === 'string') {
            message = `${data.message} (${res.status})`;
          } else if (Array.isArray(data?.message)) {
            message = `${(data.message as string[]).join(', ')} (${res.status})`;
          } else {
            message = `${text} (${res.status})`;
          }
        } catch {
          message = `${text} (${res.status})`;
        }
      }
    } catch { /* ignore body read errors */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
