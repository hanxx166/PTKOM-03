import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, "seed-data.json"), "utf-8");
  const c = JSON.parse(raw);

  await prisma.article.deleteMany();
  for (const a of c.articles) {
    await prisma.article.create({
      data: { title: a.title, tag: a.tag, body: JSON.stringify(a.body), mins: a.mins ?? 1, date: a.date ?? "" },
    });
  }
  await prisma.symptom.deleteMany();
  for (const s of c.symptoms) {
    await prisma.symptom.create({ data: { id: String(s.id), label: s.label, weight: s.w, isDanger: !!s.danger } });
  }
  await prisma.task.deleteMany();
  for (const [i, t] of c.tasks.entries()) {
    await prisma.task.create({ data: { text: t.text, sortOrder: i } });
  }
  await prisma.quizItem.deleteMany();
  for (const q of c.quiz) {
    await prisma.quizItem.create({ data: { statement: q.s, isFact: !!q.a, explanation: q.e } });
  }
  await prisma.fact.deleteMany();
  for (const f of c.facts) {
    await prisma.fact.create({ data: { big: f.big, text: f.text } });
  }
  await prisma.siteSetting.upsert({
    where: { key: "contact.maps" },
    update: { value: JSON.stringify(c.contact?.maps || "Poliklinik ITERA, Lampung Selatan") },
    create: { key: "contact.maps", value: JSON.stringify(c.contact?.maps || "Poliklinik ITERA, Lampung Selatan") },
  });
  console.log("✅ Seed selesai dari backend/prisma/seed-data.json");
}

main().finally(() => prisma.$disconnect());
