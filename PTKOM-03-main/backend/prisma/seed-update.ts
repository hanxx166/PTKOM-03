// Sinkron konten aman: hanya MENAMBAH item yang belum ada (insert-only),
// tidak pernah menghapus atau menimpa konten yang sudah ada di database.
// Jalankan: npm run seed:update
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, "seed-data.json"), "utf-8");
  const c = JSON.parse(raw);
  const created: string[] = [];
  const skipped: string[] = [];

  for (const a of c.articles) {
    const exists = await prisma.article.findFirst({ where: { title: a.title } });
    if (exists) {
      skipped.push(`artikel: ${a.title}`);
      continue;
    }
    await prisma.article.create({
      data: { title: a.title, tag: a.tag, body: JSON.stringify(a.body), mins: a.mins ?? 1, date: a.date ?? "" },
    });
    created.push(`artikel: ${a.title}`);
  }

  for (const s of c.symptoms ?? []) {
    const exists = await prisma.symptom.findUnique({ where: { id: String(s.id) } });
    if (exists) {
      skipped.push(`gejala: ${s.id}`);
      continue;
    }
    await prisma.symptom.create({ data: { id: String(s.id), label: s.label, weight: s.w, isDanger: !!s.danger } });
    created.push(`gejala: ${s.id}`);
  }

  for (const t of c.tasks ?? []) {
    const exists = await prisma.task.findFirst({ where: { text: t.text } });
    if (exists) {
      skipped.push(`tugas: ${t.text}`);
      continue;
    }
    const n = await prisma.task.count();
    await prisma.task.create({ data: { text: t.text, sortOrder: n } });
    created.push(`tugas: ${t.text}`);
  }

  for (const q of c.quiz ?? []) {
    const exists = await prisma.quizItem.findFirst({ where: { statement: q.s } });
    if (exists) {
      skipped.push(`kuis: ${q.s}`);
      continue;
    }
    await prisma.quizItem.create({ data: { statement: q.s, isFact: !!q.a, explanation: q.e } });
    created.push(`kuis: ${q.s}`);
  }

  for (const f of c.facts ?? []) {
    const exists = await prisma.fact.findFirst({ where: { big: f.big, text: f.text } });
    if (exists) {
      skipped.push(`fakta: ${f.big}`);
      continue;
    }
    await prisma.fact.create({ data: { big: f.big, text: f.text } });
    created.push(`fakta: ${f.big}`);
  }

  for (const m of c.faq ?? []) {
    const exists = await prisma.faq.findFirst({ where: { question: m.question } });
    if (exists) {
      skipped.push(`faq: ${m.question}`);
      continue;
    }
    const n = await prisma.faq.count();
    await prisma.faq.create({ data: { question: m.question, answer: m.answer, sortOrder: n } });
    created.push(`faq: ${m.question}`);
  }

  if (c.contact?.maps) {
    const exists = await prisma.siteSetting.findUnique({ where: { key: "contact.maps" } });
    if (!exists) {
      await prisma.siteSetting.create({ data: { key: "contact.maps", value: JSON.stringify(c.contact.maps) } });
      created.push("setting: contact.maps");
    } else {
      skipped.push("setting: contact.maps");
    }
  }

  console.log(`✅ seed-update selesai: ${created.length} ditambahkan, ${skipped.length} sudah ada (dilewati)`);
  for (const item of created) console.log(`  + ${item}`);
}

main().finally(() => prisma.$disconnect());
