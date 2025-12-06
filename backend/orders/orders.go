package orders

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// OrderStatus represents possible order states
type OrderStatus string

const (
	OrderStatusCreated   OrderStatus = "created"
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusFailed    OrderStatus = "failed"
	OrderStatusCancelled OrderStatus = "cancelled"
	OrderStatusRefunded  OrderStatus = "refunded"
)

// OrderItem represents a single item in an order
type OrderItem struct {
	ProductID  uuid.UUID `json:"product_id"`
	VariantID  uuid.UUID `json:"variant_id,omitempty"`
	Title      string    `json:"title"`
	SKU        string    `json:"sku,omitempty"`
	Quantity   int       `json:"quantity"`
	PriceCents int       `json:"price_cents"`
	ImageURL   string    `json:"image_url,omitempty"`
}

// ShippingAddress represents delivery address
type ShippingAddress struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Line1   string `json:"line1"`
	Line2   string `json:"line2,omitempty"`
	City    string `json:"city"`
	State   string `json:"state"`
	Pincode string `json:"pincode"`
	Country string `json:"country"`
}

// Order represents a customer order
type Order struct {
	ID                uuid.UUID       `json:"id"`
	UserID            uuid.UUID       `json:"user_id"`
	Items             []OrderItem     `json:"items"`
	ShippingAddress   ShippingAddress `json:"shipping_address"`
	AmountCents       int             `json:"amount_cents"`
	Currency          string          `json:"currency"`
	Status            OrderStatus     `json:"status"`
	RazorpayOrderID   *string         `json:"razorpay_order_id,omitempty"`
	RazorpayPaymentID *string         `json:"razorpay_payment_id,omitempty"`
	RazorpaySignature *string         `json:"razorpay_signature,omitempty"`
	PaymentMethod     *string         `json:"payment_method,omitempty"`
	Notes             json.RawMessage `json:"notes,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	PaidAt            *time.Time      `json:"paid_at,omitempty"`
}

// CreateOrderInput represents input for creating an order
type CreateOrderInput struct {
	UserID          uuid.UUID       `json:"user_id"`
	Items           []OrderItem     `json:"items"`
	ShippingAddress ShippingAddress `json:"shipping_address"`
	AmountCents     int             `json:"amount_cents"`
	Currency        string          `json:"currency"`
	PaymentMethod   string          `json:"payment_method"`
}

// UpdateOrderStatusInput represents input for updating order status
type UpdateOrderStatusInput struct {
	Status            OrderStatus `json:"status"`
	RazorpayPaymentID *string     `json:"razorpay_payment_id,omitempty"`
	RazorpaySignature *string     `json:"razorpay_signature,omitempty"`
}

// ListOrdersFilter represents filters for listing orders
type ListOrdersFilter struct {
	UserID    *uuid.UUID
	Status    *OrderStatus
	Limit     int
	Offset    int
	SortBy    string // "created_at", "amount_cents"
	SortOrder string // "asc", "desc"
}

// OrderRepository handles order database operations
type OrderRepository struct {
	db *sql.DB
}

// NewOrderRepository creates a new order repository
func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

// CreateOrder creates a new order
func (r *OrderRepository) CreateOrder(ctx context.Context, input CreateOrderInput) (*Order, error) {
	itemsJSON, err := json.Marshal(input.Items)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal items: %w", err)
	}

	addressJSON, err := json.Marshal(input.ShippingAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal address: %w", err)
	}

	query := `
		INSERT INTO orders (user_id, items, shipping_address, amount_cents, currency, payment_method, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, user_id, items, shipping_address, amount_cents, currency, status, 
		          payment_method, notes, created_at, updated_at
	`

	var order Order
	var itemsData, addressData, notesData []byte

	err = r.db.QueryRowContext(
		ctx, query,
		input.UserID, itemsJSON, addressJSON, input.AmountCents, input.Currency, input.PaymentMethod, OrderStatusCreated,
	).Scan(
		&order.ID, &order.UserID, &itemsData, &addressData, &order.AmountCents, &order.Currency,
		&order.Status, &order.PaymentMethod, &notesData, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	if err := json.Unmarshal(itemsData, &order.Items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal items: %w", err)
	}

	if err := json.Unmarshal(addressData, &order.ShippingAddress); err != nil {
		return nil, fmt.Errorf("failed to unmarshal address: %w", err)
	}

	if len(notesData) > 0 {
		order.Notes = notesData
	}

	return &order, nil
}

// GetOrder retrieves an order by ID
func (r *OrderRepository) GetOrder(ctx context.Context, orderID uuid.UUID) (*Order, error) {
	query := `
		SELECT id, user_id, items, shipping_address, amount_cents, currency, status,
		       razorpay_order_id, razorpay_payment_id, razorpay_signature, 
		       payment_method, notes, created_at, updated_at, paid_at
		FROM orders
		WHERE id = $1
	`

	var order Order
	var itemsData, addressData, notesData []byte

	err := r.db.QueryRowContext(ctx, query, orderID).Scan(
		&order.ID, &order.UserID, &itemsData, &addressData, &order.AmountCents, &order.Currency,
		&order.Status, &order.RazorpayOrderID, &order.RazorpayPaymentID, &order.RazorpaySignature,
		&order.PaymentMethod, &notesData, &order.CreatedAt, &order.UpdatedAt, &order.PaidAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	if err := json.Unmarshal(itemsData, &order.Items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal items: %w", err)
	}

	if err := json.Unmarshal(addressData, &order.ShippingAddress); err != nil {
		return nil, fmt.Errorf("failed to unmarshal address: %w", err)
	}

	if len(notesData) > 0 {
		order.Notes = notesData
	}

	return &order, nil
}

// GetOrderByRazorpayOrderID retrieves an order by Razorpay order ID
func (r *OrderRepository) GetOrderByRazorpayOrderID(ctx context.Context, razorpayOrderID string) (*Order, error) {
	query := `
		SELECT id, user_id, items, shipping_address, amount_cents, currency, status,
		       razorpay_order_id, razorpay_payment_id, razorpay_signature,
		       payment_method, notes, created_at, updated_at, paid_at
		FROM orders
		WHERE razorpay_order_id = $1
	`

	var order Order
	var itemsData, addressData, notesData []byte

	err := r.db.QueryRowContext(ctx, query, razorpayOrderID).Scan(
		&order.ID, &order.UserID, &itemsData, &addressData, &order.AmountCents, &order.Currency,
		&order.Status, &order.RazorpayOrderID, &order.RazorpayPaymentID, &order.RazorpaySignature,
		&order.PaymentMethod, &notesData, &order.CreatedAt, &order.UpdatedAt, &order.PaidAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	if err := json.Unmarshal(itemsData, &order.Items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal items: %w", err)
	}

	if err := json.Unmarshal(addressData, &order.ShippingAddress); err != nil {
		return nil, fmt.Errorf("failed to unmarshal address: %w", err)
	}

	if len(notesData) > 0 {
		order.Notes = notesData
	}

	return &order, nil
}

// UpdateOrderRazorpayID updates the Razorpay order ID
func (r *OrderRepository) UpdateOrderRazorpayID(ctx context.Context, orderID uuid.UUID, razorpayOrderID string) error {
	query := `
		UPDATE orders
		SET razorpay_order_id = $1, status = $2, updated_at = NOW()
		WHERE id = $3
	`

	result, err := r.db.ExecContext(ctx, query, razorpayOrderID, OrderStatusPending, orderID)
	if err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// UpdateOrderStatus updates the order status and payment details
func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, input UpdateOrderStatusInput) (*Order, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		UPDATE orders
		SET status = $1,
		    razorpay_payment_id = COALESCE($2, razorpay_payment_id),
		    razorpay_signature = COALESCE($3, razorpay_signature),
		    paid_at = CASE WHEN $1 = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
		    updated_at = NOW()
		WHERE id = $4
		RETURNING id, user_id, items, shipping_address, amount_cents, currency, status,
		          razorpay_order_id, razorpay_payment_id, razorpay_signature,
		          payment_method, notes, created_at, updated_at, paid_at
	`

	var order Order
	var itemsData, addressData, notesData []byte

	err = tx.QueryRowContext(ctx, query, input.Status, input.RazorpayPaymentID, input.RazorpaySignature, orderID).Scan(
		&order.ID, &order.UserID, &itemsData, &addressData, &order.AmountCents, &order.Currency,
		&order.Status, &order.RazorpayOrderID, &order.RazorpayPaymentID, &order.RazorpaySignature,
		&order.PaymentMethod, &notesData, &order.CreatedAt, &order.UpdatedAt, &order.PaidAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update order: %w", err)
	}

	if err := json.Unmarshal(itemsData, &order.Items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal items: %w", err)
	}

	if err := json.Unmarshal(addressData, &order.ShippingAddress); err != nil {
		return nil, fmt.Errorf("failed to unmarshal address: %w", err)
	}

	if len(notesData) > 0 {
		order.Notes = notesData
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &order, nil
}

// ListOrders retrieves orders with optional filters
func (r *OrderRepository) ListOrders(ctx context.Context, filter ListOrdersFilter) ([]Order, int, error) {
	query := `
		SELECT id, user_id, items, shipping_address, amount_cents, currency, status,
		       razorpay_order_id, razorpay_payment_id, razorpay_signature,
		       payment_method, notes, created_at, updated_at, paid_at
		FROM orders
		WHERE 1=1
	`
	countQuery := `
		SELECT COUNT(*)
		FROM orders
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if filter.UserID != nil {
		query += fmt.Sprintf(" AND user_id = $%d", argCount)
		countQuery += fmt.Sprintf(" AND user_id = $%d", argCount)
		args = append(args, *filter.UserID)
		argCount++
	}

	if filter.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argCount)
		countQuery += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, *filter.Status)
		argCount++
	}

	// Get total count
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count orders: %w", err)
	}

	// Apply sorting
	sortBy := "created_at"
	if filter.SortBy == "amount_cents" {
		sortBy = "amount_cents"
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
		return nil, 0, fmt.Errorf("failed to list orders: %w", err)
	}
	defer rows.Close()

	orders := []Order{}
	for rows.Next() {
		var o Order
		var itemsData, addressData, notesData []byte

		err := rows.Scan(
			&o.ID, &o.UserID, &itemsData, &addressData, &o.AmountCents, &o.Currency,
			&o.Status, &o.RazorpayOrderID, &o.RazorpayPaymentID, &o.RazorpaySignature,
			&o.PaymentMethod, &notesData, &o.CreatedAt, &o.UpdatedAt, &o.PaidAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan order: %w", err)
		}

		if err := json.Unmarshal(itemsData, &o.Items); err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal items: %w", err)
		}

		if err := json.Unmarshal(addressData, &o.ShippingAddress); err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal address: %w", err)
		}

		if len(notesData) > 0 {
			o.Notes = notesData
		}

		orders = append(orders, o)
	}

	return orders, total, nil
}

// RecordWebhookEvent records a webhook event for idempotency
func (r *OrderRepository) RecordWebhookEvent(ctx context.Context, eventID, eventType string, payload json.RawMessage) (bool, error) {
	// Check if event already exists
	var exists bool
	err := r.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM webhook_events WHERE event_id = $1)", eventID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check webhook event: %w", err)
	}

	if exists {
		return false, nil // Already processed
	}

	// Insert new event
	query := `
		INSERT INTO webhook_events (event_id, event_type, payload, processed)
		VALUES ($1, $2, $3, TRUE)
	`

	_, err = r.db.ExecContext(ctx, query, eventID, eventType, payload)
	if err != nil {
		return false, fmt.Errorf("failed to record webhook event: %w", err)
	}

	return true, nil
}
