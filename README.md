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

- `DATABASE_URL`. Lokal memakai SQLite: `file:./dev.db`. Tidak butuh Docker, psql, atau service database apa pun.
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

Untuk mengulang dari nol, hapus `backend/prisma/dev.db` lalu jalankan `npx prisma migrate deploy` dan `npm run seed` lagi.

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

Jalankan `npx prisma migrate deploy` lagi hanya ketika ada migrasi/skema database baru. Jalankan `npm run seed` hanya bila memang ingin memuat ulang konten awal.

### Bagaimana frontend menjangkau backend

Dua jalur, dipilih otomatis, tidak perlu diatur manual:

- **Saat `npm run dev`** frontend memanggil `/api/...` relatif, dan proxy Vite meneruskannya ke `http://localhost:3000`. Karena origin sama, CORS tidak berlaku sama sekali. Ubah `FRONTEND_URL` tidak akan merusak development.
- **Saat build produksi** frontend memakai `VITE_API_URL` sebagai URL absolut, karena hosting frontend statis tidak punya rewrite. Di sini CORS berlaku, jadi `FRONTEND_URL` di backend harus berisi origin frontend yang dipakai.

Aturannya ada di satu file, `frontend/src/lib/backend.ts`.

## Login dan admin

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
```

## Deployment

Lokal memakai SQLite, tapi produksi memakai PostgreSQL. `backend/scripts/guard-prod.mjs` menolak konfigurasi lokal, dan ia dijalankan otomatis oleh `backend/render.yaml` sebelum `prisma migrate deploy`.

**Sebelum deploy, kembalikan provider di `backend/prisma/schema.prisma` ke `postgresql`, lalu buat ulang migrasi.** File migrasi yang ada sekarang ditulis untuk SQLite dan akan gagal di PostgreSQL.

Cek manual guard kapan pun:

```powershell
cd C:\PTKOM\waspada-dbd\backend
npm run guard:prod
```

Langkah deploy:

1. Ubah `provider` di `backend/prisma/schema.prisma` dari `sqlite` menjadi `postgresql`.
2. Hapus isi `backend/prisma/migrations/`, lalu buat ulang dengan `DATABASE_URL` PostgreSQL aktif. Tambahkan kembali kebijakan RLS, yaitu 11 baris berikut, supaya akses langsung lewat Supabase Data API ditolak:

   ```sql
   ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "PasswordReset" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Symptom" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "QuizItem" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Fact" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "SiteSetting" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "FeverEntry" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "SymptomCheck" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "ChecklistProgress" ENABLE ROW LEVEL SECURITY;
   ```

   Dicadangkan di `%TEMP%\ptkom-migrations-pg-backup` pada 9 Oktober 2026.
3. Siapkan PostgreSQL dan gunakan URL koneksinya sebagai `DATABASE_URL`.
4. Deploy backend dari folder `backend/` menggunakan `backend/render.yaml`. Atur `DATABASE_URL`, `JWT_SECRET`, dan `FRONTEND_URL` di konfigurasi layanan.
5. Deploy frontend dari folder `frontend/` sebagai aplikasi Vite dan atur `VITE_API_URL` ke URL backend.
6. Pastikan alamat frontend yang di-deploy diizinkan oleh `FRONTEND_URL` backend.
7. Jalankan `npm run make-admin` sekali dari mesinmu dengan `DATABASE_URL` produksi untuk membuat akun admin.
