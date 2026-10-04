# Poliklinik ITERA - Waspada DBD (Proyek Akhir PTKOM 2026)

Edukasi DBD + cek gejala + checklist 3M Plus + kuis Fakta/Mitos + Catatan Demam + info Poliklinik.
Fitur: artikel, cek gejala, checklist 3M Plus, kuis Fakta/Mitos, Catatan Demam Saya (khusus akun), info Poliklinik + Google Maps, panel admin.

## Arsitektur baru (fullstack)

- `frontend/` — Vite + React + Tailwind, HashRouter 7 rute (`/`, `/artikel`, `/cek-gejala`, `/cegah`, `/fakta-mitos`, `/catatan`, `/poliklinik`, `/admin`), fallback file statis bila backend mati
- `backend/` — Express + Prisma (SQLite lokal, siap `postgresql` untuk Supabase), JWT + bcrypt, rate-limit
- `legacy/` — arsip website lama (vanilla + PHP + JSON) sebagai pembanding
- Dokumen: `.agents/1-PRD.md`, `.agents/2-TECH-SPEC.md`, `.agents/3-TASKS.md`

## Menjalankan lokal (2 terminal)

Terminal 1 — backend (`http://localhost:3000`):

```bash
cd backend
npm install        # sekali saja
npm run dev        # butuh seed sekali: npx prisma migrate dev && npm run seed
```

Terminal 2 — frontend (`http://localhost:5173`):

```bash
cd frontend
npm install        # sekali saja
npm run dev        # VITE_API_URL sudah mengarah ke :3000 (lihat frontend/.env)
```

Tanpa backend pun FE tetap jalan (mode standalone: data dari `public/data/content.json`, akun di browser).

## Tes

```bash
cd backend
npm run build && node smoke.cjs   # 11 cek: health, content, auth, journal, checks, RBAC
```

## Deploy gratis

1. **Supabase** — buat project Postgres gratis → salin pooler `DATABASE_URL` (`:6543`)
2. **Render** — New Web Service dari repo ini, root `backend`, pakai `backend/render.yaml`; isi `DATABASE_URL`, `ADMIN_CODE`, `FRONTEND_URL`; lalu `npx prisma migrate deploy` + `npm run seed` + `npx tsx prisma/import-legacy.ts` (sekali)
3. **Vercel** — import folder `frontend/`, isi `VITE_API_URL` dengan URL Render
4. Ganti `provider` di `backend/prisma/schema.prisma` menjadi `postgresql` sebelum migrate ke Supabase

## Akun

- Daftar biasa lewat UI. Untuk admin: isi `ADMIN_CODE` di env backend, lalu daftar dengan kode tersebut (kolom kode tampil di... hubungi pengelola). Akun pertama lokal otomatis admin (mode standalone).
- Akun PHP lama (`legacy/data/users.json`) tetap bisa login (hash dinormalisasi saat import) — kecuali akun Live Server yang wajib daftar ulang.
- Lupa password: kode 6 digit tampil di terminal backend (mode gratis tanpa SMTP), berlaku 10 menit.

## Versi lama (arsip)

Lihat `legacy/README.md`. Jalankan: `php -S localhost:8000` dari folder `legacy/`.
