# Mini PRD — Waspada-DBD Fullstack (Poliklinik ITERA)

> Stack disepakati: Frontend Vite + Tailwind (React), Backend Node.js Express + Prisma, Database PostgreSQL (Supabase), Deploy VPS / Railway / Render.
> Sumber migrasi: `index.html`, `app.js`, `style.css`, `api/*.php` (6 file), `data/content.json`, `img/*.svg`.

## BAGIAN 1: Visi & Tujuan Produk

### Visi Produk
Waspada-DBD menjadi platform edukasi dan skrining awal DBD yang terhubung Poliklinik ITERA, dengan data tersimpan terpusat dan aman di database (bukan lagi file JSON / localStorage), dapat diakses sivitas ITERA dan publik dari mana saja setelah deploy, dengan pengalaman UI/UX yang sama menyenangkannya seperti versi saat ini.

### Tujuan Utama
1. **Migrasi penyimpanan ke database** — 100% data (artikel, gejala, 3M, kuis, fakta, jurnal, user, log cek) pindah dari `data/*.json` + `localStorage` ke PostgreSQL (Supabase) via Prisma. Indikator: tidak ada lagi fallback `MODE=local`.
2. **Backend modern siap deploy** — Ganti `api/*.php` prosedural menjadi Express + Prisma REST API dengan JWT + bcrypt. Indikator: `GET /api/content <500ms`, deploy hijau di Railway/Render.
3. **Frontend modern tanpa ubah UX** — Rebuild vanilla `index.html`/`app.js` ke Vite + Tailwind React, pertahankan 7 rute (`beranda, artikel, cek-gejala, cegah, fakta-mitos, catatan, poliklinik`) + gaya Poppins/Nunito, hero, nyamuk klik, confetti. Indikator: Lighthouse ≥90, rute hash lama (`#/cek`, `#/kuis`, dll) tetap jalan via redirect.
4. **Auth & admin aman** — Registrasi/login/reset kode 6 digit dengan hash, role `user/admin` (ganti `ADMIN_CODE` + SHA-256 demo), rate-limit + RBAC. Indikator: 0 password plaintext, non-admin ditolak di endpoint tulis konten.
5. **Jurnal & skrining personal terpusat** — Catatan demam + grafik + peringatan otomatis dan riwayat cek gejala tersimpan per-user lintas device. Indikator: pindah HP tanpa kehilangan data.

### Value Proposition
- **Satu pintu ITERA:** edukasi + cek gejala + checklist 3M + info jam/lokasi/maps/Instagram Poliklinik dalam satu web.
- **Skrining bertanggung jawab:** skor berbobot + tanda bahaya + ajakan ke IGD (112/119), bukan diagnosis.
- **Data milik pengguna:** jurnal demam privat per-akun dengan insight fase kritis hari 3–7.

## BAGIAN 2: User Persona

### Persona 1: Nabila — Mahasiswi ITERA
- **Usia/Pekerjaan:** 19 tahun, Mahasiswi TPB ITERA, tinggal di asrama
- **Level Teknis:** Menengah (aktif pakai HP, Instagram, Google Maps)
- **Tujuan:** Tahu cepat apakah demamnya perlu ke Poliklinik, catat suhu harian saat sakit, tahu jam buka poliklinik.
- **Pain Points:** Versi lama datanya hilang kalau ganti browser/HP; bingung fase kritis DBD; takut antre tapi tidak tahu kapan harus ke IGD.
- **Motivasi:** Dekat ke Poliklinik kampus, gratis untuk sivitas, ingin tenang dengan panduan yang jelas bahasa Indonesia.

### Persona 2: dr. Hendra — Pengelola Poliklinik / Admin Konten
- **Usia/Pekerjaan:** 35 tahun, Dokter/petugas Poliklinik ITERA, pengelola edukasi
- **Level Teknis:** Menengah (bisa kelola CMS sederhana, tidak bisa coding)
- **Tujuan:** Update artikel/gejala/kuis/info maps tanpa edit kode, pastikan info jam & kontak benar, lihat statistik cek gejala.
- **Pain Points:** Versi PHP file-JSON rawan tertimpa, tidak ada audit, `ADMIN_CODE` di `config.php` manual, takut salah hapus konten.
- **Motivasi:** Punya dashboard admin aman + bisa deploy ulang tanpa takut data hilang.

## BAGIAN 3: User Stories

### Modul Autentikasi & Akun
- Sebagai pengguna baru, saya ingin mendaftar dengan nama+email+password, agar bisa memakai jurnal dan cek gejala.
- Sebagai pengguna, saya ingin masuk/keluar dan tetap login lintas device, agar tidak input ulang.
- Sebagai pengguna lupa password, saya ingin terima kode 6 digit via email (berlaku 10 menit), agar bisa reset password.
- Sebagai pendaftar admin, saya ingin memasukkan kode admin saat daftar, agar mendapat peran admin.

### Modul Edukasi (Artikel, Fakta, Cegah, Kuis)
- Sebagai pengunjung, saya ingin membaca artikel + cari + buka detail, agar paham DBD (dasar, gejala, pencegahan, penanganan).
- Sebagai pengunjung, saya ingin melihat kartu fakta dan checklist 3M Plus dengan progress %, agar tahu aksi pencegahan.
- Sebagai pengunjung, saya ingin main kuis Fakta/Mitos dengan penjelasan tiap soal, agar belajar interaktif.

### Modul Skrining & Jurnal
- Sebagai pengguna terdaftar, saya ingin centang gejala dan lihat hasil skor (rendah/sedang/tinggi), agar tahu kapan ke dokter/IGD.
- Sebagai pengguna terdaftar, saya ingin catat suhu harian + grafik 14 hari + peringatan demam berlanjut, agar terpantau dan bisa ditunjukkan ke dokter.

### Modul Poliklinik & Admin
- Sebagai pengunjung, saya ingin lihat jam operasional, lokasi, peta Google Maps, dan Instagram Poliklinik, agar mudah berkunjung.
- Sebagai admin, saya ingin tambah/edit/hapus artikel, gejala (bobot 1–3 + danger), tasks 3M, kuis, fakta, dan lokasi peta, agar konten selalu update.
- Sebagai admin, saya ingin lihat total statistik cek gejala, agar tahu tingkat penggunaan.

(Total 13 stories)

## BAGIAN 4: Functional Requirements

### Modul Autentikasi

**FR-01: Registrasi Pengguna**
- **Input:** name (max 60), email valid, password min 6, admin_code opsional
- **Proses:** Validasi unik email (case-insensitive), bcrypt hash (cost 12), tentukan role (kode benar → admin)
- **Output:** User {name,email,role} + sesi JWT; error 409 jika email duplikat, 403 jika kode admin salah
- **Aturan Bisnis:** Rate-limit 10 req/menit; log audit signup

**FR-02: Login / Logout / Me**
- **Input:** email, password
- **Proses:** Verifikasi bcrypt, terbitkan access JWT 15 mnt + refresh httpOnly 7 hari
- **Output:** Profil + token; `GET /me` kembalikan sesi aktif
- **Aturan:** 5x gagal → blokir 15 mnt; timing-safe agar tidak bocor user enumeration

**FR-03: Lupa & Reset Password**
- **Input:** email → kode 6 digit → password baru
- **Proses:** Simpan hash kode + exp 10 mnt + max 5 percobaan; kirim via SMTP/Resend; fallback tulis ke log server (seperti `kode-reset.txt` lama)
- **Output:** OK/mailed flag; reset sukses hapus kode
- **Aturan:** Kode sekali pakai; password baru min 6

### Modul Konten Publik

**FR-04: Baca Konten Gabungan**
- **Input:** `GET /api/content`
- **Proses:** Ambil articles, symptoms, tasks, quiz, facts, contact dari Postgres; cache 60 detik
- **Output:** JSON gabungan + `totalChecks` untuk hero ("N pengecekan telah dilakukan")
- **Aturan:** Publik tanpa login; response <500ms

**FR-05: Artikel + Pencarian**
- **Input:** query `?q=`, tag filter
- **Proses:** Search case-insensitive di title+body; hitung `mins = ceil(kata/180)`
- **Output:** List kartu (tag · mins, title, preview 110 char, date id-ID) + detail body per paragraf
- **Aturan:** Preservasi 4 artikel seed + tanggal `2026-10-01`

**FR-06: Gejala & Skoring**
- **Input:** symptomIds tercentang
- **Proses:** `score = sum(weight)`; `tinggi` jika ada `isDanger` atau score≥6; `sedang` jika ≥3; else `rendah`; simpan ke SymptomCheck
- **Output:** Label + skor + saran + disclaimer "bukan diagnosis" + gate login (modal terkunci jika guest, seperti `#gate`)
- **Aturan:** Wajib login untuk lihat hasil; minimal 1 gejala

**FR-07: Checklist 3M Plus**
- **Input:** toggle task per-user
- **Proses:** Simpan progres per-user di DB (migrasi dari `localStorage m3ids`); hitung `% = done/total`
- **Output:** Progress bar + teks "% selesai"; confetti 🎉 saat 100%
- **Aturan:** Guest tetap bisa pakai mode lokal, sinkron saat login

**FR-08: Kuis Fakta/Mitos**
- **Input:** Jawaban Fakta/Mitos per pernyataan
- **Proses:** Urutan qi, skor qs, kunci jawaban highlight hijau/merah, feedback + penjelasan
- **Output:** Skor akhir + pesan bertingkat + tombol "Main lagi" + selebrasi 🏆/💪
- **Aturan:** Publik; tidak simpan skor permanen di V1

**FR-09: Fakta & Cegah Dinamis**
- **Input:** Admin CRUD facts/tasks
- **Proses:** Validasi big/text tidak kosong
- **Output:** Grid kartu fakta berubah instan
- **Aturan:** Hanya admin boleh tulis

### Modul Jurnal Demam

**FR-10: CRUD Jurnal**
- **Input:** date YYYY-MM-DD, temp 34–43 step 0.1, note max 200
- **Proses:** Upsert per (userId,date), max 200 entri; sort by date
- **Output:** List riwayat + form default today()
- **Aturan:** Owner-only; hapus dengan konfirmasi

**FR-11: Grafik & Insight Otomatis**
- **Input:** Deret suhu terurut
- **Proses:** Port logika `insight()` lama: run demam ≥38°C ≥2 = tinggi; run 1 = sedang; sempat demam lalu turun = waspada fase kritis; else normal. Bar merah jika ≥38, tinggi bar = `(temp-35)/6*110px`, tampil 14 terakhir
- **Output:** Banner res (tinggi/sedang/rendah) + bar chart + label DD/MM + tooltip °C
- **Aturan:** 1 entri/hari disarankan; disclaimer privat per-akun

### Modul Poliklinik & Admin

**FR-12: Info Poliklinik + Maps**
- **Input:** `contact.maps` string
- **Proses:** `encodeURIComponent` → `https://www.google.com/maps?q=...&output=embed` + link search; Instagram `poliklinik_itera`
- **Output:** 5 kartu (profil, jam Senin–Jumat 08.00–16.00, lokasi Jl. Terusan Ryacudu, layanan, kontak) + iframe 280px
- **Aturan:** Publik; teks jam bisa diedit admin via SiteSetting di V1.1

**FR-13: CMS Admin Generik**
- **Input:** Form per SCHEMA (articles: title/tag/cat+custom/body lines; symptoms: label/w 1–3/danger bool; tasks: text; quiz: s/a tf/e; facts: big/text; contact: maps)
- **Proses:** Validasi Zod per tipe (text/lines/cat/tf/bool/num), id baru `s+timestamp` untuk symptoms
- **Output:** Simpan + render ulang instan; tombol Edit/Hapus hanya visible saat `isAdmin`
- **Aturan:** `requireAdmin`; hapus dengan dialog konfirmasi

**FR-14: Statistik Cek**
- **Input:** `POST /api/checks {level}`, `GET /api/checks/stats`
- **Proses:** Ganti `checks.log` append-file menjadi insert DB
- **Output:** `{total, rendah, sedang, tinggi}`
- **Aturan:** POST boleh anonim (untuk hitung hero), GET publik

**FR-15: Seed & Migrasi Data**
- **Input:** `data/content.json`, `users.json`, `journal.json`, `checks.log`
- **Proses:** Script `prisma/seed.js` import semua; user lama wajib reset password (hash lama tidak portable)
- **Output:** DB terisi + log hasil import
- **Aturan:** Idempotent (bisa jalan ulang tanpa duplikat)

(Total 15 FR inti, siap dipecah ke Tech Spec)

## BAGIAN 5: Non-Functional Requirements

### Performa
- Halaman FE (build Vite) LCP <2.5s di 4G; `GET /api/content` p95 <500ms (cache 60s + indeks `Article(tag)`, `FeverEntry(userId,date)`).
- Support 500 concurrent baca, 50 tulis bersamaan tanpa race (transaksi Prisma, bukan file lock).

### Keamanan
- bcrypt cost 12, JWT access 15 mnt + refresh httpOnly Secure SameSite, RBAC `requireAuth/requireAdmin`, helmet, CORS allowlist, rate-limit auth, validasi Zod semua input, `ADMIN_CODE` hanya via env (tidak ikut repo).
- Jurnal & cek per-user tidak bocor lintas akun (test owner-only).

### Skalabilitas & Reliabilitas
- Target 10.000 user terdaftar; Postgres Supabase + connection pooling; backend stateless (siap horizontal scale di Railway/Render); backup harian Supabase; health check `/api/health`.

### Usability & Kompatibilitas
- Bahasa Indonesia, responsif (burger <900px, hero 1 kolom <760px, jform 2 kolom), `prefers-reduced-motion` matikan animasi, keyboard-focusable kartu artikel, aria-label nav/burger/IG.
- Kompatibel Chrome/Edge/Firefox/Safari terbaru + Android; fallback pesan jelas jika API mati ("backend belum berjalan").

### Maintainability & Deploy
- Monorepo `frontend/`, `backend/`, `prisma/`; migrasi versioned; seed idempotent; CI: lint+test+migrate; CD Railway (auto deploy main) dengan env `DATABASE_URL, JWT_SECRET, ADMIN_CODE, SMTP_*`; Docker Compose untuk lokal + VPS (Caddy HTTPS).

## BAGIAN 6: Out of Scope & Dependensi

### Out of Scope (Tidak di V1)
- PWA offline penuh / push notification demam — V2
- Role dokter + rekam medis / integrasi SIMRS — V2
- Upload gambar artikel / rich-text editor — V1 cukup textarea per-baris
- Multi-bahasa (Inggris) & dark mode — V2
- Export PDF jurnal & share WhatsApp — V2
- Analitik lanjutan (grafik tren kampus, heatmap) — V1 cukup total counter

### Dependensi
- Supabase Postgres — database utama + SMTP (atau Resend untuk email kode reset)
- NPM: express, @prisma/client, bcryptjs, jsonwebtoken, zod, helmet, cors, express-rate-limit (BE); react-router, tailwindcss, swr/axios (FE)
- Google Maps Embed (tanpa API key, via `q=` URL) + Instagram link — info poliklinik
- Railway / Render — hosting; Docker + Caddy untuk opsi VPS; GitHub Actions — CI/CD
- Font Google (Poppins + Nunito Sans) + aset `img/hero.svg, mosquito.svg, pattern.svg` dari repo lama

### Asumsi
- User punya internet + email aktif untuk reset password
- `ADMIN_CODE` diisi via env dashboard hosting (tidak commit)
- User lama versi JSON bersedia reset password sekali saat migrasi
- Info medis tetap edukasi/skrining, bukan diagnosis — footer disclaimer dipertahankan

---
*Selamat! Mini PRD selesai dan tersimpan di `.agents/1-PRD.md`. Langkah lanjut yang disarankan: `Buat Tech Spec berdasarkan PRD yang sudah dibuat`.*
