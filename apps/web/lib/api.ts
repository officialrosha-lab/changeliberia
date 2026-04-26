export function getApiBase(): string {
  if (
    typeof window === 'undefined' &&
    process.env.API_URL_INTERNAL &&
    process.env.API_URL_INTERNAL.length > 0
  ) {
    return process.env.API_URL_INTERNAL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Request failed');
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
    let message = 'Request failed';
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') message = data.message;
    } catch { /* ignore parse errors */ }
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
  if (!res.ok) throw new Error('Request failed');
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
  if (!res.ok) throw new Error('Request failed');
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
