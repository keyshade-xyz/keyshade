/*
  Warnings:

  - A unique constraint covering the columns `[projectId,environmentId,name]` on the table `Secret` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[secretId,version]` on the table `SecretVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Secret_projectId_environmentId_name_key" ON "Secret"("projectId", "environmentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SecretVersion_secretId_version_key" ON "SecretVersion"("secretId", "version");
