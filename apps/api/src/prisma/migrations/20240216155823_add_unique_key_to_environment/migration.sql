/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `Environment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Environment_projectId_name_key" ON "Environment"("projectId", "name");
