import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import auth from "./routes/auth";
import checks from "./routes/checks";
import content from "./routes/content";
import user from "./routes/user";
import { prisma } from "./lib/prisma";

dotenv.config();

export function app() {
  const a = express();
  a.use(helmet());
  a.use(cors({ origin: (process.env.FRONTEND_URL || "http://localhost:5173").split(","), credentials: true }));
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

  const authLimiter = rateLimit({ windowMs: 60000, max: 30 });
  a.use("/api/auth", authLimiter, auth);
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
