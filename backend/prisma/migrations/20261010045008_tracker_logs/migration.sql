-- CreateTable
CREATE TABLE "FeverLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FeverLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlateletLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "PlateletLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeverLog_userId_idx" ON "FeverLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeverLog_userId_day_time_key" ON "FeverLog"("userId", "day", "time");

-- CreateIndex
CREATE INDEX "PlateletLog_userId_idx" ON "PlateletLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlateletLog_userId_day_key" ON "PlateletLog"("userId", "day");

-- AddForeignKey
ALTER TABLE "FeverLog" ADD CONSTRAINT "FeverLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlateletLog" ADD CONSTRAINT "PlateletLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
