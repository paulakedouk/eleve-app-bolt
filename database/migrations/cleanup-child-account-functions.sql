-- Cleanup script for child account functions
-- Since we're using Edge Functions, we don't need database functions

-- Drop any existing functions with these names
DROP FUNCTION IF EXISTS create_child_account;
DROP FUNCTION IF EXISTS create_child_account_simple;

-- Drop the pending_child_accounts table if it exists (we don't need it with Edge Functions)
DROP TABLE IF EXISTS pending_child_accounts;

-- Note: The child account creation is now handled by the 'create-child-account' Edge Function
-- which has proper admin privileges and handles all the account creation securely. 