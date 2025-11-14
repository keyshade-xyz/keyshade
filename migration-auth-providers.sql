-- Migration script to move data from authProvider to authProviders array
-- This script should be run as part of the database migration for the auth providers feature

BEGIN;

-- Step 1: Update all users to migrate their authProvider to authProviders array
-- Only update users who have a non-null authProvider and an empty authProviders array
UPDATE "User" 
SET "authProviders" = ARRAY["authProvider"]
WHERE "authProvider" IS NOT NULL 
  AND "authProviders" = '{}';

-- Step 2: Verify the migration (this is a check, not part of the actual migration)
-- You can run this separately to verify the migration worked correctly:
-- SELECT 
--   id, 
--   email, 
--   "authProvider", 
--   "authProviders"
-- FROM "User" 
-- WHERE "authProvider" IS NOT NULL 
--   AND ("authProviders" IS NULL OR "authProviders" = '{}');

-- Step 3: Drop the legacy authProvider column (ONLY RUN THIS AFTER CONFIRMING MIGRATION SUCCESS)
-- This should be done in a separate migration after confirming everything works
-- ALTER TABLE "User" DROP COLUMN "authProvider";

COMMIT;

-- Instructions:
-- 1. First, run only the UPDATE statement to migrate existing data
-- 2. Test your application thoroughly to ensure it works with the new authProviders field
-- 3. Run the verification query to ensure no users are left with empty authProviders when they have authProvider set
-- 4. Only after confirming everything works, run the DROP COLUMN statement in a separate migration
-- 5. Update your application code to remove references to the old authProvider field

-- Expected results after migration:
-- - Users who had authProvider = 'GOOGLE' will have authProviders = ['GOOGLE']
-- - Users who had authProvider = 'GITHUB' will have authProviders = ['GITHUB'] 
-- - Users who had authProvider = 'EMAIL_OTP' will have authProviders = ['EMAIL_OTP']
-- - Users who had authProvider = NULL will keep authProviders = [] (empty array)
