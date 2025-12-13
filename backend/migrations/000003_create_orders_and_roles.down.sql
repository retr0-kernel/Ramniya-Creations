-- Drop trigger
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
DROP FUNCTION IF EXISTS update_orders_updated_at();

-- Drop tables
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Remove role column from users
ALTER TABLE users DROP COLUMN IF EXISTS role;