package handlers

import (
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/ramniya/ramniya-backend/orders"
	"github.com/ramniya/ramniya-backend/razorpay"
	"go.uber.org/zap"
)

// OrderHandler handles order-related endpoints
type OrderHandler struct {
	orderRepo       *orders.OrderRepository
	razorpayService *razorpay.RazorpayService
	logger          *zap.Logger
	razorpayKeyID   string
}

// NewOrderHandler creates a new order handler
func NewOrderHandler(
	orderRepo *orders.OrderRepository,
	razorpayService *razorpay.RazorpayService,
	logger *zap.Logger,
	razorpayKeyID string,
) *OrderHandler {
	return &OrderHandler{
		orderRepo:       orderRepo,
		razorpayService: razorpayService,
		logger:          logger,
		razorpayKeyID:   razorpayKeyID,
	}
}

// CreateOrderRequest represents the checkout request
type CreateOrderRequest struct {
	Items           []orders.OrderItem     `json:"items"`
	ShippingAddress orders.ShippingAddress `json:"shipping_address"`
	PaymentMethod   string                 `json:"payment_method"`
}

// CreateOrderResponse represents the checkout response
type CreateOrderResponse struct {
	OrderID         string `json:"order_id"`
	RazorpayOrderID string `json:"razorpay_order_id"`
	Amount          int    `json:"amount"`
	Currency        string `json:"currency"`
	KeyID           string `json:"key_id"`
}

// CreateOrder handles POST /api/checkout/create-order
func (h *OrderHandler) CreateOrder(c echo.Context) error {
	// Get user ID from context (set by auth middleware)
	userIDStr, ok := c.Get("user_id").(string)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "User not authenticated",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid user ID",
		})
	}

	// Parse request
	var req CreateOrderRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}

	// Validate items
	if len(req.Items) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Cart is empty",
		})
	}

	// Validate shipping address
	if err := validateShippingAddress(req.ShippingAddress); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("Invalid shipping address: %s", err.Error()),
		})
	}

	// Calculate total amount
	totalCents := 0
	for _, item := range req.Items {
		if item.Quantity <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": fmt.Sprintf("Invalid quantity for item: %s", item.Title),
			})
		}
		if item.PriceCents <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": fmt.Sprintf("Invalid price for item: %s", item.Title),
			})
		}
		totalCents += item.PriceCents * item.Quantity
	}

	if totalCents <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid order total",
		})
	}

	// Create order in database
	orderInput := orders.CreateOrderInput{
		UserID:          userID,
		Items:           req.Items,
		ShippingAddress: req.ShippingAddress,
		AmountCents:     totalCents,
		Currency:        "INR",
		PaymentMethod:   req.PaymentMethod,
	}

	order, err := h.orderRepo.CreateOrder(c.Request().Context(), orderInput)
	if err != nil {
		h.logger.Error("Failed to create order",
			zap.String("user_id", userID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to create order",
		})
	}

	// Create Razorpay order
	razorpayReq := razorpay.CreateOrderRequest{
		Amount:   totalCents, // Amount in paise
		Currency: "INR",
		Receipt:  order.ID.String(),
		Notes: map[string]string{
			"order_id": order.ID.String(),
			"user_id":  userID.String(),
		},
		PartialPayment: false,
	}

	razorpayOrder, err := h.razorpayService.CreateOrder(razorpayReq)
	if err != nil {
		h.logger.Error("Failed to create Razorpay order",
			zap.String("order_id", order.ID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to initialize payment",
		})
	}

	// Update order with Razorpay order ID
	if err := h.orderRepo.UpdateOrderRazorpayID(c.Request().Context(), order.ID, razorpayOrder.ID); err != nil {
		h.logger.Error("Failed to update order with Razorpay ID",
			zap.String("order_id", order.ID.String()),
			zap.String("razorpay_order_id", razorpayOrder.ID),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to update order",
		})
	}

	h.logger.Info("Order created successfully",
		zap.String("order_id", order.ID.String()),
		zap.String("razorpay_order_id", razorpayOrder.ID),
		zap.Int("amount", totalCents),
	)

	// Return response for frontend Razorpay Checkout
	response := CreateOrderResponse{
		OrderID:         order.ID.String(),
		RazorpayOrderID: razorpayOrder.ID,
		Amount:          totalCents,
		Currency:        "INR",
		KeyID:           h.razorpayKeyID,
	}

	return c.JSON(http.StatusCreated, response)
}

// VerifyPaymentRequest represents payment verification request
type VerifyPaymentRequest struct {
	OrderID           string `json:"order_id"`
	RazorpayOrderID   string `json:"razorpay_order_id"`
	RazorpayPaymentID string `json:"razorpay_payment_id"`
	RazorpaySignature string `json:"razorpay_signature"`
}

// VerifyPayment handles POST /api/checkout/verify-payment
func (h *OrderHandler) VerifyPayment(c echo.Context) error {
	var req VerifyPaymentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
	}

	// Verify signature
	isValid := h.razorpayService.VerifyPaymentSignature(
		req.RazorpayOrderID,
		req.RazorpayPaymentID,
		req.RazorpaySignature,
	)

	if !isValid {
		h.logger.Warn("Invalid payment signature",
			zap.String("razorpay_order_id", req.RazorpayOrderID),
			zap.String("razorpay_payment_id", req.RazorpayPaymentID),
		)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid payment signature",
		})
	}

	// Parse order ID
	orderID, err := uuid.Parse(req.OrderID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid order ID",
		})
	}

	// Update order status
	updateInput := orders.UpdateOrderStatusInput{
		Status:            orders.OrderStatusPaid,
		RazorpayPaymentID: &req.RazorpayPaymentID,
		RazorpaySignature: &req.RazorpaySignature,
	}

	order, err := h.orderRepo.UpdateOrderStatus(c.Request().Context(), orderID, updateInput)
	if err != nil {
		h.logger.Error("Failed to update order status",
			zap.String("order_id", req.OrderID),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to update order",
		})
	}

	h.logger.Info("Payment verified successfully",
		zap.String("order_id", order.ID.String()),
		zap.String("razorpay_payment_id", req.RazorpayPaymentID),
	)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
		"order":   order,
	})
}

// RazorpayWebhook handles POST /api/webhooks/razorpay
func (h *OrderHandler) RazorpayWebhook(c echo.Context) error {
	// Read raw body for signature verification
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		h.logger.Error("Failed to read webhook body", zap.Error(err))
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Failed to read request body",
		})
	}

	// Get signature from header
	signature := c.Request().Header.Get("X-Razorpay-Signature")
	if signature == "" {
		h.logger.Warn("Missing Razorpay signature header")
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Missing signature",
		})
	}

	// Verify webhook signature
	if !h.razorpayService.VerifyWebhookSignature(body, signature) {
		h.logger.Warn("Invalid webhook signature")
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Invalid signature",
		})
	}

	// Parse webhook payload
	payload, err := razorpay.ParseWebhookPayload(body)
	if err != nil {
		h.logger.Error("Failed to parse webhook payload", zap.Error(err))
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid payload",
		})
	}

	// Extract event ID for idempotency
	eventID := fmt.Sprintf("%s_%d", payload.Event, payload.CreatedAt)

	// Check for duplicate event
	isNew, err := h.orderRepo.RecordWebhookEvent(c.Request().Context(), eventID, payload.Event, body)
	if err != nil {
		h.logger.Error("Failed to record webhook event",
			zap.String("event_id", eventID),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to process webhook",
		})
	}

	if !isNew {
		h.logger.Info("Duplicate webhook event ignored",
			zap.String("event_id", eventID),
			zap.String("event", payload.Event),
		)
		return c.JSON(http.StatusOK, map[string]string{
			"status": "already_processed",
		})
	}

	// Handle different event types
	switch payload.Event {
	case "payment.captured":
		return h.handlePaymentCaptured(c, payload)
	case "payment.failed":
		return h.handlePaymentFailed(c, payload)
	case "order.paid":
		return h.handleOrderPaid(c, payload)
	default:
		h.logger.Info("Unhandled webhook event",
			zap.String("event", payload.Event),
		)
		return c.JSON(http.StatusOK, map[string]string{
			"status": "event_ignored",
		})
	}
}

func (h *OrderHandler) handlePaymentCaptured(c echo.Context, payload *razorpay.WebhookPayload) error {
	payment := payload.Payload.Payment.Entity

	h.logger.Info("Processing payment.captured event",
		zap.String("payment_id", payment.ID),
		zap.String("order_id", payment.OrderID),
		zap.Int("amount", payment.Amount),
	)

	// Get order by Razorpay order ID
	order, err := h.orderRepo.GetOrderByRazorpayOrderID(c.Request().Context(), payment.OrderID)
	if err != nil {
		h.logger.Error("Order not found for payment",
			zap.String("razorpay_order_id", payment.OrderID),
			zap.Error(err),
		)
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Order not found",
		})
	}

	// Update order status to paid
	updateInput := orders.UpdateOrderStatusInput{
		Status:            orders.OrderStatusPaid,
		RazorpayPaymentID: &payment.ID,
	}

	_, err = h.orderRepo.UpdateOrderStatus(c.Request().Context(), order.ID, updateInput)
	if err != nil {
		h.logger.Error("Failed to update order status",
			zap.String("order_id", order.ID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to update order",
		})
	}

	h.logger.Info("Order marked as paid via webhook",
		zap.String("order_id", order.ID.String()),
		zap.String("payment_id", payment.ID),
	)

	return c.JSON(http.StatusOK, map[string]string{
		"status": "success",
	})
}

func (h *OrderHandler) handlePaymentFailed(c echo.Context, payload *razorpay.WebhookPayload) error {
	payment := payload.Payload.Payment.Entity

	h.logger.Info("Processing payment.failed event",
		zap.String("payment_id", payment.ID),
		zap.String("order_id", payment.OrderID),
		zap.String("error", payment.ErrorDescription),
	)

	// Get order by Razorpay order ID
	order, err := h.orderRepo.GetOrderByRazorpayOrderID(c.Request().Context(), payment.OrderID)
	if err != nil {
		h.logger.Error("Order not found for failed payment",
			zap.String("razorpay_order_id", payment.OrderID),
			zap.Error(err),
		)
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Order not found",
		})
	}

	// Update order status to failed
	updateInput := orders.UpdateOrderStatusInput{
		Status:            orders.OrderStatusFailed,
		RazorpayPaymentID: &payment.ID,
	}

	_, err = h.orderRepo.UpdateOrderStatus(c.Request().Context(), order.ID, updateInput)
	if err != nil {
		h.logger.Error("Failed to update order status",
			zap.String("order_id", order.ID.String()),
			zap.Error(err),
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to update order",
		})
	}

	h.logger.Info("Order marked as failed via webhook",
		zap.String("order_id", order.ID.String()),
		zap.String("payment_id", payment.ID),
	)

	return c.JSON(http.StatusOK, map[string]string{
		"status": "success",
	})
}

func (h *OrderHandler) handleOrderPaid(c echo.Context, payload *razorpay.WebhookPayload) error {
	orderEntity := payload.Payload.Order.Entity

	h.logger.Info("Processing order.paid event",
		zap.String("razorpay_order_id", orderEntity.ID),
		zap.Int("amount_paid", orderEntity.AmountPaid),
	)

	// Get order by Razorpay order ID
	order, err := h.orderRepo.GetOrderByRazorpayOrderID(c.Request().Context(), orderEntity.ID)
	if err != nil {
		h.logger.Error("Order not found",
			zap.String("razorpay_order_id", orderEntity.ID),
			zap.Error(err),
		)
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": "Order not found",
		})
	}

	// Only update if not already paid
	if order.Status != orders.OrderStatusPaid {
		updateInput := orders.UpdateOrderStatusInput{
			Status: orders.OrderStatusPaid,
		}

		_, err = h.orderRepo.UpdateOrderStatus(c.Request().Context(), order.ID, updateInput)
		if err != nil {
			h.logger.Error("Failed to update order status",
				zap.String("order_id", order.ID.String()),
				zap.Error(err),
			)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Failed to update order",
			})
		}

		h.logger.Info("Order marked as paid",
			zap.String("order_id", order.ID.String()),
		)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"status": "success",
	})
}

// GetOrder handles GET /api/orders/:id
func (h *OrderHandler) GetOrder(c echo.Context) error {
	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid order ID",
		})
	}

	// Get user ID from context
	userIDStr, ok := c.Get("user_id").(string)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "User not authenticated",
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

	// Verify user owns the order
	if order.UserID.String() != userIDStr {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Access denied",
		})
	}

	return c.JSON(http.StatusOK, order)
}

// ListOrders handles GET /api/orders
func (h *OrderHandler) ListOrders(c echo.Context) error {
	// Get user ID from context
	userIDStr, ok := c.Get("user_id").(string)
	if !ok {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "User not authenticated",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid user ID",
		})
	}

	// Parse query parameters
	filter := orders.ListOrdersFilter{
		UserID: &userID,
	}

	if statusStr := c.QueryParam("status"); statusStr != "" {
		status := orders.OrderStatus(statusStr)
		filter.Status = &status
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

	filter.SortBy = "created_at"
	filter.SortOrder = "desc"

	// Get orders
	ordersList, total, err := h.orderRepo.ListOrders(c.Request().Context(), filter)
	if err != nil {
		h.logger.Error("Failed to list orders",
			zap.String("user_id", userIDStr),
			zap.Error(err),
		)
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

func validateShippingAddress(addr orders.ShippingAddress) error {
	if addr.Name == "" {
		return fmt.Errorf("name is required")
	}
	if addr.Phone == "" {
		return fmt.Errorf("phone is required")
	}
	if addr.Line1 == "" {
		return fmt.Errorf("address line 1 is required")
	}
	if addr.City == "" {
		return fmt.Errorf("city is required")
	}
	if addr.State == "" {
		return fmt.Errorf("state is required")
	}
	if addr.Pincode == "" {
		return fmt.Errorf("pincode is required")
	}
	if addr.Country == "" {
		return fmt.Errorf("country is required")
	}
	return nil
}
