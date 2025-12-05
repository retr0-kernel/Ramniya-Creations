-- Create products table
CREATE TABLE products (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          title TEXT NOT NULL,
                          description TEXT,
                          price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
                          metadata JSONB DEFAULT '{}',
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_variants table
CREATE TABLE product_variants (
                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                  sku TEXT UNIQUE NOT NULL,
                                  attributes JSONB NOT NULL DEFAULT '{}',
                                  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
                                  price_modifier NUMERIC(10, 2) DEFAULT 0,
                                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_images table
CREATE TABLE product_images (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                path TEXT NOT NULL,
                                is_primary BOOLEAN DEFAULT FALSE,
                                display_order INTEGER DEFAULT 0,
                                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_metadata ON products USING GIN(metadata);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_attributes ON product_variants USING GIN(attributes);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_product_images_display_order ON product_images(display_order);

-- Ensure only one primary image per product
CREATE UNIQUE INDEX idx_product_images_one_primary
    ON product_images(product_id)
    WHERE is_primary = TRUE;

-- Trigger to update updated_at on products
CREATE OR REPLACE FUNCTION update_products_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();

-- Trigger to update updated_at on product_variants
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
EXECUTE FUNCTION update_product_variants_updated_at();

-- Comments for documentation
COMMENT ON TABLE products IS 'Main products catalog';
COMMENT ON COLUMN products.metadata IS 'Additional product metadata (tags, categories, etc.)';
COMMENT ON COLUMN products.price IS 'Base price in the primary currency';

COMMENT ON TABLE product_variants IS 'Product variations (size, color, etc.)';
COMMENT ON COLUMN product_variants.attributes IS 'Variant attributes as JSON (e.g., {"size":"M","color":"gold"})';
COMMENT ON COLUMN product_variants.price_modifier IS 'Price adjustment for this variant (can be positive or negative)';

COMMENT ON TABLE product_images IS 'Product images with ordering support';
COMMENT ON COLUMN product_images.path IS 'Relative path from uploads directory (e.g., 2024/12/abc123.jpg)';
COMMENT ON COLUMN product_images.is_primary IS 'Primary/featured image for the product';
COMMENT ON COLUMN product_images.display_order IS 'Order for displaying images (lower = first)';
