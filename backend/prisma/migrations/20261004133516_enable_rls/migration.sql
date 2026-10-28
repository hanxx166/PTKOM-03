-- Enable Row Level Security (deny-all for anon/authenticated).
-- Backend connects as postgres role which bypasses RLS, so it is unaffected.
-- No policies created on purpose: all direct Data API access is denied.
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