import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "../lib/env";

export interface Authed extends Request {
  user?: { id: number; email: string; role: string; name: string };
}

interface Claims {
  id?: number;
  email?: string;
  role?: string;
  name?: string;
  typ?: "access" | "refresh";
}

/**
 * Access token 15 menit, refresh token 7 hari. Keduanya ditandatangani dengan
 * secret yang sama, jadi `typ` wajib supaya satu tidak bisa dipakai di tempat
 * yang lain: refresh token berumur panjang tidak boleh jadi pengganti access
 * token pada endpoint biasa.
 */
export function signAccess(payload: object): string {
  return jwt.sign({ ...payload, typ: "access" }, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefresh(payload: object): string {
  return jwt.sign({ ...payload, typ: "refresh" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAccess(token: string): NonNullable<Authed["user"]> {
  const p = jwt.verify(token, JWT_SECRET) as Claims;
  if (p.typ !== "access" || !p.id || !p.email) throw new Error("token bukan access token");
  return { id: p.id, email: p.email, role: p.role ?? "user", name: p.name ?? "" };
}

export function verifyRefresh(token: string): Claims {
  const p = jwt.verify(token, JWT_SECRET) as Claims;
  if (p.typ !== "refresh") throw new Error("wrong token type");
  return p;
}

/**
 * Hanya menerima access token lewat header Authorization. Refresh cookie
 * sengaja tidak dibaca di sini: frontend menukarnya lewat /api/auth/refresh.
 */
export function requireAuth(req: Authed, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || "").replace(/^Bearer /i, "");
  if (!token) {
    res.status(401).json({ error: "Silakan masuk terlebih dahulu" });
    return;
  }
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    res.status(401).json({ error: "Sesi kedaluwarsa, silakan masuk lagi" });
  }
}

export function requireAdmin(req: Authed, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Hanya admin yang boleh mengubah data" });
    return;
  }
  next();
}