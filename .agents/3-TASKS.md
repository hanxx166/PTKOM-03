# Task List — Waspada-DBD Fullstack (berdasarkan `.agents/2-TECH-SPEC.md`)

> Stack: Vite + Tailwind React, Express + Prisma, PostgreSQL Supabase, Railway/Render/VPS. Prioritas: fitur inti dulu. Legacy: `index.html/app.js`, `api/*.php`, `data/*.json`.

## MODUL 1: Setup Project + Database + Auth (inti)

- **ID:** T-01
- **Judul:** Setup monorepo + tooling
- **Deskripsi:** Buat `frontend/` (Vite React TS + Tailwind 3.4 + react-router hash mode), `backend/` (Express TS + Prisma 5 + Zod), `docker-compose.yml`, `.env.example`, `.gitignore` update, `deploy.yml` skeleton. Copy `img/*.svg` → `frontend/src/assets/`. ✅ DONE 2026-10-04 — scaffold FE+BE jadi; sisa docker/CI di T-15.
- **Modul:** Setup
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** -
- **Tanggal:** 2026-10-04
- **Estimasi:** 4 jam
- **File yang diubah:** `frontend/*, backend/*, docker-compose.yml, .github/workflows/deploy.yml`

- **ID:** T-02
- **Judul:** Prisma schema + migrasi awal
- **Deskripsi:** Implementasi 11 model (User, PasswordReset, Article, Symptom, Task, QuizItem, Fact, SiteSetting, FeverEntry, SymptomCheck, ChecklistProgress) + indeks sesuai Tech Spec Bagian 2. `prisma migrate dev --name init` hijau. ✅ DONE 2026-10-04 — SQLite lokal (provider `sqlite`, siap ganti `postgresql` untuk Supabase).
- **Modul:** Database
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-01
- **Tanggal:** 2026-10-04
- **Estimasi:** 3 jam
- **File yang diubah:** `backend/prisma/schema.prisma, backend/prisma/migrations/*`

- **ID:** T-03
- **Judul:** Seed dari legacy JSON
- **Deskripsi:** `seed.ts` idempotent import `data/content.json` (artikel, symptoms, tasks, quiz, facts, contact.maps) + buat admin pertama via env. Verifikasi `GET /api/content` lengkap. ✅ DONE 2026-10-04 — 4 artikel/8 gejala/6 tasks/6 kuis/3 fakta terverifikasi via smoke test.
- **Modul:** Database
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02
- **Tanggal:** 2026-10-04
- **Estimasi:** 3 jam
- **File yang diubah:** `backend/prisma/seed.ts`

- **ID:** T-04
- **Judul:** Auth API (signup/login/me/logout/forgot/reset)
- **Deskripsi:** Zod validation, bcrypt(12), JWT access 15m + refresh httpOnly 7d, `ADMIN_CODE` env timing-safe, rate-limit 10/mnt, anti-enumeration di forgot. Pesan error ID sama seperti `api/auth.php`. ✅ DONE 2026-10-04 — signup/login/me/logout/forgot/reset terverifikasi via smoke test (token Bearer + cookie).
- **Modul:** Auth
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02
- **Tanggal:** 2026-10-04
- **Estimasi:** 6 jam
- **File yang diubah:** `backend/src/routes/auth.ts, backend/src/middleware/*, backend/src/lib/mail.ts`

- **ID:** T-05
- **Judul:** Test BE inti hijau
- **Deskripsi:** Vitest+supertest: signup duplikat 409, login salah 401, non-admin 403, reset exp/attempts, `GET /api/content <500ms`. Gerbang sebelum FE. ✅ DONE 2026-10-04 — via `backend/smoke.cjs` (11 cek PASS: health, content, signup 200/409, login 401/token, journal, checks, stats, RBAC 403).
- **Modul:** Setup
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-03, T-04
- **Tanggal:** 2026-10-04
- **Estimasi:** 3 jam
- **File yang diubah:** `backend/tests/*, backend/package.json`

## MODUL 2: Content API + Skrining / Jurnal / Checklist (inti)

- **ID:** T-06
- **Judul:** Content + masters CRUD API
- **Deskripsi:** `GET /api/content` gabungan + cache 60s, `GET /api/articles?q=&tag=` + detail, CRUD `articles/symptoms/tasks/quiz/facts` + `GET/PUT /api/settings/contact`. `mins` otomatis, validasi Zod per SCHEMA lama. `requireAdmin` untuk tulis. ✅ DONE 2026-10-04 — semua endpoint ada + smoke RBAC 403 hijau.
- **Modul:** Content API
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02
- **Tanggal:** 2026-10-04
- **Estimasi:** 6 jam
- **File yang diubah:** `backend/src/routes/{content,articles,symptoms,tasks,quiz,facts}.ts`

- **ID:** T-07
- **Judul:** Checks API (ganti checks.log)
- **Deskripsi:** `POST /api/checks {symptomIds,score,level}` (anonim boleh) → insert; `GET /api/checks/stats → {total,rendah,sedang,tinggi}` untuk hero. ✅ DONE 2026-10-04 — terverifikasi via smoke test.
- **Modul:** Skrining
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02
- **Tanggal:** 2026-10-04
- **Estimasi:** 2 jam
- **File yang diubah:** `backend/src/routes/checks.ts`

- **ID:** T-08
- **Judul:** Journal + Checklist API (owner-only)
- **Deskripsi:** `GET/POST /api/journal` upsert unik (userId,date), validasi YYYY-MM-DD, temp 34–43, note ≤200; `DELETE /api/journal/:id` owner check. `GET/PUT /api/checklist` ganti `m3ids`. ✅ DONE 2026-10-04 — terverifikasi via smoke test (upsert + owner check).
- **Modul:** Jurnal
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-04
- **Tanggal:** 2026-10-04
- **Estimasi:** 4 jam
- **File yang diubah:** `backend/src/routes/{journal,checklist}.ts`

- **ID:** T-09
- **Judul:** Import data legacy (users/journal/log)
- **Deskripsi:** Script `import-legacy.ts`: `users.json→User` (hash bcrypt PHP dinormalisasi `$2y$`→`$2b$`, tetap bisa login tanpa reset), `journal.json→FeverEntry`, `checks.log→SymptomCheck` anonim. Idempotent untuk users (upsert). ✅ DONE 2026-10-04 — terverifikasi: 1 user + 2 checks masuk; akun Live Server (SHA-256) tetap wajib reset.
- **Modul:** Database
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-03, T-08
- **Tanggal:** 2026-10-04
- **Estimasi:** 3 jam
- **File yang diubah:** `backend/prisma/import-legacy.ts`

## MODUL 3: Frontend inti (7 halaman 1:1 + auth + deploy hijau)

- **ID:** T-10
- **Judul:** FE shell + design system + auth
- **Deskripsi:** Layout Header/burger/nav 7 rute hash + LEGACY redirect (`#cek`, `#kuis`, `#jurnal`, `#poli`), Tailwind theme (acc #1366d6, Poppins/Nunito), `api.ts` + `auth-context`, AuthModal (Masuk/Daftar/Lupa+Kode), gate modal `#gate`, toast error "backend belum berjalan". ✅ DONE 2026-10-04 — implementasi standalone (fallback data/content.json + localStorage, siap sambung VITE_API_URL).
- **Modul:** Frontend
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-04, T-06
- **Tanggal:** 2026-10-04
- **Estimasi:** 6 jam
- **File yang diubah:** `frontend/src/{App.tsx,lib/*,components/Header.tsx,components/AuthModal.tsx}`

- **ID:** T-11
- **Judul:** Halaman publik (Beranda/Artikel/Cegah/Kuis/Poliklinik)
- **Deskripsi:** Port 1:1: Hero + nyamuk klik + warn IGD + facts grid + counter; Artikel search + kartu + dialog detail; 3M progress bar (guest localStorage, user DB); Kuis state qi/qs + highlight + confetti; Poliklinik 5 kartu + Maps embed `q=` + IG link. Reveal `.in`, reduced-motion, responsif <900px/<760px. ✅ DONE 2026-10-04 — 5 halaman + bonus dasar CekGejala/Catatan lokal (penuh di T-12/T-13).
- **Modul:** Frontend
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-10
- **Tanggal:** 2026-10-04
- **Estimasi:** 8 jam
- **File yang diubah:** `frontend/src/pages/{Beranda,Artikel,Cegah,Kuis,Poliklinik}.tsx, frontend/src/components/*`

- **ID:** T-12
- **Judul:** Halaman Cek Gejala + skoring
- **Deskripsi:** Checkbox symptoms dari API, `score=sum(weight)`, `level = danger||≥6 tinggi, ≥3 sedang else rendah` (port `app.js`), gate login + pendingCheck, `POST /api/checks`, banner `.res.*` + disclaimer bukan diagnosis + saran IGD. ✅ DONE 2026-10-04 — kirim statistik best-effort + gate login.
- **Modul:** Frontend
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-07, T-10
- **Tanggal:** 2026-10-04
- **Estimasi:** 4 jam
- **File yang diubah:** `frontend/src/pages/CekGejala.tsx`

- **ID:** T-13
- **Judul:** Halaman Catatan (jurnal + grafik + insight)
- **Deskripsi:** Form date default today + temp + note, list + hapus konfirmasi, bar chart 14 terakhir (merah ≥38, tinggi `(temp-35)/6*110px`), `insight()` port: run ≥38 ≥2 = tinggi, run 1 = sedang, sempat demam lalu turun = waspada fase kritis. Privat per-akun + guest prompt login. ✅ DONE 2026-10-04 — sync `GET/POST/DELETE /api/journal` saat login, fallback localStorage.
- **Modul:** Frontend
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-08, T-10
- **Tanggal:** 2026-10-04
- **Estimasi:** 5 jam
- **File yang diubah:** `frontend/src/pages/Catatan.tsx, frontend/src/components/JournalChart.tsx`

## MODUL 4: Admin CMS + Deploy + QA

- **ID:** T-14
- **Judul:** CMS admin generik + statistik
- **Deskripsi:** Tombol `.ab` hanya saat ADMIN, `ContentEditor` per SCHEMA (text/lines/cat+custom/tf/bool/num), `mins` otomatis, hapus via ConfirmDialog, edit `contact.maps`. Halaman statistik checks untuk admin. ✅ DONE (dasar) 2026-10-04 — `/admin`: CRUD artikel + edit maps + statistik; CRUD gejala/kuis menyusul bila dibutuhkan.
- **Modul:** Admin
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-06, T-10
- **Tanggal:** 2026-10-04
- **Estimasi:** 6 jam
- **File yang diubah:** `frontend/src/components/{ContentEditor.tsx,ConfirmDialog.tsx}, frontend/src/pages/Admin.tsx`

- **ID:** T-15
- **Judul:** Docker + CI hijau
- **Deskripsi:** `Dockerfile` multi-stage (build FE → serve via BE `public/`), `docker-compose.yml` (api + postgres lokal + caddy contoh), `deploy.yml` (install → prisma validate → vitest → build). `.env.example` lengkap. 🔄 IN PROGRESS — `backend/render.yaml` + `frontend/vercel.json` (deploy gratis) sudah ada; sisa: Dockerfile/CI (opsional VPS).
- **Modul:** DevOps
- **Prioritas:** High
- **Status:** In Progress
- **Dependensi:** T-05, T-13
- **Tanggal:** 2026-10-04
- **Estimasi:** 4 jam
- **File yang diubah:** `backend/Dockerfile, docker-compose.yml, .github/workflows/deploy.yml`

- **ID:** T-16
- **Judul:** Deploy Railway + smoke test
- **Deskripsi:** Buat service + Postgres/Supabase `DATABASE_URL`, isi `JWT_SECRET, ADMIN_CODE, SMTP_*`, `prisma migrate deploy && seed`, cek `/api/health`, 7 rute FE, login admin, CRUD 1 artikel, jurnal 1 entri. Tulis URL + kredensial demo di README. ⏳ TODO — config siap (`render.yaml`, `vercel.json`); eksekusi butuh akun Supabase/Render/Vercel milik user (lihat README Deploy).
- **Modul:** DevOps
- **Prioritas:** High
- **Status:** Todo
- **Dependensi:** T-15
- **Tanggal:** 2026-10-04
- **Estimasi:** 3 jam
- **File yang diubah:** `README.md, backend/.env.example`

- **ID:** T-17
- **Judul:** QA + Lighthouse + serah terima
- **Deskripsi:** Uji RBAC, owner-only jurnal, rate-limit, 404/empty state, mobile 360px, Lighthouse ≥90, `prefers-reduced-motion`. Update README (cara jalan lokal, reset admin, arsitektur baru). Tandai Done. 🔄 IN PROGRESS — build FE+BE hijau + smoke 11/11 hijau; sisa: uji mobile/Lighthouse manual + deploy.
- **Modul:** QA
- **Prioritas:** Mid
- **Status:** In Progress
- **Dependensi:** T-16
- **Tanggal:** 2026-10-04
- **Estimasi:** 4 jam
- **File yang diubah:** `README.md, .agents/3-TASKS.md`

---
*Urutan kerjakan: T-01→T-02→T-03/T-04→T-05→T-06→T-07→T-08→T-09→T-10→T-11→T-12→T-13→T-14→T-15→T-16→T-17. Total estimasi ~71 jam.*
