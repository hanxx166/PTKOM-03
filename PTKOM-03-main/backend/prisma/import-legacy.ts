import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LEGACY = path.join(__dirname, "..", "..", "legacy", "data");

async function main() {
  // users.json (PHP password_hash = bcrypt, portable ke bcryptjs -> tanpa reset password)
  const uf = path.join(LEGACY, "users.json");
  if (fs.existsSync(uf)) {
    const users = JSON.parse(fs.readFileSync(uf, "utf-8")) as { name: string; email: string; hash: string; role: string }[];
    for (const u of users) {
      // bcrypt PHP ($2y$) = algoritma sama dengan $2b$; normalisasi agar bcryptjs bisa verifikasi
      const portableHash = u.hash.replace(/^\$2y\$/, "$2b$");
      await prisma.user.upsert({
        where: { email: u.email.toLowerCase() },
        update: {},
        create: { name: u.name.slice(0, 60), email: u.email.toLowerCase(), passwordHash: portableHash, role: u.role === "admin" ? "admin" : "user" },
      });
    }
    console.log(`✅ users: ${users.length} diimpor (hash bcrypt PHP tetap berlaku)`);
  } else {
    console.log("⏭️ users.json tidak ada, dilewati");
  }

  // checks.log (satu level per baris) -> SymptomCheck anonim
  const cf = path.join(LEGACY, "checks.log");
  if (fs.existsSync(cf)) {
    const lines = fs.readFileSync(cf, "utf-8").split("\n").map((s) => s.trim()).filter((s) => ["rendah", "sedang", "tinggi"].includes(s));
    for (const level of lines) {
      await prisma.symptomCheck.create({ data: { level, score: 0, symptomIds: "[]" } });
    }
    console.log(`✅ checks: ${lines.length} baris diimpor`);
  } else {
    console.log("⏭️ checks.log tidak ada, dilewati");
  }

  console.log("Catatan: akun localStorage (Live Server, SHA-256) tidak bisa dimigrasi aman -> minta reset password.");
}

main().finally(() => prisma.$disconnect());
