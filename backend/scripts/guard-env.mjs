import { spawnSync } from "node:child_process";
import fs from "node:fs";
import dotenv from "dotenv";

/**
 * Backend harus menolak boot tanpa JWT_SECRET atau FRONTEND_URL, dan tidak boleh
 * lagi memakai nilai cadangan. Dulu `JWT_SECRET` jatuh ke literal "dev-secret",
 * jadi deploy yang lupa set env tetap jalan dengan kunci yang diketahui publik.
 *
 * Dijalankan manual: `npm run guard:env` (setelah `npm run build`).
 * Dipisah dari smoke.cjs karena smoke butuh server yang bisa boot.
 */
dotenv.config();

const fail = [];

for (const name of ["JWT_SECRET", "FRONTEND_URL"]) {
  const r = spawnSync(process.execPath, ["dist/index.js"], {
    env: { ...process.env, [name]: "" },
    encoding: "utf8",
    timeout: 10_000,
  });
  const out = `${r.stderr || ""}${r.stdout || ""}`;
  if (out.includes(`${name} kosong`)) {
    console.log(`PASS  boot ditolak tanpa ${name}`);
  } else {
    console.log(`FAIL  boot tidak ditolak tanpa ${name}`);
    console.log(out.split("\n").slice(0, 3).map((l) => `      ${l}`).join("\n"));
    fail.push(name);
  }
}

// Tidak boleh ada nilai cadangan hardcoded di hasil build.
const bundle = fs.readFileSync("dist/middleware/auth.js", "utf8") + fs.readFileSync("dist/routes/auth.js", "utf8");
if (bundle.includes('"dev-secret"')) {
  console.log('FAIL  masih ada fallback literal "dev-secret" di dist');
  fail.push("dev-secret");
} else {
  console.log('PASS  tidak ada fallback "dev-secret" di hasil build');
}

// FRONTEND_URL kosong tidak boleh jatuh ke localhost default yang longgar.
const app = fs.readFileSync("dist/app.js", "utf8");
if (app.includes("http://localhost:5173")) {
  console.log("FAIL  masih ada default CORS http://localhost:5173");
  fail.push("cors-default");
} else {
  console.log("PASS  tidak ada default CORS di hasil build");
}

if (fail.length) {
  console.error(`❌ GUARD ENV MERAH (${fail.join(", ")})`);
  process.exit(1);
}
console.log("✅ GUARD ENV HIJAU");