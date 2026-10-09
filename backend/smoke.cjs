/* Smoke test backend (T-05): jalankan `node smoke.cjs` setelah `npm run build`.
 * Menyalakan dist/index.js, menguji endpoint inti, lalu mematikan server.
 * Exit 0 = hijau, exit 1 = merah. */
const { spawn } = require("child_process");

const BASE = process.env.SMOKE_URL || "http://localhost:3000";
const results = [];
const ok = (name, cond) => {
  results.push([cond ? "PASS" : "FAIL", name]);
  if (!cond) process.exitCode = 1;
};

async function main() {
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
    ok("content lengkap", c.articles?.length >= 4 && c.symptoms?.length >= 1 && c.tasks?.length >= 1);
    const em = `smoke${Date.now()}@x.co`;
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
  } finally {
    srv.kill();
  }
  console.table(results);
  if (process.exitCode) console.error("❌ SMOKE MERAH");
  else console.log("✅ SMOKE HIJAU");
}

main().catch((e) => { console.error(e); process.exit(1); });
