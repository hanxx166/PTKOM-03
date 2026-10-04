import type { ContentBundle } from "./types";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = (() => {
    try {
      return localStorage.getItem("token") || "";
    } catch {
      return "";
    }
  })();
  const r = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });
  const j = await r.json().catch(() => {
    throw new Error("Backend belum berjalan");
  });
  if (!r.ok) throw new Error((j as { error?: string }).error || `HTTP ${r.status}`);
  return j as T;
}

/** Ambil konten: coba BE baru -> fallback file statis (gratis/Vercel). */
export async function getContent(): Promise<{ data: ContentBundle; mode: string }> {
  // 1. Backend baru (Express)
  if (API_BASE) {
    try {
      const data = await fetchJson<ContentBundle>(`${API_BASE}/api/content`);
      return { data, mode: "server" };
    } catch {
      /* lanjut fallback */
    }
  }
  // 2. File statis (deploy gratis tanpa BE, atau BE sedang tidur)
  const r = await fetch("data/content.json");
  if (!r.ok) throw new Error("Data gagal dimuat");
  const data = (await r.json()) as ContentBundle;
  return { data, mode: API_BASE ? "server-cache" : "local" };
}

export async function getStats(): Promise<number> {
  try {
    if (API_BASE) {
      const s = await fetchJson<{ total: number }>(`${API_BASE}/api/checks/stats`);
      return s.total;
    }
  } catch {
    /* abaikan */
  }
  return 0;
}

/** Helper request autentikasi ke BE (kirim token bila ada). */
export async function apiPost(path: string, body: unknown): Promise<unknown> {
  if (!API_BASE) throw new Error("Backend belum dikonfigurasi (VITE_API_URL kosong)");
  return fetchJson(`${API_BASE}${path}`, { method: "POST", body: JSON.stringify(body) });
}

export async function apiGet<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error("Backend belum dikonfigurasi (VITE_API_URL kosong)");
  return fetchJson<T>(`${API_BASE}${path}`);
}

export async function apiDelete(path: string): Promise<unknown> {
  if (!API_BASE) throw new Error("Backend belum dikonfigurasi (VITE_API_URL kosong)");
  return fetchJson(`${API_BASE}${path}`, { method: "DELETE" });
}

export async function apiPut(path: string, body: unknown): Promise<unknown> {
  if (!API_BASE) throw new Error("Backend belum dikonfigurasi (VITE_API_URL kosong)");
  return fetchJson(`${API_BASE}${path}`, { method: "PUT", body: JSON.stringify(body) });
}
