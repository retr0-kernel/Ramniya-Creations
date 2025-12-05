package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/ramniya/ramniya-backend/products"
	"github.com/ramniya/ramniya-backend/upload"
	"go.uber.org/zap"
)

// ProductHandler handles product-related endpoints
type ProductHandler struct {
	productRepo   *products.ProductRepository
	uploadService *upload.UploadService
	logger        *zap.Logger
	baseURL       string
}

// NewProductHandler creates a new product handler
func NewProductHandler(
	productRepo *products.ProductRepository,
	uploadService *upload.UploadService,
	logger *zap.Logger,
	baseURL string,
) *ProductHandler {
	return &ProductHandler{
		productRepo:   productRepo,
		uploadService: uploadService,
		logger:        logger,
		baseURL:       baseURL,
	}
}

// CreateProduct handles POST /api/admin/products
func (h *ProductHandler) CreateProduct(c echo.Context) error {
	var input products.CreateProductInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}

	// Validate input
	if input.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Title is required",
		})
	}

	if input.Price <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Price must be greater than 0",
		})
	}

	// Validate variants
	if len(input.Variants) > 0 {
		skuMap := make(map[string]bool)
		for i, v := range input.Variants {
			if v.SKU == "" {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": fmt.Sprintf("Variant %d: SKU is required", i),
				})
			}
			if skuMap[v.SKU] {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": fmt.Sprintf("Duplicate SKU: %s", v.SKU),
				})
			}
			skuMap[v.SKU] = true

			if v.Stock < 0 {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": fmt.Sprintf("Variant %d: Stock cannot be negative", i),
				})
			}
		}
	}

	// Create product
	product, err := h.productRepo.CreateProduct(c.Request().Context(), input)
	if err != nil {
		h.logger.Error("Failed to create product",
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to create product",
		})
	}

	h.logger.Info("Product created successfully",
		zap.String("product_id", product.ID.String()),
		zap.String("title", product.Title),
	)

	return c.JSON(http.StatusCreated, product)
}

// UploadProductImages handles POST /api/admin/products/:id/images
func (h *ProductHandler) UploadProductImages(c echo.Context) error {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid product ID",
		})
	}

	// Verify product exists
	_, err = h.productRepo.GetProduct(c.Request().Context(), productID, h.baseURL)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Product not found",
		})
	}

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid multipart form",
		})
	}

	files := form.File["images"]
	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "No images provided",
		})
	}

	// Limit number of images per request
	if len(files) > 10 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Maximum 10 images per request",
		})
	}

	// Get is_primary and display_order from form
	isPrimaryStr := c.FormValue("is_primary")
	isPrimary := isPrimaryStr == "true"

	uploadedImages := []products.ProductImage{}
	errors := []string{}

	for i, fileHeader := range files {
		// Upload file
		result, err := h.uploadService.SaveFile(fileHeader)
		if err != nil {
			h.logger.Error("Failed to upload file",
				zap.String("filename", fileHeader.Filename),
				zap.Error(err),
			)
			errors = append(errors, fmt.Sprintf("%s: %s", fileHeader.Filename, err.Error()))
			continue
		}

		// Add image to database
		displayOrder := i
		// Only first image can be primary if is_primary is true
		isThisPrimary := isPrimary && i == 0

		img, err := h.productRepo.AddProductImage(
			c.Request().Context(),
			productID,
			result.Path,
			isThisPrimary,
			displayOrder,
		)
		if err != nil {
			h.logger.Error("Failed to add image to database",
				zap.String("path", result.Path),
				zap.Error(err),
			)
			// Try to clean up uploaded file
			h.uploadService.DeleteFile(result.Path)
			errors = append(errors, fmt.Sprintf("%s: failed to save to database", fileHeader.Filename))
			continue
		}

		// Construct full URL
		img.URL = fmt.Sprintf("%s/uploads/%s", h.baseURL, img.Path)
		uploadedImages = append(uploadedImages, *img)

		h.logger.Info("Image uploaded successfully",
			zap.String("product_id", productID.String()),
			zap.String("path", result.Path),
			zap.Int64("size", result.Size),
		)
	}

	response := map[string]interface{}{
		"uploaded": uploadedImages,
		"count":    len(uploadedImages),
	}

	if len(errors) > 0 {
		response["errors"] = errors
		response["error_count"] = len(errors)
	}

	statusCode := http.StatusCreated
	if len(uploadedImages) == 0 {
		statusCode = http.StatusBadRequest
		response["message"] = "No images were uploaded successfully"
	} else if len(errors) > 0 {
		statusCode = http.StatusPartialContent
		response["message"] = "Some images failed to upload"
	}

	return c.JSON(statusCode, response)
}

// ListProducts handles GET /api/products
func (h *ProductHandler) ListProducts(c echo.Context) error {
	// Parse query parameters
	var filter products.ListProductsFilter

	// Price filters
	if minPriceStr := c.QueryParam("min_price"); minPriceStr != "" {
		minPrice, err := strconv.ParseFloat(minPriceStr, 64)
		if err == nil && minPrice >= 0 {
			filter.MinPrice = &minPrice
		}
	}

	if maxPriceStr := c.QueryParam("max_price"); maxPriceStr != "" {
		maxPrice, err := strconv.ParseFloat(maxPriceStr, 64)
		if err == nil && maxPrice >= 0 {
			filter.MaxPrice = &maxPrice
		}
	}

	// Attribute filters
	if size := c.QueryParam("size"); size != "" {
		filter.Size = &size
	}

	if color := c.QueryParam("color"); color != "" {
		filter.Color = &color
	}

	// Pagination
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	filter.Limit = limit

	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	filter.Offset = (page - 1) * limit

	// Sorting
	filter.SortBy = c.QueryParam("sort_by")
	if filter.SortBy != "price" && filter.SortBy != "created_at" {
		filter.SortBy = "created_at"
	}

	filter.SortOrder = c.QueryParam("sort_order")
	if filter.SortOrder != "asc" && filter.SortOrder != "desc" {
		filter.SortOrder = "desc"
	}

	// Get products
	productsList, total, err := h.productRepo.ListProducts(c.Request().Context(), filter, h.baseURL)
	if err != nil {
		h.logger.Error("Failed to list products",
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to list products",
		})
	}

	// Calculate pagination metadata
	totalPages := (total + limit - 1) / limit

	return c.JSON(http.StatusOK, map[string]interface{}{
		"products": productsList,
		"pagination": map[string]interface{}{
			"total":        total,
			"page":         page,
			"limit":        limit,
			"total_pages":  totalPages,
			"has_next":     page < totalPages,
			"has_previous": page > 1,
		},
	})
}

// GetProduct handles GET /api/products/:id
func (h *ProductHandler) GetProduct(c echo.Context) error {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid product ID",
		})
	}

	product, err := h.productRepo.GetProduct(c.Request().Context(), productID, h.baseURL)
	if err != nil {
		if err.Error() == "product not found" {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Product not found",
			})
		}

		h.logger.Error("Failed to get product",
			zap.String("product_id", productID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to get product",
		})
	}

	return c.JSON(http.StatusOK, product)
}

// UpdateProduct handles PUT /api/admin/products/:id
func (h *ProductHandler) UpdateProduct(c echo.Context) error {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid product ID",
		})
	}

	var input products.UpdateProductInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}

	// Validate price if provided
	if input.Price != nil && *input.Price <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Price must be greater than 0",
		})
	}

	product, err := h.productRepo.UpdateProduct(c.Request().Context(), productID, input)
	if err != nil {
		if err.Error() == "product not found" {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Product not found",
			})
		}

		h.logger.Error("Failed to update product",
			zap.String("product_id", productID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to update product",
		})
	}

	h.logger.Info("Product updated successfully",
		zap.String("product_id", product.ID.String()),
	)

	return c.JSON(http.StatusOK, product)
}

// DeleteProduct handles DELETE /api/admin/products/:id
func (h *ProductHandler) DeleteProduct(c echo.Context) error {
	productIDStr := c.Param("id")
	productID, err := uuid.Parse(productIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid product ID",
		})
	}

	// Get product images before deletion
	images, _ := h.productRepo.GetProductImages(c.Request().Context(), productID, h.baseURL)

	// Delete product (cascades to variants and images in DB)
	err = h.productRepo.DeleteProduct(c.Request().Context(), productID)
	if err != nil {
		if err.Error() == "product not found" {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Product not found",
			})
		}

		h.logger.Error("Failed to delete product",
			zap.String("product_id", productID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to delete product",
		})
	}

	// Delete associated image files
	for _, img := range images {
		if err := h.uploadService.DeleteFile(img.Path); err != nil {
			h.logger.Warn("Failed to delete image file",
				zap.String("path", img.Path),
				zap.Error(err),
			)
		}
	}

	h.logger.Info("Product deleted successfully",
		zap.String("product_id", productID.String()),
	)

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Product deleted successfully",
	})
}
