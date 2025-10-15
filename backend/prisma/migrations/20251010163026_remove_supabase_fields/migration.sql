-- Drop Supabase index from Account table
DROP INDEX IF EXISTS "idx_account_supabase_user";

-- Remove Supabase fields from Account table
ALTER TABLE "Account" DROP COLUMN IF EXISTS "supabaseUserId";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "supabaseEmail";

-- Remove Supabase token fields from AccountToken table
ALTER TABLE "AccountToken" DROP COLUMN IF EXISTS "supabaseAccessToken";
ALTER TABLE "AccountToken" DROP COLUMN IF EXISTS "supabaseRefreshToken";
