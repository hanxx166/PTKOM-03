/* Smoke test backend (T-05): jalankan `node smoke.cjs` setelah `npm run build`.
 * Menyalakan dist/index.js, menguji endpoint inti, lalu mematikan server.
 * Exit 0 = hijau, exit 1 = merah.
 *
 * Membersihkan semua baris yang ia buat sendiri, karena DATABASE_URL bisa
 * menunjuk database produksi: tanpa pembersihan, tiap menjalankan smoke
 * meninggalkan user, entri journal, dan baris statistik yang permanen. */
const { spawn } = require("child_process");

const BASE = process.env.SMOKE_URL || "http://localhost:3000";
const results = [];
const ok = (name, cond) => {
  results.push([cond ? "PASS" : "FAIL", name]);
  if (!cond) process.exitCode = 1;
};

async function main() {
  // Batas bawah untuk createdAt, supaya baris yang dihapus hanya milik smoke ini.
  const mulai = new Date();
  const emailSmoke = `smoke${Date.now()}@x.co`;
  const srv = spawn(process.execPath, ["dist/index.js"], { cwd: __dirname, stdio: "ignore" });
  // tunggu siap
  let ready = false;
  for (let i = 0; i < 30 && !ready; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      ready = r.ok;
    } catch { /* coba lagi */ }
    if (!ready) await new Promise((r) => setTimeout(r, 500));
  }
  ok("health", ready);
  try {
    const c = await (await fetch(`${BASE}/api/content`)).json();
    ok("content lengkap", c.articles?.length >= 4 && c.symptoms?.length >= 1 && c.tasks?.length >= 1 && c.faq?.length >= 6);
    const em = emailSmoke;
    let r = await fetch(`${BASE}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Smoke", email: em, password: "rahasia123" }) });
    ok("signup 200", r.ok);
    ok("signup role user", (await r.json()).user.role === "user");
    r = await fetch(`${BASE}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Smoke", email: em, password: "rahasia123" }) });
    ok("signup duplikat 409", r.status === 409);
    r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, password: "salah" }) });
    ok("login salah 401", r.status === 401);
    const login = await (await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, password: "rahasia123" }) })).json();
    ok("login token", typeof login.token === "string" && login.token.length > 10);
    const H = { "Content-Type": "application/json", Authorization: "Bearer " + login.token };
    r = await fetch(`${BASE}/api/journal`, { method: "POST", headers: H, body: JSON.stringify({ date: "2026-10-04", temp: 37.2, note: "smoke" }) });
    ok("journal upsert", r.ok);
    r = await fetch(`${BASE}/api/journal`, { headers: H });
    ok("journal milikku", (await r.json()).entries?.length >= 1);
    r = await fetch(`${BASE}/api/checks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level: "rendah", score: 1, symptomIds: [] }) });
    ok("checks anonim", r.ok);
    const st = await (await fetch(`${BASE}/api/checks/stats`)).json();
    ok("stats total>=1", st.total >= 1);
    r = await fetch(`${BASE}/api/articles`, { method: "POST", headers: H, body: JSON.stringify({ title: "x", tag: "Tips", body: ["y"] }) });
    ok("non-admin ditolak 403", r.status === 403);

    // Refresh tanpa cookie dan dengan cookie rusak harus ditolak.
    r = await fetch(`${BASE}/api/auth/refresh`, { method: "POST" });
    ok("refresh tanpa cookie 401", r.status === 401);
    r = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { Cookie: "refresh=rusak" } });
    ok("refresh cookie rusak 401", r.status === 401);

    // Token refresh harus mengembalikan token yang bisa dipakai, dan role-nya user.
    const lg = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, password: "rahasia123" }) });
    const refreshCookie = (lg.headers.getSetCookie ? lg.headers.getSetCookie() : []).map((c) => c.split(";")[0]).join("; ");
    r = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { Cookie: refreshCookie } });
    const rf = await r.json();
    ok("refresh token baru + role user", r.ok && typeof rf.token === "string" && rf.user?.role === "user");
    if (r.ok) {
      const r2 = await fetch(`${BASE}/api/journal`, { headers: { Authorization: "Bearer " + rf.token } });
      ok("token hasil refresh dipakai", r2.ok);
    }

    // Refresh token berumur 7 hari tidak boleh dipakai sebagai pengganti access
    // token pada endpoint biasa; hanya header Authorization yang diterima.
    const rawRefresh = refreshCookie.split("=")[1];
    r = await fetch(`${BASE}/api/journal`, { headers: { Authorization: "Bearer " + rawRefresh } });
    ok("refresh token ditolak di endpoint biasa", r.status === 401);
    r = await fetch(`${BASE}/api/journal`, { headers: { Cookie: refreshCookie } });
    ok("refresh cookie ditolak di endpoint biasa", r.status === 401);

    // Access token juga tidak boleh dipakai menukar refresh.
    r = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { Cookie: "refresh=" + rf.token } });
    ok("access token ditolak di /refresh", r.status === 401);

    // Logout harus benar-benar menghapus cookie, jadi refresh berikutnya gagal.
    r = await fetch(`${BASE}/api/auth/logout`, { method: "POST" });
    const cleared = (r.headers.getSetCookie ? r.headers.getSetCookie() : []).find((c) => c.startsWith("refresh="));
    ok("logout menghapus cookie", !!cleared && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(cleared));
  } finally {
    srv.kill();
    await bersihkan(mulai, emailSmoke);
  }
  console.table(results);
  if (process.exitCode) console.error("❌ SMOKE MERAH");
  else console.log("✅ SMOKE HIJAU");
}

/**
 * Hapus baris yang dibuat smoke ini. FeverEntry tidak dihapus langsung karena
 * sudah ikut cascade dari User. SymptomCheck tidak punya cascade dari User
 * (userId NULL, onDelete SetNull) jadi harus dihapus sendiri, dikunci
 * createdAt supaya baris impor legacy tidak ikut terhapus.
 */
async function bersihkan(mulai, email) {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const checks = await prisma.symptomCheck.deleteMany({ where: { userId: null, createdAt: { gte: mulai } } });
      const users = await prisma.user.deleteMany({ where: { email } });
      console.log(`🧹 smoke: ${users.count} user, ${checks.count} symptom check dihapus`);
    } finally {
      await prisma.$disconnect();
    }
  } catch (e) {
    // Membersihkan sisa tidak boleh menutupi hasil test itu sendiri.
    console.error("⚠️  smoke: gagal membersihkan sisa:", e.message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
