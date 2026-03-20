const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function post(path: string, body: FormData): Promise<void> {
  const url = new URL(path, API_URL);
  const res = await fetch(url.toString(), { method: "POST", body });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
