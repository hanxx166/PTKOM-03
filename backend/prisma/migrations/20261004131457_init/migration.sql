-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mins" INTEGER NOT NULL DEFAULT 1,
    "date" TEXT NOT NULL DEFAULT '',
    "authorId" INTEGER,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isDanger" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizItem" (
    "id" SERIAL NOT NULL,
    "statement" TEXT NOT NULL,
    "isFact" BOOLEAN NOT NULL DEFAULT true,
    "explanation" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "QuizItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fact" (
    "id" SERIAL NOT NULL,
    "big" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Fact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FeverEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "FeverEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomCheck" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "level" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "symptomIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SymptomCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistProgress" (
    "userId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistProgress_pkey" PRIMARY KEY ("userId","taskId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PasswordReset_email_idx" ON "PasswordReset"("email");

-- CreateIndex
CREATE INDEX "FeverEntry_userId_date_idx" ON "FeverEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FeverEntry_userId_date_key" ON "FeverEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "SymptomCheck_level_idx" ON "SymptomCheck"("level");

-- AddForeignKey
ALTER TABLE "FeverEntry" ADD CONSTRAINT "FeverEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymptomCheck" ADD CONSTRAINT "SymptomCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistProgress" ADD CONSTRAINT "ChecklistProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
