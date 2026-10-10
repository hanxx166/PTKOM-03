# cekDBD - Portal Siaga DBD Poliklinik ITERA

Portal edukasi dan pemantauan mandiri DBD untuk sivitas akademika ITERA. Aplikasi menyediakan skrining gejala, pelacak suhu, kalkulator estimasi cairan, pencatatan hasil trombosit, dan materi edukasi.

> Hasil skrining dan kalkulator hanya untuk edukasi, bukan diagnosis atau pengganti konsultasi tenaga kesehatan.

## Teknologi

- `frontend/` - React, TypeScript, Vite, dan Tailwind CSS. Antarmuka utama berada pada satu dashboard responsif.
- `backend/` - Express dan Prisma. Menangani API, autentikasi, data konten, dan statistik pemeriksaan.
- PostgreSQL - database aplikasi yang dikonfigurasi melalui `DATABASE_URL`.

Data pelacak suhu dan trombosit disimpan di browser pengguna. Login dan statistik terpusat memerlukan backend.

## Persiapan pertama kali

Pastikan Node.js dan npm sudah terpasang. Buka terminal dari folder proyek.

### 1. Siapkan konfigurasi

Buat file `backend/.env` berdasarkan `backend/.env.example`, lalu isi:

- `DATABASE_URL` dengan pooler URL Supabase. Lokal dan produksi memakai database yang sama, jadi cukup satu URL. Ambil dari dashboard Supabase → **Connect** → **Connection String** → **Session pooler** (host `*.pooler.supabase.com`, port `5432`). Jangan pakai transaction pooler atau direct connection, karena migrasi menjalankan DDL yang butuh sesi panjang.
- `JWT_SECRET` dengan secret acak yang panjang dan unik.
- `FRONTEND_URL` dengan alamat frontend lokal, biasanya `http://localhost:5173`.

Buat admin (opsional, sekali saja). Akun admin tidak bisa dibuat dari website. Isi `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan opsional `ADMIN_NAME` di `backend/.env`, lalu jalankan dari folder `backend/`:

```powershell
npm run make-admin
```

Buat atau edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Jangan commit file `.env` atau membagikan nilainya.

### 2. Pasang dependensi dan siapkan database

Jalankan perintah berikut di PowerShell:

```powershell
cd C:\PTKOM\waspada-dbd\backend
npm install
npx prisma migrate deploy
npm run seed
```

Migrasi menyiapkan struktur database. Seed mengisi konten awal dari `backend/prisma/seed-data.json`. **Seed menghapus lalu membuat ulang data konten** seperti artikel, gejala, checklist, kuis, dan fakta; gunakan saat setup database kosong, bukan setiap kali menjalankan server.

Untuk database kosong sekali saja, jalankan `npx prisma migrate deploy` lalu `npm run seed`. Setelah itu tidak perlu diulang.

Pasang dependensi frontend satu kali:

```powershell
cd C:\PTKOM\waspada-dbd\frontend
npm install
```

## Menjalankan aplikasi sehari-hari

Frontend dan backend berjalan di terminal terpisah. Setelah konfigurasi dan setup pertama kali, `npm install`, migrasi, dan seed tidak perlu diulang pada setiap penggunaan.

**Terminal 1 - backend:**

```powershell
cd C:\PTKOM\waspada-dbd\backend
npm run dev
```

Backend berjalan di `http://localhost:3000`.

**Terminal 2 - frontend:**

```powershell
cd C:\PTKOM\waspada-dbd\frontend
npm run dev
```

Frontend selalu di `http://localhost:5173`. Port itu dikunci dengan `strictPort`, jadi Vite akan gagal start dengan pesan jelas alih-alih diam-diam pindah ke 5174 yang tidak lagi cocok dengan `FRONTEND_URL` backend. Jangan buka lewat `127.0.0.1:5173` atau alamat IP LAN: Vite hanya mendengarkan di `localhost`.

Jalankan `npx prisma migrate deploy` lagi hanya ketika ada migrasi/skema database baru. Jalankan `npm run seed` hanya bila memang ingin memuat ulang konten awal — perlu diingat `seed` menimpa isi produksi, karena `DATABASE_URL` lokal dan produksi menunjuk database yang sama.

### Bagaimana frontend menjangkau backend

Dua jalur, dipilih otomatis, tidak perlu diatur manual:

- **Saat `npm run dev`** frontend memanggil `/api/...` relatif, dan proxy Vite meneruskannya ke `http://localhost:3000`. Karena origin sama, CORS tidak berlaku sama sekali. Ubah `FRONTEND_URL` tidak akan merusak development.
- **Saat build produksi** frontend memakai `VITE_API_URL` sebagai URL absolut, karena hosting frontend statis tidak punya rewrite. Di sini CORS berlaku, jadi `FRONTEND_URL` di backend harus berisi origin frontend yang dipakai.

Aturannya ada di satu file, `frontend/src/lib/backend.ts`.

## Login dan admin

- Access token berlaku 15 menit dan disimpan di memori browser, bukan `localStorage`.
- Session yang lebih lama ditopang refresh cookie 7 hari yang `httpOnly`, jadi tidak bisa dibaca JavaScript. `/api/auth/refresh` menukarnya dengan access token baru, dan frontend memanggilnya otomatis saat load dan saat kena 401.
- Di produksi, refresh cookie memakai `Secure` dan `SameSite=None`, karena frontend Vercel dan backend Render adalah dua situs berbeda. Lokal HTTP memakai `SameSite=Lax`.
- Role selalu dibaca ulang dari database saat refresh, jadi admin yang diturunkan tidak lagi memegang akses admin lewat token lama.
- Access token dan refresh token dibedakan lewat klaim `typ`. Refresh token tidak bisa dipakai di endpoint biasa, dan access token tidak bisa dipakai menukar refresh. Keduanya ditandatangani secret yang sama, jadi pemisahan ini wajib, bukan pilihan gaya.
- Pendaftaran dari website selalu menghasilkan akun biasa. Tidak ada kode atau jalur di antarmuka yang bisa membuat role admin.
- Akun admin dibuat di luar website dengan `npm run make-admin` di folder `backend/`.
- Tanpa backend, aplikasi memakai konten statis di `frontend/public/data/content.json`; akun disimpan hanya di browser.
- Mode tanpa backend tidak menyediakan akun atau statistik lintas perangkat.

## Pemeriksaan

Frontend:

```powershell
cd C:\PTKOM\waspada-dbd\frontend
npm run lint
npm run build
```

Backend:

```powershell
cd C:\PTKOM\waspada-dbd\backend
npm run build
node smoke.cjs
npm run guard:env
```

`guard:env` memverifikasi backend menolak boot tanpa `JWT_SECRET` atau `FRONTEND_URL`, dan tidak ada lagi nilai cadangan hardcoded di hasil build. Guard ini menolak konfigurasi salah, bukan hanya memberi peringatan.

## Deployment

Lokal dan produksi memakai satu database PostgreSQL Supabase yang sama. Tidak ada lagi mode SQLite, jadi provider tidak perlu ditukar. `backend/scripts/guard-prod.mjs` menolak konfigurasi yang salah, dan `backend/render.yaml` memanggilnya sebelum `prisma migrate deploy`.

Cek manual guard kapan pun:

```powershell
cd C:\PTKOM\waspada-dbd\backend
npm run guard:prod
```

Migrasi di `backend/prisma/migrations/` sudah final untuk PostgreSQL dan **jangan dihapus atau dibuat ulang**. `prisma migrate deploy` di Render akan mencocokkannya dengan riwayat di `_prisma_migrations`; kalau file-nya berubah, deploy gagal dengan `P3009`. Migrasi `20261004133516_enable_rls` menyalakan RLS di 11 tabel tanpa membuat policy, jadi akses langsung lewat Supabase Data API ditolak seluruhnya. Backend tidak terpengaruh karena koneksinya memakai role owner.

Langkah deploy:

1. Deploy backend dari folder `backend/` menggunakan `backend/render.yaml`. Atur `DATABASE_URL`, `JWT_SECRET`, dan `FRONTEND_URL` di konfigurasi layanan. Jangan atur `PORT` atau `NODE_ENV` manual: Render menyediakan keduanya, dan `NODE_ENV` menentukan flag `Secure` serta `SameSite=None` pada cookie.
2. Deploy frontend dari folder `frontend/` sebagai aplikasi Vite dan atur `VITE_API_URL` ke URL backend.
3. Pastikan alamat frontend yang di-deploy diizinkan oleh `FRONTEND_URL` backend.
4. Akun admin tidak dibuat dari website. Jalankan `npm run make-admin` sekali dari mesinmu dengan `DATABASE_URL` produksi.

## Perintah yang merusak data produksi

Karena `DATABASE_URL` lokal dan produksi menunjuk database yang sama, dua perintah berikut menghapus isi produksi dan tidak boleh dijalankan tanpa sengaja:

- `npx prisma migrate reset` — menghapus seluruh tabel dan data
- `npm run seed` — `prisma/seed.ts` memakai `deleteMany()` tanpa kondisi pada `Article`, `Symptom`, `Task`, `QuizItem`, dan `Fact`

`npm run smoke` aman: ia menghapus user, entri journal, dan baris statistik yang dibuatnya sendiri.

## Utang teknis yang diketahui

- Kredensial Supabase lama masih ada di riwayat Git. Rotasi di dashboard Supabase tidak bisa diselesaikan lewat commit baru.
- `make-admin.ts` belum bisa mengganti `name` atau menurunkan role admin yang sudah ada. Gunakan `npx prisma studio` untuk perubahan itu.
