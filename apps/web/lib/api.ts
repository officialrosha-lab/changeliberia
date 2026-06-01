export function getApiBase(): string {
  // For Vercel production environment, use hardcoded API URL
  // This is needed because NEXT_PUBLIC_API_URL may not be available during SSR
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && typeof window === 'undefined') {
    // Server-side rendering in production - use hardcoded URL
    return 'https://api-production-8873.up.railway.app/api/v1';
  }
  
  // Use NEXT_PUBLIC_API_URL if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback for development
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

export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
  token: string,
): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json() as Promise<T>;
}
