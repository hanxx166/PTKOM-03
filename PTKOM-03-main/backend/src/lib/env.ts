import dotenv from "dotenv";

dotenv.config();

/**
 * Satu-satunya sumber untuk nilai environment yang sensitif.
 *
 * Semua import yang membaca process.env harus lewat file ini. Dulu `JWT_SECRET`
 * punya fallback literal `"dev-secret"`; kalau env lupa diisi di server, siapa pun
 * yang tahu string itu bisa membuat token admin sendiri. Karena itu di sini tidak
 * ada nilai cadangan: konfigurasi salah harus menghentikan proses, bukan berjalan
 * dengan proteksi lebih lemah dari yang disadari.
 */

const required = (name: string) => {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} kosong. Isi di backend/.env atau di environment server.`);
  return v;
};

export const JWT_SECRET = required("JWT_SECRET");

/** Origin frontend yang boleh memanggil API, dipisah koma. */
export const FRONTEND_ORIGINS = required("FRONTEND_URL")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Produksi = HTTPS, jadi cookie session wajib `secure`. Lokal HTTP tetap jalan. */
export const IS_PROD = process.env.NODE_ENV === "production";

/** Di belakang proxy Render, Express harus percaya X-Forwarded-Proto agar `secure` benar. */
export const TRUST_PROXY = IS_PROD ? 1 : false;