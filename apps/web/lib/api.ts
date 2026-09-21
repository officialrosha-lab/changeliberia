export function getApiBase(): string {
  // Server-side (SSR/RSC) prefers API_URL_INTERNAL — the API's internal
  // network address, set per-environment (see .env.example). Falls back to
  // the public URL when only that's configured (e.g. same-origin setups).
  if (typeof window === 'undefined' && process.env.API_URL_INTERNAL) {
    return process.env.API_URL_INTERNAL;
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
    headers: { Authorization: `Bearer ${token}` },
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
