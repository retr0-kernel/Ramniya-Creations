package products

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Product represents a product in the catalog
type Product struct {
	ID          uuid.UUID        `json:"id"`
	Title       string           `json:"title"`
	Description *string          `json:"description,omitempty"`
	Price       float64          `json:"price"`
	Metadata    json.RawMessage  `json:"metadata,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Variants    []ProductVariant `json:"variants,omitempty"`
	Images      []ProductImage   `json:"images,omitempty"`
}

// ProductVariant represents a product variant (size, color, etc.)
type ProductVariant struct {
	ID            uuid.UUID       `json:"id"`
	ProductID     uuid.UUID       `json:"product_id"`
	SKU           string          `json:"sku"`
	Attributes    json.RawMessage `json:"attributes"`
	Stock         int             `json:"stock"`
	PriceModifier float64         `json:"price_modifier"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

// ProductImage represents a product image
type ProductImage struct {
	ID           uuid.UUID `json:"id"`
	ProductID    uuid.UUID `json:"product_id"`
	Path         string    `json:"path"`
	URL          string    `json:"url"`
	IsPrimary    bool      `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
}

// CreateProductInput represents input for creating a product
type CreateProductInput struct {
	Title       string               `json:"title"`
	Description *string              `json:"description,omitempty"`
	Price       float64              `json:"price"`
	Metadata    json.RawMessage      `json:"metadata,omitempty"`
	Variants    []CreateVariantInput `json:"variants,omitempty"`
}

// CreateVariantInput represents input for creating a variant
type CreateVariantInput struct {
	SKU           string          `json:"sku"`
	Attributes    json.RawMessage `json:"attributes"`
	Stock         int             `json:"stock"`
	PriceModifier float64         `json:"price_modifier,omitempty"`
}

// UpdateProductInput represents input for updating a product
type UpdateProductInput struct {
	Title       *string         `json:"title,omitempty"`
	Description *string         `json:"description,omitempty"`
	Price       *float64        `json:"price,omitempty"`
	Metadata    json.RawMessage `json:"metadata,omitempty"`
}

// ListProductsFilter represents filters for listing products
type ListProductsFilter struct {
	MinPrice  *float64
	MaxPrice  *float64
	Size      *string
	Color     *string
	Limit     int
	Offset    int
	SortBy    string // "price", "created_at"
	SortOrder string // "asc", "desc"
}

// ProductRepository handles product database operations
type ProductRepository struct {
	db *sql.DB
}

// NewProductRepository creates a new product repository
func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

// CreateProduct creates a new product with optional variants
func (r *ProductRepository) CreateProduct(ctx context.Context, input CreateProductInput) (*Product, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert product
	var product Product
	var metadata []byte
	if input.Metadata != nil {
		metadata = input.Metadata
	} else {
		metadata = []byte("{}")
	}

	query := `
		INSERT INTO products (title, description, price, metadata)
		VALUES ($1, $2, $3, $4)
		RETURNING id, title, description, price, metadata, created_at, updated_at
	`

	err = tx.QueryRowContext(ctx, query, input.Title, input.Description, input.Price, metadata).
		Scan(&product.ID, &product.Title, &product.Description, &product.Price, &product.Metadata, &product.CreatedAt, &product.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	// Insert variants if provided
	if len(input.Variants) > 0 {
		for _, v := range input.Variants {
			var variant ProductVariant
			variantQuery := `
				INSERT INTO product_variants (product_id, sku, attributes, stock, price_modifier)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id, product_id, sku, attributes, stock, price_modifier, created_at, updated_at
			`

			variantAttrs := v.Attributes
			if variantAttrs == nil {
				variantAttrs = []byte("{}")
			}

			err = tx.QueryRowContext(ctx, variantQuery, product.ID, v.SKU, variantAttrs, v.Stock, v.PriceModifier).
				Scan(&variant.ID, &variant.ProductID, &variant.SKU, &variant.Attributes, &variant.Stock, &variant.PriceModifier, &variant.CreatedAt, &variant.UpdatedAt)
			if err != nil {
				return nil, fmt.Errorf("failed to create variant: %w", err)
			}

			product.Variants = append(product.Variants, variant)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &product, nil
}

// GetProduct retrieves a product by ID with variants and images
func (r *ProductRepository) GetProduct(ctx context.Context, productID uuid.UUID, baseURL string) (*Product, error) {
	var product Product

	query := `
		SELECT id, title, description, price, metadata, created_at, updated_at
		FROM products
		WHERE id = $1
	`

	err := r.db.QueryRowContext(ctx, query, productID).
		Scan(&product.ID, &product.Title, &product.Description, &product.Price, &product.Metadata, &product.CreatedAt, &product.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	// Get variants
	variants, err := r.GetProductVariants(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get variants: %w", err)
	}
	product.Variants = variants

	// Get images
	images, err := r.GetProductImages(ctx, productID, baseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get images: %w", err)
	}
	product.Images = images

	return &product, nil
}

// ListProducts retrieves products with optional filters
func (r *ProductRepository) ListProducts(ctx context.Context, filter ListProductsFilter, baseURL string) ([]Product, int, error) {
	// Build query with filters
	query := `
		SELECT DISTINCT p.id, p.title, p.description, p.price, p.metadata, p.created_at, p.updated_at
		FROM products p
		LEFT JOIN product_variants pv ON p.id = pv.product_id
		WHERE 1=1
	`
	countQuery := `
		SELECT COUNT(DISTINCT p.id)
		FROM products p
		LEFT JOIN product_variants pv ON p.id = pv.product_id
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	// Apply filters
	if filter.MinPrice != nil {
		query += fmt.Sprintf(" AND p.price >= $%d", argCount)
		countQuery += fmt.Sprintf(" AND p.price >= $%d", argCount)
		args = append(args, *filter.MinPrice)
		argCount++
	}

	if filter.MaxPrice != nil {
		query += fmt.Sprintf(" AND p.price <= $%d", argCount)
		countQuery += fmt.Sprintf(" AND p.price <= $%d", argCount)
		args = append(args, *filter.MaxPrice)
		argCount++
	}

	if filter.Size != nil {
		query += fmt.Sprintf(" AND pv.attributes->>'size' = $%d", argCount)
		countQuery += fmt.Sprintf(" AND pv.attributes->>'size' = $%d", argCount)
		args = append(args, *filter.Size)
		argCount++
	}

	if filter.Color != nil {
		query += fmt.Sprintf(" AND pv.attributes->>'color' = $%d", argCount)
		countQuery += fmt.Sprintf(" AND pv.attributes->>'color' = $%d", argCount)
		args = append(args, *filter.Color)
		argCount++
	}

	// Get total count
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count products: %w", err)
	}

	// Apply sorting
	sortBy := "created_at"
	if filter.SortBy == "price" {
		sortBy = "p.price"
	}
	sortOrder := "DESC"
	if filter.SortOrder == "asc" {
		sortOrder = "ASC"
	}
	query += fmt.Sprintf(" ORDER BY %s %s", sortBy, sortOrder)

	// Apply pagination
	limit := 20
	if filter.Limit > 0 && filter.Limit <= 100 {
		limit = filter.Limit
	}
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, filter.Offset)

	// Execute query
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list products: %w", err)
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var p Product
		err := rows.Scan(&p.ID, &p.Title, &p.Description, &p.Price, &p.Metadata, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan product: %w", err)
		}

		// Get variants for each product
		variants, _ := r.GetProductVariants(ctx, p.ID)
		p.Variants = variants

		// Get images for each product
		images, _ := r.GetProductImages(ctx, p.ID, baseURL)
		p.Images = images

		products = append(products, p)
	}

	return products, total, nil
}

// UpdateProduct updates a product
func (r *ProductRepository) UpdateProduct(ctx context.Context, productID uuid.UUID, input UpdateProductInput) (*Product, error) {
	query := `
		UPDATE products
		SET title = COALESCE($1, title),
			description = COALESCE($2, description),
			price = COALESCE($3, price),
			metadata = COALESCE($4, metadata),
			updated_at = NOW()
		WHERE id = $5
		RETURNING id, title, description, price, metadata, created_at, updated_at
	`

	var product Product
	err := r.db.QueryRowContext(ctx, query, input.Title, input.Description, input.Price, input.Metadata, productID).
		Scan(&product.ID, &product.Title, &product.Description, &product.Price, &product.Metadata, &product.CreatedAt, &product.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	return &product, nil
}

// DeleteProduct deletes a product
func (r *ProductRepository) DeleteProduct(ctx context.Context, productID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM products WHERE id = $1", productID)
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

// GetProductVariants retrieves all variants for a product
func (r *ProductRepository) GetProductVariants(ctx context.Context, productID uuid.UUID) ([]ProductVariant, error) {
	query := `
		SELECT id, product_id, sku, attributes, stock, price_modifier, created_at, updated_at
		FROM product_variants
		WHERE product_id = $1
		ORDER BY created_at
	`

	rows, err := r.db.QueryContext(ctx, query, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get variants: %w", err)
	}
	defer rows.Close()

	variants := []ProductVariant{}
	for rows.Next() {
		var v ProductVariant
		err := rows.Scan(&v.ID, &v.ProductID, &v.SKU, &v.Attributes, &v.Stock, &v.PriceModifier, &v.CreatedAt, &v.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan variant: %w", err)
		}
		variants = append(variants, v)
	}

	return variants, nil
}

// GetProductImages retrieves all images for a product with full URLs
func (r *ProductRepository) GetProductImages(ctx context.Context, productID uuid.UUID, baseURL string) ([]ProductImage, error) {
	query := `
		SELECT id, product_id, path, is_primary, display_order, created_at
		FROM product_images
		WHERE product_id = $1
		ORDER BY display_order, created_at
	`

	rows, err := r.db.QueryContext(ctx, query, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get images: %w", err)
	}
	defer rows.Close()

	images := []ProductImage{}
	for rows.Next() {
		var img ProductImage
		err := rows.Scan(&img.ID, &img.ProductID, &img.Path, &img.IsPrimary, &img.DisplayOrder, &img.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan image: %w", err)
		}

		// Construct full URL
		img.URL = fmt.Sprintf("%s/uploads/%s", baseURL, img.Path)
		images = append(images, img)
	}

	return images, nil
}

// AddProductImage adds an image to a product
func (r *ProductRepository) AddProductImage(ctx context.Context, productID uuid.UUID, path string, isPrimary bool, displayOrder int) (*ProductImage, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// If this is primary, unset other primary images
	if isPrimary {
		_, err = tx.ExecContext(ctx, `
			UPDATE product_images 
			SET is_primary = FALSE 
			WHERE product_id = $1 AND is_primary = TRUE
		`, productID)
		if err != nil {
			return nil, fmt.Errorf("failed to unset primary images: %w", err)
		}
	}

	// Insert new image
	var img ProductImage
	query := `
		INSERT INTO product_images (product_id, path, is_primary, display_order)
		VALUES ($1, $2, $3, $4)
		RETURNING id, product_id, path, is_primary, display_order, created_at
	`

	err = tx.QueryRowContext(ctx, query, productID, path, isPrimary, displayOrder).
		Scan(&img.ID, &img.ProductID, &img.Path, &img.IsPrimary, &img.DisplayOrder, &img.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to add image: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &img, nil
}

// DeleteProductImage deletes a product image
func (r *ProductRepository) DeleteProductImage(ctx context.Context, imageID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM product_images WHERE id = $1", imageID)
	if err != nil {
		return fmt.Errorf("failed to delete image: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("image not found")
	}

	return nil
}
