-- CreateTable
CREATE TABLE "DisabledEnvironmentOfSecret" (
    "secretId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DisabledEnvironmentOfVariable" (
    "variableId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DisabledEnvironmentOfSecret_secretId_environmentId_key" ON "DisabledEnvironmentOfSecret"("secretId", "environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "DisabledEnvironmentOfVariable_variableId_environmentId_key" ON "DisabledEnvironmentOfVariable"("variableId", "environmentId");

-- AddForeignKey
ALTER TABLE "DisabledEnvironmentOfSecret" ADD CONSTRAINT "DisabledEnvironmentOfSecret_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisabledEnvironmentOfSecret" ADD CONSTRAINT "DisabledEnvironmentOfSecret_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisabledEnvironmentOfVariable" ADD CONSTRAINT "DisabledEnvironmentOfVariable_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "Variable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisabledEnvironmentOfVariable" ADD CONSTRAINT "DisabledEnvironmentOfVariable_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
