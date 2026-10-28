import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import auth from "./routes/auth";
import checks from "./routes/checks";
import content from "./routes/content";
import user from "./routes/user";
import { prisma } from "./lib/prisma";
import { FRONTEND_ORIGINS, TRUST_PROXY } from "./lib/env";

export function app() {
  const a = express();
// Render jadi proxy; tanpa ini Express salah baca X-Forwarded-Proto dan
  // flag `secure` pada cookie tidak aktif walaupun HTTPS sudah di-terminate di sana.
  a.set("trust proxy", TRUST_PROXY);
  a.use(helmet());
  a.use(cors({ origin: FRONTEND_ORIGINS, credentials: true }));
  a.use(express.json({ limit: "256kb" }));
  a.use(morgan("tiny"));
  a.use((req, _res, next) => {
    // cookie minimal tanpa dep cookie-parser
    const h = req.headers.cookie || "";
    (req as unknown as { cookies: Record<string, string> }).cookies = Object.fromEntries(
      h.split(";").map((p) => p.trim().split("=").map(decodeURIComponent) as [string, string]).filter((p) => p[0])
    );
    next();
  });

  a.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: "up" });
    } catch {
      res.status(500).json({ ok: false, db: "down" });
    }
  });

  // Batas rate limit auth dipasang per rute di dalam routes/auth.ts, supaya
  // signup/login dan refresh tidak berbagi satu kuota yang sama.
  a.use("/api/auth", auth);
  a.use("/api", content);
  a.use("/api", checks);
  a.use("/api", user);

  a.use((_req, res) => res.status(404).json({ error: "Tidak ditemukan" }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  a.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Server: " + err.message });
  });
  return a;
}
