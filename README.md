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

- `DATABASE_URL` dengan connection string PostgreSQL yang valid.
- `JWT_SECRET` dengan secret acak yang panjang dan unik.
- `ADMIN_CODE` dengan kode pendaftaran admin (opsional).
- `FRONTEND_URL` dengan alamat frontend lokal, biasanya `http://localhost:5173`.

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
npx prisma migrate dev
npm run seed
```

Migrasi menyiapkan struktur database. Seed mengisi konten awal dari `backend/prisma/seed-data.json`. **Seed menghapus lalu membuat ulang data konten** seperti artikel, gejala, checklist, kuis, dan fakta; gunakan saat setup database kosong, bukan setiap kali menjalankan server.

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

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`. Hentikan masing-masing server dengan `Ctrl+C`.

Jalankan `npx prisma migrate dev` lagi hanya ketika ada migrasi/skema database baru. Jalankan `npm run seed` hanya bila memang ingin memuat ulang konten awal.

## Login dan admin

- Dengan backend, atur `ADMIN_CODE` di `backend/.env`. Saat mendaftar, aktifkan opsi **Daftar sebagai admin** dan masukkan kode tersebut.
- Tanpa backend, aplikasi dapat memakai konten statis di `frontend/public/data/content.json`; akun disimpan hanya di browser dan akun lokal pertama otomatis menjadi admin.
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

1. Siapkan PostgreSQL dan gunakan URL koneksinya sebagai `DATABASE_URL`.
2. Deploy backend dari folder `backend/` menggunakan `backend/render.yaml`. Atur `DATABASE_URL`, `JWT_SECRET`, `ADMIN_CODE`, dan `FRONTEND_URL` di konfigurasi layanan.
3. Deploy frontend dari folder `frontend/` sebagai aplikasi Vite dan atur `VITE_API_URL` ke URL backend.
4. Pastikan alamat frontend yang di-deploy diizinkan oleh `FRONTEND_URL` backend.
