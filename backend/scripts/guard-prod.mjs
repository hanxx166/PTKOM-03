import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Menolak deploy kalau konfigurasi masih salah.
 *
 * Produksi memakai PostgreSQL Supabase lewat session pooler. Guard ini menangkap
 * provider yang salah atau `DATABASE_URL` lokal sebelum `prisma migrate deploy`
 * menyentuh database, dan memastikan migrasi RLS ikut terbawa ke repo: tanpa
 * RLS, anon key Supabase bisa membaca dan menulis tabel langsung, melewati
 * seluruh backend.
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

// RLS wajib ada kalau sudah PostgreSQL: tanpa ini anon key Supabase bisa
// membaca dan menulis tabel langsung, melewati seluruh backend.
// Dicek per tabel, bukan sekadar mencari string: cek string bisa lolos meski
// tabel baru belum punya RLS, karena migration lama masih punya statement-nya.
if (provider === "postgresql") {
  const dir = "prisma/migrations";
  const files = fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true, encoding: "utf8" }) : [];
  const sql = files
    .filter((f) => String(f).endsWith(".sql"))
    .map((f) => fs.readFileSync(`${dir}/${f}`, "utf8"))
    .join("\n");

  const tables = [...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map(
    ([, model, body]) => /@@map\("([^"]+)"\)/.exec(body)?.[1] ?? model,
  );
  const unprotected = tables.filter(
    (t) => !new RegExp(`ALTER\\s+TABLE\\s+"${t}"\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, "i").test(sql),
  );

  if (unprotected.length) {
    problems.push(
      `Tabel tanpa RLS di prisma/migrations: ${unprotected.join(", ")}. ` +
        "Tanpa ENABLE ROW LEVEL SECURITY, anon key Supabase bisa membaca dan menulis " +
        "tabel itu langsung ke database, melewati seluruh backend. " +
        "Tambahkan ALTER TABLE \"<tabel>\" ENABLE ROW LEVEL SECURITY di migration yang membuat tabel tersebut.",
    );
  }
}

if (problems.length) {
  console.error("Deploy ditolak:\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log(`Konfigurasi deploy OK: provider=${provider}`);