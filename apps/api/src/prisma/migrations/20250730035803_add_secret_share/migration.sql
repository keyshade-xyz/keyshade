-- CreateTable
CREATE TABLE "public"."Share" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isPasswordProtected" BOOLEAN NOT NULL,
    "viewLimit" INTEGER NOT NULL,
    "timesViewed" INTEGER NOT NULL DEFAULT 0,
    "recepientEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Share_hash_key" ON "public"."Share"("hash");
