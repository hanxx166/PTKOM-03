# Tech Spec — Waspada-DBD Fullstack (Poliklinik ITERA)

> Acuan: `.agents/1-PRD.md`. Stack: Vite + Tailwind React (FE), Express + Prisma (BE), PostgreSQL Supabase (DB), Railway/Render/VPS (hosting).
> Legacy yang diganti: `index.html/app.js` vanilla, `api/*.php` + `data/*.json` + `localStorage`.

## BAGIAN 1: Tech Stack & Arsitektur

### Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite | Vite 5 / React 18 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4 |
| State/Data | React Context + SWR (fetch) | - |
| Routing | react-router-dom (hash mode dulu) | 6.x |
| Backend | Node.js + Express | Node 20 / Express 4 |
| Database | PostgreSQL via Supabase | 15 |
| ORM | Prisma | 5.x |
| Auth | JWT (access 15m + refresh httpOnly 7d) + bcryptjs | - |
| Validation | Zod | 3.x |
| Hosting | Railway (utama) / Render / VPS Docker+Caddy | - |
| Caching | In-memory 60s untuk `GET /api/content` (tanpa Redis di V1) | - |

### Arsitektur Sistem
```
Browser (Vite SPA)
  → /api/* (Express REST, JWT)
  → Prisma → Supabase Postgres
  → SMTP/Resend (kode reset)
```
Backend serve frontend static hasil `vite build` dalam 1 service (mode Railway simplest), atau split 2 services (web + api) untuk VPS.

### Struktur Folder
```
waspada-dbd/
 frontend/
  src/
   pages/{Beranda,Artikel,CekGejala,Cegah,Kuis,Catatan,Poliklinik}.tsx
   components/{Header,Hero,WarnCard,FactsGrid,ArticleCard,SymptomForm,Checklist3M,QuizBox,JournalChart,JournalForm,MapsBox,AuthModal,ContentEditor,ConfirmDialog,Confetti}.tsx
   lib/{api.ts,auth-context.tsx,hooks.ts}
   assets/{hero.svg,mosquito.svg,pattern.svg} (copy dari img/)
   App.tsx main.tsx index.css (tailwind + font Poppins/Nunito)
 backend/
  src/{index.ts,app.ts,routes/{auth,content,articles,symptoms,tasks,quiz,facts,journal,checks,health}.ts,middleware/{auth.ts,admin.ts,rateLimit.ts},lib/{prisma.ts,mail.ts}}
  prisma/{schema.prisma,seed.ts,migrations/}
  Dockerfile
 docker-compose.yml (api+db lokal)
 .github/workflows/deploy.yml
 .agents/{1-PRD.md,2-TECH-SPEC.md}
```

### Justifikasi
- **Vite+React+Tailwind:** Rebuild 1:1 dari vanilla tanpa ubah UX, tapi komponenisasi + build cepat + gampang cari maintainer JS.
- **Express+Prisma:** Migrasi paling lurus dari `api/*.php` prosedural (1 file = 1 route), Prisma schema jadi dokumentasi DB hidup + migrate aman.
- **Supabase Postgres:** Gratis, backup harian, pooling, SMTP bawaan bisa dipakai untuk kode reset; gampang pindah ke Railway Postgres/VPS nanti (cukup ganti `DATABASE_URL`).
- **Railway/Render:** Auto-deploy dari GitHub + env dashboard (untuk `ADMIN_CODE`), tanpa urus cPanel FTP seperti PHP lama.

## BAGIAN 2: Database Design

### Ringkasan Database
| Item | Detail |
|------|--------|
| Database | PostgreSQL 15 (Supabase) |
| ORM/Driver | Prisma 5.x |
| Pendekatan | Relational |
| Tools Migrasi | Prisma Migrate (`prisma/migrations/`) + `seed.ts` idempotent |

### Entity Overview
| Entity | Key Fields | Relasi |
|--------|-----------|--------|
| User | id, name(60), email unique citext, passwordHash, role USER\|ADMIN, createdAt | → FeverEntry (1:N), → SymptomCheck (1:N), → ChecklistProgress (1:N), → PasswordReset (1:N) |
| PasswordReset | id, email, codeHash, expiresAt (10mnt), attempts (max 5), createdAt | ← User.email (logical) |
| Article | id, title, tag, body Json (String[]), mins, date Date, authorId? | → User (N:1, nullable) |
| Symptom | id String, label, weight 1-3, isDanger bool | — (master, direfer SymptomCheck.symptomIds JSON) |
| Task | id, text, sortOrder | — (master 3M) |
| QuizItem | id, statement, isFact bool, explanation | — (master) |
| Fact | id, big, text | — (master) |
| SiteSetting | key PK (mis. `contact.maps`), value Json | — (ganti `C.contact`) |
| FeverEntry | id, userId, date Date, temp Float, note(200) | ← User, @@unique([userId, date]) |
| SymptomCheck | id, userId nullable, level, score Int, symptomIds Json, createdAt | ← User (nullable untuk hitung hero anonim) |
| ChecklistProgress | userId, taskId, doneAt | ← User, ← Task, @@id([userId, taskId]) |

### Index Strategy
- `User.email` — unique + lower() lookup saat login/signup
- `Article(tag)`, `Article(date desc)` — filter kategori + urut terbaru
- `FeverEntry(userId, date)` — grafik 14 hari + upsert cepat
- `SymptomCheck(createdAt)`, `SymptomCheck(level)` — statistik hero/counter
- `ChecklistProgress(userId)` — progress `%` per user

### Data Flow
```
Seed (data/content.json) → Article/Symptom/Task/QuizItem/Fact/SiteSetting
User signup → User (+ PasswordReset saat forgot)
User cek gejala → SymptomCheck (symptomIds → join logis ke Symptom)
User toggle 3M → ChecklistProgress (ganti localStorage m3ids)
User catat suhu → FeverEntry (1/hari, insight baca run ≥38°C)
Admin edit konten → UPDATE master langsung (ganti api/save.php)
GET /api/content → gabung 6 master + totalChecks + cache 60s
```

## BAGIAN 3: Interface Design

SPA + Backend API (REST JSON). Base URL: `/api`. Auth: `Authorization: Bearer <accessJwt>` + refresh via httpOnly cookie. Error: `{error: "pesan bahasa Indonesia"}`.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/health` | Liveness + cek DB | No |
| POST | `/api/auth/signup` | Daftar (name,email,password,admin_code?) | No (rate-limit) |
| POST | `/api/auth/login` | Masuk | No (rate-limit) |
| POST | `/api/auth/logout` | Hapus refresh cookie | Yes |
| GET | `/api/auth/me` | Profil sesi | Yes |
| POST | `/api/auth/forgot` | Kirim kode 6 digit | No (rate-limit) |
| POST | `/api/auth/reset` | Tukar kode → password baru | No (rate-limit) |
| GET | `/api/content` | Gabungan masters + stats (cache 60s) | No |
| GET | `/api/articles?q=&tag=` | List + search | No |
| GET | `/api/articles/:id` | Detail paragraf | No |
| POST | `/api/articles` | Tambah (mins otomatis) | Admin |
| PUT | `/api/articles/:id` | Edit | Admin |
| DELETE | `/api/articles/:id` | Hapus | Admin |
| GET | `/api/symptoms` | List gejala + bobot | No |
| POST/PUT/DELETE | `/api/symptoms[/:id]` | CRUD gejala | Admin |
| GET | `/api/tasks` | List 3M | No |
| POST/PUT/DELETE | `/api/tasks[/:id]` | CRUD 3M (+reorder) | Admin |
| GET | `/api/quiz` | List pernyataan | No |
| POST/PUT/DELETE | `/api/quiz[/:id]` | CRUD kuis | Admin |
| GET | `/api/facts` | List fakta | No |
| POST/PUT/DELETE | `/api/facts[/:id]` | CRUD fakta | Admin |
| GET/PUT | `/api/settings/contact` | Baca/ubah `contact.maps` | GET:No, PUT:Admin |
| POST | `/api/checks` | Simpan hasil `{symptomIds,score,level}` | Optional |
| GET | `/api/checks/stats` | `{total,rendah,sedang,tinggi}` | No |
| GET | `/api/journal` | List entri milikku | Yes |
| POST | `/api/journal` | Upsert `{date,temp,note}` | Yes |
| DELETE | `/api/journal/:id` | Hapus milikku | Yes |
| GET/PUT | `/api/checklist` | Baca/toggle progres 3M-ku | Yes |

## BAGIAN 4: Alur Logika & Business Rules

Arsitektur: User → Frontend (React) → API (Express) → Prisma → Postgres.

**Alur Auth (signup/login/reset):**
1. FE kirim `POST /api/auth/signup {name,email,password,admin_code?}` → BE validasi Zod (nama non-kosong max 60, email valid, password ≥6).
2. BE cek email unik (lowercase); jika `admin_code` diisi → bandingkan timing-safe dengan `ADMIN_CODE` env; salah → 403 + delay 700ms (seperti `auth.php`); benar → role=ADMIN; jika kosong → role=USER.
3. Hash bcrypt(12) → insert User → terbitkan access JWT 15 mnt + refresh cookie 7 hari → FE simpan access di memory, redirect + tutup modal; jika `pendingCheck` true → langsung `showResult`.
4. Login: verifikasi bcrypt; 5x gagal → 429 blokir 15 mnt per IP+email.
5. Forgot: selalu balas `200 {ok:true}` (anti-enumeration); jika email ada → buat kode 6 digit, hash, exp 10 mnt, attempts=0 → kirim via SMTP/Resend; jika mail gagal → tulis ke log server + balas `mailed:false` (seperti `kode-reset.txt`).
6. Reset: cek exp + attempts<5; verifikasi hash kode; jika salah → attempts++ ; jika benar → update passwordHash, hapus kode.

**Alur Baca Konten (artikel/fakta/3M/kuis):**
1. FE `GET /api/content` sekali saat boot (SWR, cache 60s server + stale-while-revalidate client) → render 7 halaman.
2. Search artikel client-side dulu (seperti `drawArts`), fallback `GET /api/articles?q=` untuk dataset besar.
3. Rute hash dipertahankan: `#/`, `#/artikel`, `#/cek-gejala`, `#/cegah`, `#/fakta-mitos`, `#/catatan`, `#/poliklinik` + redirect LEGACY (`#cek→cek-gejala`, `#kuis→fakta-mitos`, `#jurnal→catatan`, `#poli→poliklinik`).

**Alur Cek Gejala (skrining):**
1. Guest centang → klik "Lihat hasil" → jika belum login → modal `#gate` (Masuk/Daftar/Nanti) dengan `pendingCheck=true`.
2. Setelah login → `score=sum(weight)`, `level = ada isDanger atau score≥6 ? tinggi : score≥3 ? sedang : rendah` (port 1:1 dari `app.js`).
3. `POST /api/checks` → update counter hero; FE tampilkan banner `.res.tinggi/sedang/rendah` + disclaimer bukan diagnosis + saran IGD bila tinggi.

**Alur Checklist 3M:**
1. Toggle → `PUT /api/checklist {taskId,done}` (login) atau localStorage `m3ids` (guest, sinkron saat login).
2. `pct=done/total`, bar hijau; jika 100% → confetti 🎉 + modal (seperti `celebrate()`).

**Alur Kuis:**
1. State `qi,qs` di FE; jawab → kunci tombol, highlight benar (hijau) / salah (merah) + feedback `fb.ok/no` + penjelasan.
2. Selesai → skor + pesan bertingkat + "Main lagi" + selebrasi 🏆 jika >0 else 💪.

**Alur Jurnal Demam:**
1. `GET /api/journal` saat halaman catatan dibuka (login) → sort date asc.
2. `POST /api/journal` validasi `YYYY-MM-DD`, `34≤temp≤43`, note≤200 → upsert unik (userId,date).
3. `insight()`: run demam ≥38°C ≥2 entri beruntun = tinggi; run 1 = sedang; sempat demam lalu turun = waspada fase kritis; else normal. Grafik 14 terakhir, bar merah jika ≥38, tinggi `(temp-35)/6*110px`.

**Alur Admin CMS:**
1. Tombol `.ab` hanya render jika `role==ADMIN` (`is-admin` class di body).
2. `ContentEditor` generik per SCHEMA (text/lines/cat+custom/tf/bool/num); articles hitung `mins=ceil(kata/180)` + `date=today()` untuk baru.
3. Hapus selalu via `ConfirmDialog` ("tidak bisa dibatalkan").

### Business Rules (dari PRD)
- Password min 6, email unik case-insensitive, kode reset 6 digit/10 mnt/5x coba.
- Hanya ADMIN boleh POST/PUT/DELETE masters + settings; 403 jika tidak.
- Hasil cek gejala wajib login untuk lihat (gate), tapi counter boleh anonim.
- Jurnal owner-only; 1 entri per tanggal (upsert).
- `mins` artikel otomatis; preview 110 char.
- Maps tanpa API key (embed `q=`); Instagram link tetap.

## BAGIAN 5: Keamanan, Performa, & Deployment

### Keamanan
- bcrypt cost 12; JWT access pendek + refresh httpOnly Secure SameSite=Lax; `helmet`, CORS allowlist (env `FRONTEND_URL`), rate-limit auth 10/mnt + global 100/mnt, validasi Zod semua body, escape output (React default), SQL aman via Prisma parameterized.
- RBAC `requireAuth` (401 jika tanpa token) + `requireAdmin` (403); enumerasi user dicegah (forgot selalu 200, login error generik "Email atau password salah").
- Secret hanya via env (`DATABASE_URL, JWT_SECRET, ADMIN_CODE, SMTP_*`); tidak commit; `.gitignore` untuk `.env`.
- Audit log: login gagal, signup admin, reset, CRUD admin (console + tabel opsional V1.1).

### Performa
- `GET /api/content` cache memori 60s + ETag; indeks DB sesuai Bagian 2; pagination artikel (`?limit=20&offset=`) untuk scale; FE code-splitting per route + lazy image + font display=swap; target p95 <500ms API, LCP <2.5s.
- Tanpa Redis di V1; naik ke Redis/Valkey bila traffic >500 concurrent (tinggal ganti layer cache).

### Deployment
- **Railway (utama):** 1 service `web` (Docker: build frontend → copy `dist/` ke `backend/public/` → `prisma migrate deploy && node seed` → `node dist/index.js`); tambah plugin Postgres atau link Supabase via `DATABASE_URL`; set env di dashboard; auto-deploy dari `main`.
- **Alternatif Render:** Web Service Node + Supabase eksternal, `build: npm ci && prisma migrate deploy && npm run build`, `start: npm start`, health check `/api/health`.
- **VPS:** `docker-compose up` (api + caddy) dengan Caddy auto-HTTPS reverse proxy `:80/:443 → api:3000`; backup via Supabase daily + `pg_dump` cron.
- CI (`deploy.yml`): `npm ci → prisma validate → vitest → build → migrate dry-run`; CD: push main → deploy Railway/Render.

### Development Setup
```bash
# 1) Clone + env
git clone <repo> waspada-dbd && cd waspada-dbd
cp backend/.env.example backend/.env   # isi DATABASE_URL Supabase, JWT_SECRET, ADMIN_CODE, SMTP_*

# 2) Backend (Node 20)
cd backend
npm install
npx prisma migrate dev --name init
npm run seed   # import data/content.json lama
npm run dev    # :3000

# 3) Frontend (terminal baru)
cd frontend
npm install
npm run dev    # :5173 (proxy /api → :3000)

# 4) Docker lokal (opsional, perlu Docker)
docker compose up --build
```

**🎉 Tech Spec selesai!**
