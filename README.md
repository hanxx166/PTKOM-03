# cekDBD — Portal Siaga DBD Poliklinik ITERA

Portal edukasi dan pemantauan mandiri DBD dengan skrining bertahap, pelacak suhu, kalkulator estimasi cairan, log trombosit, dan informasi edukasi. Hasil skrining dan kalkulasi bukan diagnosis atau pengganti konsultasi tenaga kesehatan.

## Struktur

- `frontend/` — React, TypeScript, Vite, dan Tailwind. Seluruh UI utama berada di satu dashboard responsif.
- `backend/` — Express dan Prisma untuk autentikasi, konten, statistik skrining, dan panel admin.
- `.perubahan/perubahan.html` — prototipe desain HTML; UI produksi sudah diadaptasi menjadi komponen React.

Halaman navigasi lama yang tidak ada pada rancangan baru telah disatukan ke dashboard atau dihapus. Login dan panel admin tetap tersedia; data suhu serta trombosit tersimpan lokal di browser.

## Menjalankan lokal

Terminal 1 — backend (`http://localhost:3000`):

```bash
cd backend
npm install
npm run dev
```

Terminal 2 — frontend (`http://localhost:5173`):

```bash
cd frontend
npm install
npm run dev
```

Atur `VITE_API_URL` di `frontend/.env` untuk menghubungkan frontend ke backend. Tanpa backend, frontend memakai konten statis dari `frontend/public/data/content.json` dan autentikasi standalone di browser.

## Validasi

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
npm run build
node smoke.cjs
```

## Deployment

- Frontend: deploy folder `frontend/` sebagai aplikasi Vite.
- Backend: deploy folder `backend/` sesuai konfigurasi `backend/render.yaml`; isi variabel lingkungan database, admin, dan CORS sesuai lingkungan deployment.
