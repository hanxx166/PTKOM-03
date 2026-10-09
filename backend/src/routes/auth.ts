import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, signAccess, signRefresh, type Authed } from "../middleware/auth";

// Normalisasi hash bcrypt PHP ($2y$) agar bisa diverifikasi bcryptjs ($2b$ = algoritma sama)
const portable = (h: string) => h.replace(/^\$2y\$/, "$2b$");

const router = Router();
const email = z.string().trim().toLowerCase().email();

function pub(u: { name: string; email: string; role: string }) {
  return { name: u.name, email: u.email, role: u.role };
}

router.post("/signup", async (req, res) => {
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
  const access = signAccess({ id: u.id, email: u.email, role: u.role, name: u.name });
  const refresh = signRefresh({ id: u.id, email: u.email, role: u.role, name: u.name });
  res.cookie("refresh", refresh, { httpOnly: true, sameSite: "lax", maxAge: 7 * 864e5 });
  res.json({ user: pub(u), token: access });
});

router.post("/login", async (req, res) => {
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
  const access = signAccess({ id: u.id, email: u.email, role: u.role, name: u.name });
  const refresh = signRefresh({ id: u.id, email: u.email, role: u.role, name: u.name });
  res.cookie("refresh", refresh, { httpOnly: true, sameSite: "lax", maxAge: 7 * 864e5 });
  res.json({ user: pub(u), token: access });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("refresh");
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: Authed, res) => {
  res.json({ user: req.user ? pub(req.user as { name: string; email: string; role: string }) : null });
});

// Lupa password: selalu 200 (anti-enumeration). Kode tampil di log server (mode gratis tanpa SMTP).
router.post("/forgot", async (req, res) => {
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

router.post("/reset", async (req, res) => {
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

// Helper dev: verifikasi token lewat Authorization header
router.get("/verify", (req, res) => {
  const t = (req.headers.authorization || "").replace(/^Bearer /i, "");
  try {
    res.json({ user: jwt.verify(t, process.env.JWT_SECRET || "dev-secret") });
  } catch {
    res.status(401).json({ error: "Token tidak valid" });
  }
});

export default router;
