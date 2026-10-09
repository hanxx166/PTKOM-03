-- Tabel Mitos vs Fakta. Berbeda dari Fact: Fact berisi angka statistik,
-- Mitos berisi tanya-jawab. Jawaban disimpan sebagai teks polos, bold ditulis
-- dengan markdown **tebal** karena JSX tidak bisa disimpan di database.
CREATE TABLE "Mitos" (
  "id" SERIAL NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Mitos_pkey" PRIMARY KEY ("id")
);

-- Wajib deny-all: tanpa ini anon key Supabase bisa membaca dan menulis Mitos
-- langsung, melewati seluruh backend. Backend connect sebagai owner tabel,
-- jadi RLS tidak mengganggu.
ALTER TABLE "Mitos" ENABLE ROW LEVEL SECURITY;

-- Isi awal, sebelumnya konstanta FAQS di frontend/src/components/Education.tsx.
INSERT INTO "Mitos" ("question", "answer", "sortOrder") VALUES
  ('Jambu biji menaikkan trombosit?', 'Belum ada bukti klinis kuat bahwa jambu biji secara langsung menaikkan trombosit. Buah dapat menjadi bagian dari pola makan, tetapi tidak menggantikan cairan dan penanganan medis.', 1),
  ('Fogging saja cukup mencegah DBD?', '**Tidak.** Fogging menyasar nyamuk dewasa dan tidak menghilangkan jentik. Pencegahan perlu dilengkapi penghapusan sarang nyamuk dan 3M Plus.', 2),
  ('Apakah demam turun berarti pasien sudah sehat?', '**Belum tentu.** Pada DBD, kondisi dapat memburuk ketika demam turun. Tetap waspadai tanda bahaya dan ikuti pemantauan tenaga kesehatan.', 3),
  ('Apakah antibiotik menyembuhkan DBD?', 'DBD disebabkan virus dengue, sehingga antibiotik tidak bekerja untuk virus. Penanganan ditentukan dokter berdasarkan kondisi pasien.', 4),
  ('Sudah pernah DBD, tidak bisa kena lagi?', '**Salah.** Terdapat beberapa serotipe virus dengue. Seseorang dapat terinfeksi kembali, jadi pencegahan tetap penting.', 5),
  ('Apakah Aedes aktif di malam hari?', 'Aedes aegypti umumnya lebih aktif pada pagi dan sore hari. Gunakan perlindungan dari gigitan nyamuk sepanjang hari sesuai kebutuhan.', 6);