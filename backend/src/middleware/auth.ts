import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

export interface Authed extends Request {
  user?: { id: number; email: string; role: string; name: string };
}

export function signAccess(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "15m" });
}

export function signRefresh(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
}

export function requireAuth(req: Authed, res: Response, next: NextFunction) {
  const bearer = (req.headers.authorization || "").replace(/^Bearer /i, "");
  const cookieToken = (req as unknown as { cookies?: Record<string, string> }).cookies?.refresh;
  const token = bearer || cookieToken || "";
  if (!token) {
    // fallback: token via query untuk dev sederhana
    res.status(401).json({ error: "Silakan masuk terlebih dahulu" });
    return;
  }
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as Authed["user"];
    req.user = p as Authed["user"];
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
