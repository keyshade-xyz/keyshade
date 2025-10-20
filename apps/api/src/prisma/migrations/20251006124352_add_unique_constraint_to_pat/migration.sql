/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `PersonalAccessToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PersonalAccessToken_name_userId_key" ON "PersonalAccessToken"("name", "userId");
