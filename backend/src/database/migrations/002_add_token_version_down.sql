-- Rollback token_version migration
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS idx_users_token_version;
ALTER TABLE users DROP COLUMN IF EXISTS token_version;