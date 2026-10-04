import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, type Authed } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const entry = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  temp: z.number().min(34).max(43),
  note: z.string().max(200).optional().default(""),
});

// GET milikku
router.get("/journal", async (req: Authed, res) => {
  const rows = await prisma.feverEntry.findMany({ where: { userId: req.user!.id }, orderBy: [{ date: "asc" }, { id: "asc" }], take: 200 });
  res.json({ entries: rows.map((r) => ({ id: r.id, date: r.date, temp: r.temp, note: r.note })) });
});

// POST upsert per (userId, date) — 1 entri/hari
router.post("/journal", async (req: Authed, res) => {
  const s = entry.safeParse({ ...req.body, temp: Number(req.body?.temp) });
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid (tanggal YYYY-MM-DD, suhu 34–43)" });
    return;
  }
  const r = await prisma.feverEntry.upsert({
    where: { userId_date: { userId: req.user!.id, date: s.data.date } },
    update: { temp: s.data.temp, note: s.data.note },
    create: { userId: req.user!.id, date: s.data.date, temp: s.data.temp, note: s.data.note },
  });
  res.json({ ok: true, entry: { id: r.id, date: r.date, temp: r.temp, note: r.note } });
});

router.delete("/journal/:id", async (req: Authed, res) => {
  const id = Number(req.params.id);
  const row = await prisma.feverEntry.findUnique({ where: { id } });
  if (!row || row.userId !== req.user!.id) {
    res.status(404).json({ error: "Catatan tidak ditemukan" });
    return;
  }
  await prisma.feverEntry.delete({ where: { id } });
  res.json({ ok: true });
});

// Checklist 3M per-user
router.get("/checklist", async (req: Authed, res) => {
  const rows = await prisma.checklistProgress.findMany({ where: { userId: req.user!.id } });
  res.json({ done: rows.map((r) => String(r.taskId)) });
});

router.put("/checklist", async (req: Authed, res) => {
  const s = z.object({ taskId: z.coerce.number().int(), done: z.boolean() }).safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  if (s.data.done) {
    await prisma.checklistProgress.upsert({
      where: { userId_taskId: { userId: req.user!.id, taskId: s.data.taskId } },
      update: {},
      create: { userId: req.user!.id, taskId: s.data.taskId },
    });
  } else {
    await prisma.checklistProgress.deleteMany({ where: { userId: req.user!.id, taskId: s.data.taskId } });
  }
  res.json({ ok: true });
});

export default router;
