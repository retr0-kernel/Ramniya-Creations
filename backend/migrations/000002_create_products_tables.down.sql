-- Drop triggers
DROP TRIGGER IF EXISTS product_variants_updated_at ON product_variants;
DROP TRIGGER IF EXISTS products_updated_at ON products;

-- Drop functions
DROP FUNCTION IF EXISTS update_product_variants_updated_at();
DROP FUNCTION IF EXISTS update_products_updated_at();

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
