-- Row Level Security: tolak semua akses langsung lewat Supabase Data API.
--
-- Tanpa ini, anon key Supabase cukup untuk membaca dan menulis tabel di bawah
-- secara langsung, melewati backend: password, RBAC, dan rate limit jadi tidak
-- berarti. Backend tidak terdampak karena koneksinya memakai role postgres,
-- yang tercatat melewati RLS.
--
-- Tidak ada policy yang dibuat dengan sengaja: seluruh akses langsung ditolak.
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