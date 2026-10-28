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

const FEVER_TIMES = ["Pagi", "Siang", "Sore", "Malam"] as const;

const feverLog = z.object({
  day: z.coerce.number().int().min(1).max(14),
  time: z.enum(FEVER_TIMES),
  temp: z.coerce.number().min(34).max(43),
});

// Catatan suhu per-user, beberapa kali sehari.
router.get("/fever-log", async (req: Authed, res) => {
  const rows = await prisma.feverLog.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ day: "asc" }, { id: "asc" }],
    take: 100,
  });
  res.json({ entries: rows.map((r) => ({ id: r.id, day: r.day, time: r.time, temp: r.temp })) });
});

router.post("/fever-log", async (req: Authed, res) => {
  const s = feverLog.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid (hari 1-14, waktu Pagi/Siang/Sore/Malam, suhu 34-43)" });
    return;
  }
  const r = await prisma.feverLog.upsert({
    where: { userId_day_time: { userId: req.user!.id, day: s.data.day, time: s.data.time } },
    update: { temp: s.data.temp },
    create: { userId: req.user!.id, ...s.data },
  });
  res.json({ ok: true, entry: { id: r.id, day: r.day, time: r.time, temp: r.temp } });
});

router.delete("/fever-log/:id", async (req: Authed, res) => {
  const id = Number(req.params.id);
  const row = await prisma.feverLog.findUnique({ where: { id } });
  if (!row || row.userId !== req.user!.id) {
    res.status(404).json({ error: "Catatan tidak ditemukan" });
    return;
  }
  await prisma.feverLog.delete({ where: { id } });
  res.json({ ok: true });
});

const plateletLog = z.object({
  day: z.coerce.number().int().min(1).max(14),
  value: z.coerce.number().int().min(0).max(500_000),
});

// Log trombosit per-user, satu nilai lab per hari.
router.get("/platelets", async (req: Authed, res) => {
  const rows = await prisma.plateletLog.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ day: "asc" }, { id: "asc" }],
    take: 100,
  });
  res.json({ entries: rows.map((r) => ({ id: r.id, day: r.day, value: r.value })) });
});

router.post("/platelets", async (req: Authed, res) => {
  const s = plateletLog.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid (hari 1-14, trombosit 0-500.000)" });
    return;
  }
  const r = await prisma.plateletLog.upsert({
    where: { userId_day: { userId: req.user!.id, day: s.data.day } },
    update: { value: s.data.value },
    create: { userId: req.user!.id, ...s.data },
  });
  res.json({ ok: true, entry: { id: r.id, day: r.day, value: r.value } });
});

router.delete("/platelets/:id", async (req: Authed, res) => {
  const id = Number(req.params.id);
  const row = await prisma.plateletLog.findUnique({ where: { id } });
  if (!row || row.userId !== req.user!.id) {
    res.status(404).json({ error: "Catatan tidak ditemukan" });
    return;
  }
  await prisma.plateletLog.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
