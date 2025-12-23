-- CreateAuthProvidersArray
-- This is a Prisma-style migration for the auth providers feature
-- Migration name: 20250122000000_migrate_auth_provider_to_auth_providers_array

-- Step 1: Migrate existing authProvider data to authProviders array
-- For users who have authProvider set but authProviders is empty
UPDATE "User" 
SET "authProviders" = CASE 
  WHEN "authProvider" IS NOT NULL THEN ARRAY["authProvider"]::AuthProvider[]
  ELSE '{}'::AuthProvider[]
END
WHERE "authProvider" IS NOT NULL 
  AND ("authProviders" IS NULL OR "authProviders" = '{}');

-- Step 2 (TO BE DONE IN A SEPARATE MIGRATION AFTER TESTING):
-- Remove the legacy authProvider column
-- ALTER TABLE "User" DROP COLUMN "authProvider";

-- Verification queries (run these to check migration success):
-- 
-- 1. Check users with legacy authProvider that should be migrated:
-- SELECT COUNT(*) as users_with_legacy_auth 
-- FROM "User" 
-- WHERE "authProvider" IS NOT NULL;
--
-- 2. Check users after migration to ensure authProviders is populated:
-- SELECT COUNT(*) as users_with_new_auth 
-- FROM "User" 
-- WHERE array_length("authProviders", 1) > 0;
--
-- 3. Check for any users who might have been missed:
-- SELECT id, email, "authProvider", "authProviders"
-- FROM "User" 
-- WHERE "authProvider" IS NOT NULL 
--   AND ("authProviders" IS NULL OR "authProviders" = '{}')
-- LIMIT 10;
--
-- 4. Sample of migrated users:
-- SELECT id, email, "authProvider", "authProviders"
-- FROM "User" 
-- WHERE "authProvider" IS NOT NULL 
--   AND array_length("authProviders", 1) > 0
-- LIMIT 10;
