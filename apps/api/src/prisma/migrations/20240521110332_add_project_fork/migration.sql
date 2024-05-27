-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "forkedFromId" TEXT,
ADD COLUMN     "isForked" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_forkedFromId_fkey" FOREIGN KEY ("forkedFromId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
