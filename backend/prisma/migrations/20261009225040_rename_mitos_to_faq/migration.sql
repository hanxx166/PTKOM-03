-- Isi tabel ini sebenarnya FAQ, bukan pasangan mitos vs fakta: pertanyaannya
-- umum ("Apakah Aedes aktif di malam hari?") dan tidak selalu berupa mitos.
-- Karena itu tabel dan model diganti namanya menjadi Faq.
-- Rename, bukan drop: 6 baris data ikut terbawa.
ALTER TABLE "Mitos" RENAME TO "Faq";

-- PostgreSQL tidak mengganti nama constraint saat tabel di-rename.
ALTER TABLE "Faq" RENAME CONSTRAINT "Mitos_pkey" TO "Faq_pkey";

-- RLS sudah menempel ke tabel dan tidak hilang saat rename. Pernyataan ini
-- diulang supaya guard-prod.mjs, yang mencari nama tabel per model di
-- prisma/schema.prisma, tetap menemukan "Faq" di salah satu migration.
ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;