-- AlterTable
ALTER TABLE "public"."Share" ADD COLUMN     "isText" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mediaKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "note" TEXT,
ALTER COLUMN "secret" DROP NOT NULL;
