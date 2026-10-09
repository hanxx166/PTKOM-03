/**
 * Dev  : pakai proxy Vite (origin sama, jadi tidak ada CORS sama sekali).
 * Build: pakai URL backend absolut, karena hosting frontend statis tidak punya rewrite.
 *
 * Mode standalone (tanpa backend sama sekali) tetap mungkin: HAS_BACKEND
 * bernilai false hanya saat build tanpa VITE_API_URL. Saat itu tidak ada proxy,
 * jadi API_BASE kosong berarti "tidak ada backend", bukan "pakai proxy".
 */
export const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const HAS_BACKEND = import.meta.env.DEV || Boolean(API_BASE);