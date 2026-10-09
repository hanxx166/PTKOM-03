import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Menolak deploy kalau konfigurasi masih lokal.
 *
 * Lokal memakai SQLite; produksi memakai PostgreSQL. Tanpa guard ini,
 * `prisma migrate deploy` di Render akan memakai migrasi SQLite dan gagal
 * atau, lebih buruk, menyentuh database yang salah.
 */
const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
// Kunci ke blok datasource: "provider" milik generator muncul lebih dulu di file.
const datasource = /datasource\s+db\s*\{([\s\S]*?)\}/.exec(schema)?.[1] ?? "";
const provider = /provider\s*=\s*"(\w+)"/.exec(datasource)?.[1] ?? "?";
const url = process.env.DATABASE_URL ?? "";

const problems = [];
if (!url) problems.push("DATABASE_URL kosong.");
else if (url.startsWith("file:")) problems.push(`DATABASE_URL masih lokal (${url}). Produksi butuh URL PostgreSQL.`);
if (provider !== "postgresql") problems.push(`provider di prisma/schema.prisma masih "${provider}". Produksi butuh "postgresql".`);

if (problems.length) {
  console.error("Deploy ditolak:\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log(`Konfigurasi deploy OK: provider=${provider}`);