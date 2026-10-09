import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Admin").slice(0, 60);
  if (!email.includes("@") || password.length < 6) {
    throw new Error("Isi ADMIN_EMAIL dan ADMIN_PASSWORD (minimal 6 karakter) di backend/.env");
  }
const url = process.env.DATABASE_URL || "";
// Host saja untuk URL jaringan supaya password tidak bocor ke log; file: memang tidak punya host.
console.log(`Target: ${url.startsWith("file:") ? url : url ? new URL(url).host : "DATABASE_URL kosong"}`);
  const passwordHash = await bcrypt.hash(password, 12);
  const u = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", passwordHash },
    create: { name, email, passwordHash, role: "admin" },
  });
  console.log(`Admin siap: ${u.email} (id ${u.id})`);
}

main().finally(() => prisma.$disconnect());