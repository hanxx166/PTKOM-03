import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/checks", async (req, res) => {
  const s = z.object({
    level: z.enum(["rendah", "sedang", "tinggi"]),
    score: z.number().int().min(0).max(100).optional().default(0),
    symptomIds: z.array(z.string()).optional().default([]),
  }).safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "level tidak valid" });
    return;
  }
  await prisma.symptomCheck.create({
    data: { level: s.data.level, score: s.data.score, symptomIds: JSON.stringify(s.data.symptomIds) },
  });
  res.json({ ok: true });
});

router.get("/checks/stats", async (_req, res) => {
  const [rendah, sedang, tinggi] = await Promise.all([
    prisma.symptomCheck.count({ where: { level: "rendah" } }),
    prisma.symptomCheck.count({ where: { level: "sedang" } }),
    prisma.symptomCheck.count({ where: { level: "tinggi" } }),
  ]);
  res.json({ total: rendah + sedang + tinggi, rendah, sedang, tinggi });
});

export default router;
