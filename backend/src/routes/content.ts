import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth, type Authed } from "../middleware/auth";

const router = Router();
let cache: { at: number; data: unknown } | null = null;

const asList = (v: string) => {
  try {
    return JSON.parse(v) as string[];
  } catch {
    return [];
  }
};

export async function bundle() {
  const [articles, symptoms, tasks, quiz, facts, contact, total] = await Promise.all([
    prisma.article.findMany({ orderBy: { id: "asc" } }),
    prisma.symptom.findMany(),
    prisma.task.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.quizItem.findMany({ orderBy: { id: "asc" } }),
    prisma.fact.findMany({ orderBy: { id: "asc" } }),
    prisma.siteSetting.findUnique({ where: { key: "contact.maps" } }),
    prisma.symptomCheck.count(),
  ]);
  return {
    articles: articles.map((a) => ({ ...a, body: asList(a.body) })),
    symptoms: symptoms.map((s) => ({ id: s.id, label: s.label, w: s.weight, danger: s.isDanger })),
    tasks: tasks.map((t) => ({ id: t.id, text: t.text })),
    quiz: quiz.map((q) => ({ s: q.statement, a: q.isFact, e: q.explanation })),
    facts: facts.map((f) => ({ id: f.id, big: f.big, text: f.text })),
    contact: { maps: contact ? JSON.parse(contact.value) as string : "Poliklinik ITERA, Lampung Selatan" },
    totalChecks: total,
  };
}

router.get("/content", async (_req, res) => {
  if (cache && Date.now() - cache.at < 60000) {
    res.json(cache.data);
    return;
  }
  const data = await bundle();
  cache = { at: Date.now(), data };
  res.json(data);
});

export function bust() {
  cache = null;
}

// --- Articles ---
router.get("/articles", async (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const tag = String(req.query.tag || "");
  const all = await prisma.article.findMany({ orderBy: { id: "asc" } });
  const list = all
    .map((a) => ({ ...a, body: asList(a.body) }))
    .filter((a) => (!tag || a.tag === tag) && (a.title + " " + (a.body as string[]).join(" ")).toLowerCase().includes(q));
  res.json(list);
});

const articleSchema = z.object({
  title: z.string().min(1).max(200),
  tag: z.string().min(1).max(20),
  body: z.array(z.string().min(1)).min(1),
});

const minsOf = (body: string[]) => Math.max(1, Math.ceil(body.join(" ").split(/\s+/).length / 180));

router.post("/articles", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = articleSchema.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  const a = await prisma.article.create({
    data: { title: s.data.title, tag: s.data.tag, body: JSON.stringify(s.data.body), mins: minsOf(s.data.body), date: new Date().toISOString().slice(0, 10) },
  });
  bust();
  res.status(201).json({ ...a, body: s.data.body });
});

router.put("/articles/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = articleSchema.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  try {
    const a = await prisma.article.update({
      where: { id: Number(req.params.id) },
      data: { title: s.data.title, tag: s.data.tag, body: JSON.stringify(s.data.body), mins: minsOf(s.data.body) },
    });
    bust();
    res.json({ ...a, body: s.data.body });
  } catch {
    res.status(404).json({ error: "Artikel tidak ditemukan" });
  }
});

router.delete("/articles/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: Number(req.params.id) } });
    bust();
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Artikel tidak ditemukan" });
  }
});

// --- Symptoms / Tasks / Quiz / Facts: baca publik, tulis admin ---
router.get("/symptoms", async (_req, res) => {
  const all = await prisma.symptom.findMany();
  res.json(all.map((s) => ({ id: s.id, label: s.label, w: s.weight, danger: s.isDanger })));
});

const symptomSchema = z.object({ label: z.string().min(1).max(200), w: z.number().int().min(1).max(3), danger: z.boolean().default(false) });

router.post("/symptoms", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = symptomSchema.safeParse({ ...req.body, w: Number(req.body?.w) });
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  const id = "s" + Date.now();
  const r = await prisma.symptom.create({ data: { id, label: s.data.label, weight: s.data.w, isDanger: s.data.danger } });
  bust();
  res.status(201).json({ id: r.id, label: r.label, w: r.weight, danger: r.isDanger });
});

router.put("/symptoms/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = symptomSchema.safeParse({ ...req.body, w: Number(req.body?.w) });
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  try {
    const r = await prisma.symptom.update({ where: { id: req.params.id }, data: { label: s.data.label, weight: s.data.w, isDanger: s.data.danger } });
    bust();
    res.json({ id: r.id, label: r.label, w: r.weight, danger: r.isDanger });
  } catch {
    res.status(404).json({ error: "Gejala tidak ditemukan" });
  }
});

router.delete("/symptoms/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  try {
    await prisma.symptom.delete({ where: { id: req.params.id } });
    bust();
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Gejala tidak ditemukan" });
  }
});

const textSchema = z.object({ text: z.string().min(1).max(200) });

router.post("/tasks", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = textSchema.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  const n = await prisma.task.count();
  const t = await prisma.task.create({ data: { text: s.data.text, sortOrder: n } });
  bust();
  res.status(201).json({ id: t.id, text: t.text });
});

router.put("/tasks/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = textSchema.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  try {
    const t = await prisma.task.update({ where: { id: Number(req.params.id) }, data: { text: s.data.text } });
    bust();
    res.json({ id: t.id, text: t.text });
  } catch {
    res.status(404).json({ error: "Langkah tidak ditemukan" });
  }
});

router.delete("/tasks/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: Number(req.params.id) } });
    bust();
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Langkah tidak ditemukan" });
  }
});

const quizSchema = z.object({ s: z.string().min(1), a: z.boolean(), e: z.string().min(1) });

router.post("/quiz", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = quizSchema.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  const q = await prisma.quizItem.create({ data: { statement: s.data.s, isFact: s.data.a, explanation: s.data.e } });
  bust();
  res.status(201).json({ id: q.id, s: q.statement, a: q.isFact, e: q.explanation });
});

router.delete("/quiz/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  try {
    await prisma.quizItem.delete({ where: { id: Number(req.params.id) } });
    bust();
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Pernyataan tidak ditemukan" });
  }
});

const factSchema = z.object({ big: z.string().min(1).max(40), text: z.string().min(1).max(200) });

router.post("/facts", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = factSchema.safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  const f = await prisma.fact.create({ data: s.data });
  bust();
  res.status(201).json(f);
});

router.delete("/facts/:id", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  try {
    await prisma.fact.delete({ where: { id: Number(req.params.id) } });
    bust();
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Informasi tidak ditemukan" });
  }
});

// --- Settings: lokasi peta ---
router.get("/settings/contact", async (_req, res) => {
  const c = await prisma.siteSetting.findUnique({ where: { key: "contact.maps" } });
  res.json({ maps: c ? (JSON.parse(c.value) as string) : "Poliklinik ITERA, Lampung Selatan" });
});

router.put("/settings/contact", requireAuth, (req: Authed, res, next) => requireAdmin(req, res, next), async (req, res) => {
  const s = z.object({ maps: z.string().min(1).max(200) }).safeParse(req.body);
  if (!s.success) {
    res.status(400).json({ error: "Data tidak valid" });
    return;
  }
  await prisma.siteSetting.upsert({
    where: { key: "contact.maps" },
    update: { value: JSON.stringify(s.data.maps) },
    create: { key: "contact.maps", value: JSON.stringify(s.data.maps) },
  });
  bust();
  res.json({ ok: true, maps: s.data.maps });
});

router.get("/tasks", async (_req, res) => {
  res.json((await prisma.task.findMany({ orderBy: { sortOrder: "asc" } })).map((t) => ({ id: t.id, text: t.text })));
});

router.get("/quiz", async (_req, res) => {
  res.json((await prisma.quizItem.findMany({ orderBy: { id: "asc" } })).map((q) => ({ s: q.statement, a: q.isFact, e: q.explanation })));
});

router.get("/facts", async (_req, res) => {
  res.json(await prisma.fact.findMany({ orderBy: { id: "asc" } }));
});

export default router;
