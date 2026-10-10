/**
 * Dev  : pakai proxy Vite (origin sama, jadi tidak ada CORS sama sekali).
 * Build: pakai URL backend absolut, karena hosting frontend statis tidak punya rewrite.
 *
 * Mode standalone (tanpa backend sama sekali) tetap mungkin: HAS_BACKEND
 * bernilai false hanya saat build tanpa VITE_API_URL. Saat itu tidak ada proxy,
 * jadi API_BASE kosong berarti "tidak ada backend", bukan "pakai proxy".
 */
import type { User } from "./types";

export const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const HAS_BACKEND = import.meta.env.DEV || Boolean(API_BASE);

/**
 * Access token hidup 15 menit, jadi disimpan di memori, bukan localStorage.
 * Session yang bertahan lebih dari 15 menit datang dari refresh cookie httpOnly
 * yang tidak bisa dibaca JavaScript sama sekali.
 */
let accessToken = "";

export const getAccessToken = () => accessToken;
export const setAccessToken = (t: string) => {
  accessToken = t;
};

let refreshing: Promise<User | null> | null = null;

type SessionLost = () => void;
let onSessionLost: SessionLost | null = null;

/** Dipanggil sekali saat refresh gagal supaya UI bisa keluar dari sesi basi. */
export function setSessionLostHandler(fn: SessionLost) {
  onSessionLost = fn;
}

export function forgetAccessToken() {
  accessToken = "";
}

/**
 * Tukar refresh cookie jadi access token baru. Panggilan yang tumpang tindih
 * hanya jadi satu request. Mengembalikan user, atau null kalau cookie sudah
 * tidak berlaku; di kasus terakhir handler sesi-basi dipanggil supaya state
 * frontend ikut dibersihkan, bukan hanya request berikutnya yang gagal.
 */
export function refreshSession(): Promise<User | null> {
  if (!HAS_BACKEND) return Promise.resolve(null);
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          onSessionLost?.();
          return null;
        }
        const j = (await r.json()) as { user?: User; token?: string };
        if (!j.user || !j.token) {
          onSessionLost?.();
          return null;
        }
        setAccessToken(j.token);
        return j.user;
      })
      .catch(() => {
        onSessionLost?.();
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}