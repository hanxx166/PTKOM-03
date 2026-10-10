import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { IS_PROD, JWT_SECRET } from "../lib/env";
import { requireAuth, signAccess, signRefresh, verifyAccess, verifyRefresh, type Authed } from "../middleware/auth";

// Normalisasi hash bcrypt PHP ($2y$) agar bisa diverifikasi bcryptjs ($2b$ = algoritma sama)
const portable = (h: string) => h.replace(/^\$2y\$/, "$2b$");

const router = Router();
const email = z.string().trim().toLowerCase().email();

/**
 * Kuota signup/login/forgot/reset. `skipSuccessfulRequests` supaya orang yang
 * berhasil login tidak menghabiskan jatah orang lain yang sedang salah password.
 */
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  skipSuccessfulRequests: true,
});

/**
 * Refresh dipanggil sekali setiap page load, jadi kuota 30/menit ikut shared
 * dengan login membuat semua orang terkunci begitu 30 orang me-refresh. Batasnya
 * dilonggarkan, dan tetap per IP supaya refresh token tebak-tebakan tidak gratis.
 */
const refreshLimiter = rateLimit({ windowMs: 60_000, max: 120 });

function pub(u: { name: string; email: string; role: string }) {
  return { name: u.name, email: u.email, role: u.role };
}

/**
 * Lokal: HTTP same-origin, jadi `lax` cukup.
 * Produksi: frontend Vercel dan backend Render adalah dua situs berbeda, jadi
 * `lax` membuat browser tidak mengirim cookie pada fetch lintas situs dan refresh
 * selalu gagal. `none` + `secure` adalah satu-satunya kombinasi yang benar
 * untuk cookie lintas situs.
 */
const REFRESH_COOKIE = {
  httpOnly: true,
  sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
  secure: IS_PROD,
  maxAge: 7 * 864e5,
  path: "/",
};

function session(u: { id: number; email: string; role: string; name: string }) {
  const claims = { id: u.id, email: u.email, role: u.role, name: u.name };
  return { user: pub(u), token: signAccess(claims), refresh: signRefresh(claims) };
}

router.post("/signup", authLimiter, async (req, res) => {
  const s = z.object({ name: z.string().trim().min(1).max(60), email, password: z.string().min(6) }).safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Lengkapi data dengan benar (password minimal 6 karakter)" });
    return;
  }
  const { name, password } = s.data;
  const em = s.data.email;
  if (await prisma.user.findUnique({ where: { email: em } })) {
    res.status(409).json({ error: "Email sudah terdaftar" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const u = await prisma.user.create({ data: { name: name.slice(0, 60), email: em, passwordHash } });
  const { refresh, ...body } = session(u);
  res.cookie("refresh", refresh, REFRESH_COOKIE);
  res.json(body);
});

router.post("/login", authLimiter, async (req, res) => {
  const s = z.object({ email, password: z.string().min(1) }).safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Email atau password salah" });
    return;
  }
  const u = await prisma.user.findUnique({ where: { email: s.data.email } });
  if (!u || !(await bcrypt.compare(s.data.password, portable(u.passwordHash)))) {
    res.status(401).json({ error: "Email atau password salah" });
    return;
  }
  const { refresh, ...body } = session(u);
  res.cookie("refresh", refresh, REFRESH_COOKIE);
  res.json(body);
});

// Perpanjang access token (15 menit) dari refresh cookie (7 hari).
// Role dibaca ulang dari database: kalau admin diturunkan menjadi user, token
// lama tidak boleh masih memberi akses admin.
router.post("/refresh", refreshLimiter, async (req: Authed, res) => {
  const token = (req as unknown as { cookies?: Record<string, string> }).cookies?.refresh;
  const die = (error: string) => {
    // Opsi harus sama dengan saat cookie dibuat, kalau tidak browser tidak
    // menganggapnya terhapus dan cookie lamanya masih terkirim.
    res.clearCookie("refresh", { ...REFRESH_COOKIE, maxAge: undefined });
    res.status(401).json({ error });
  };
  if (!token) {
    die("Sesi berakhir, silakan masuk lagi");
    return;
  }
  let email: string;
  try {
    email = verifyRefresh(token).email ?? "";
  } catch {
    die("Sesi berakhir, silakan masuk lagi");
    return;
  }
  const u = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!u) {
    die("Akun tidak ditemukan");
    return;
  }
  const { refresh, ...body } = session(u);
  res.cookie("refresh", refresh, REFRESH_COOKIE);
  res.json(body);
});

router.post("/logout", (_req, res) => {
  res.clearCookie("refresh", { ...REFRESH_COOKIE, maxAge: undefined });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: Authed, res) => {
  res.json({ user: req.user ? pub(req.user as { name: string; email: string; role: string }) : null });
});

// Lupa password: selalu 200 (anti-enumeration). Kode tampil di log server (mode gratis tanpa SMTP).
router.post("/forgot", authLimiter, async (req, res) => {
  const s = z.object({ email }).safeParse(req.body);
  if (!s.success) {
    res.json({ ok: true, mailed: false });
    return;
  }
  const u = await prisma.user.findUnique({ where: { email: s.data.email } });
  if (u) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await prisma.passwordReset.create({
      data: { email: s.data.email, codeHash, expiresAt: new Date(Date.now() + 600000) },
    });
    console.log(`[reset] ${s.data.email} kode: ${code} (berlaku 10 menit)`);
  }
  res.json({ ok: true, mailed: false, hint: "Cek terminal backend untuk kode (mode gratis tanpa SMTP)" });
});

router.post("/reset", authLimiter, async (req, res) => {
  const s = z.object({ email, code: z.string().trim().min(6).max(6), password: z.string().min(6) }).safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Password baru minimal 6 karakter" });
    return;
  }
  const rows = await prisma.passwordReset.findMany({ where: { email: s.data.email }, orderBy: { id: "desc" }, take: 5 });
  const valid = rows.find((r) => r.expiresAt.getTime() > Date.now() && r.attempts < 5);
  if (!valid) {
    res.status(400).json({ error: "Kode tidak valid atau sudah kedaluwarsa. Kirim kode baru." });
    return;
  }
  if (!(await bcrypt.compare(s.data.code, valid.codeHash))) {
    await prisma.passwordReset.update({ where: { id: valid.id }, data: { attempts: valid.attempts + 1 } });
    res.status(400).json({ error: "Kode salah" });
    return;
  }
  const u = await prisma.user.findUnique({ where: { email: s.data.email } });
  if (!u) {
    res.status(400).json({ error: "Password baru minimal 6 karakter" });
    return;
  }
  await prisma.user.update({ where: { email: s.data.email }, data: { passwordHash: await bcrypt.hash(s.data.password, 12) } });
  await prisma.passwordReset.deleteMany({ where: { email: s.data.email } });
  res.json({ ok: true });
});

// Helper dev: verifikasi access token lewat Authorization header
router.get("/verify", (req, res) => {
  const t = (req.headers.authorization || "").replace(/^Bearer /i, "");
  try {
    res.json({ user: verifyAccess(t) });
  } catch {
    res.status(401).json({ error: "Token tidak valid" });
  }
});

export default router;
