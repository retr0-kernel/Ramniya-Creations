package handlers

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/ramniya/ramniya-backend/orders"
	"go.uber.org/zap"
)

// AdminOrderHandler handles admin order operations
type AdminOrderHandler struct {
	orderRepo *orders.OrderRepository
	logger    *zap.Logger
}

// NewAdminOrderHandler creates a new admin order handler
func NewAdminOrderHandler(orderRepo *orders.OrderRepository, logger *zap.Logger) *AdminOrderHandler {
	return &AdminOrderHandler{
		orderRepo: orderRepo,
		logger:    logger,
	}
}

// ListAllOrders handles GET /api/admin/orders
func (h *AdminOrderHandler) ListAllOrders(c echo.Context) error {
	// Parse query parameters
	filter := orders.ListOrdersFilter{}

	if statusStr := c.QueryParam("status"); statusStr != "" {
		status := orders.OrderStatus(statusStr)
		filter.Status = &status
	}

	if userIDStr := c.QueryParam("user_id"); userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err == nil {
			filter.UserID = &userID
		}
	}

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

	filter.SortBy = c.QueryParam("sort_by")
	if filter.SortBy != "amount_cents" {
		filter.SortBy = "created_at"
	}

	filter.SortOrder = c.QueryParam("sort_order")
	if filter.SortOrder != "asc" {
		filter.SortOrder = "desc"
	}

	// Get orders
	ordersList, total, err := h.orderRepo.ListOrders(c.Request().Context(), filter)
	if err != nil {
		h.logger.Error("Failed to list orders", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to list orders",
		})
	}

	totalPages := (total + limit - 1) / limit

	return c.JSON(http.StatusOK, map[string]interface{}{
		"orders": ordersList,
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

// GetOrderAdmin handles GET /api/admin/orders/:id
func (h *AdminOrderHandler) GetOrderAdmin(c echo.Context) error {
	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid order ID",
		})
	}

	order, err := h.orderRepo.GetOrder(c.Request().Context(), orderID)
	if err != nil {
		if err.Error() == "order not found" {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Order not found",
			})
		}
		h.logger.Error("Failed to get order",
			zap.String("order_id", orderIDStr),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to get order",
		})
	}

	return c.JSON(http.StatusOK, order)
}

// UpdateOrderStatusRequest represents admin order status update
type UpdateOrderStatusRequest struct {
	Status string `json:"status"`
}

// UpdateOrderStatusAdmin handles PUT /api/admin/orders/:id/status
func (h *AdminOrderHandler) UpdateOrderStatusAdmin(c echo.Context) error {
	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid order ID",
		})
	}

	var req UpdateOrderStatusRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}

	// Validate status
	status := orders.OrderStatus(req.Status)
	validStatuses := map[orders.OrderStatus]bool{
		orders.OrderStatusCreated:   true,
		orders.OrderStatusPending:   true,
		orders.OrderStatusPaid:      true,
		orders.OrderStatusFailed:    true,
		orders.OrderStatusCancelled: true,
		orders.OrderStatusRefunded:  true,
	}

	if !validStatuses[status] {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid status",
		})
	}

	// Update order status
	updateInput := orders.UpdateOrderStatusInput{
		Status: status,
	}

	order, err := h.orderRepo.UpdateOrderStatus(c.Request().Context(), orderID, updateInput)
	if err != nil {
		if err.Error() == "order not found" {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Order not found",
			})
		}
		h.logger.Error("Failed to update order status",
			zap.String("order_id", orderIDStr),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to update order",
		})
	}

	h.logger.Info("Order status updated by admin",
		zap.String("order_id", orderID.String()),
		zap.String("new_status", req.Status),
		zap.String("admin_email", c.Get("user_email").(string)),
	)

	return c.JSON(http.StatusOK, order)
}

// GetOrderStats handles GET /api/admin/orders/stats
func (h *AdminOrderHandler) GetOrderStats(c echo.Context) error {
	ctx := c.Request().Context()

	// Get total orders
	_, total, err := h.orderRepo.ListOrders(ctx, orders.ListOrdersFilter{
		Limit: 1,
	})
	if err != nil {
		h.logger.Error("Failed to get order stats", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to get stats",
		})
	}

	// Get paid orders
	paidStatus := orders.OrderStatusPaid
	paidOrders, paidCount, _ := h.orderRepo.ListOrders(ctx, orders.ListOrdersFilter{
		Status: &paidStatus,
		Limit:  1000,
	})

	// Get pending orders
	pendingStatus := orders.OrderStatusPending
	_, pendingCount, _ := h.orderRepo.ListOrders(ctx, orders.ListOrdersFilter{
		Status: &pendingStatus,
		Limit:  1,
	})

	// Get failed orders
	failedStatus := orders.OrderStatusFailed
	_, failedCount, _ := h.orderRepo.ListOrders(ctx, orders.ListOrdersFilter{
		Status: &failedStatus,
		Limit:  1,
	})

	// Calculate total revenue
	totalRevenue := 0
	for _, order := range paidOrders {
		totalRevenue += order.AmountCents
	}

	stats := map[string]interface{}{
		"total_orders":   total,
		"paid_orders":    paidCount,
		"pending_orders": pendingCount,
		"failed_orders":  failedCount,
		"total_revenue":  totalRevenue,
		"currency":       "INR",
	}

	return c.JSON(http.StatusOK, stats)
}
