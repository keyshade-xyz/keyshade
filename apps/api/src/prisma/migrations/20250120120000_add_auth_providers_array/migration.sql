-- Add authProviders array column with default empty array
ALTER TABLE "User" ADD COLUMN "authProviders" "AuthProvider"[] NOT NULL DEFAULT '{}';

-- Backfill authProviders array from existing authProvider column
UPDATE "User" 
SET "authProviders" = CASE 
  WHEN "authProvider" IS NOT NULL THEN ARRAY["authProvider"] 
  ELSE '{}' 
END;

-- Drop the old authProvider column
ALTER TABLE "User" DROP COLUMN "authProvider";
