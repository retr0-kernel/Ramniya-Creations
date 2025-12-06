package razorpay

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

const (
	RazorpayAPIURL = "https://api.razorpay.com/v1"
)

// RazorpayConfig holds Razorpay credentials
type RazorpayConfig struct {
	KeyID     string
	KeySecret string
}

// RazorpayService handles Razorpay API interactions
type RazorpayService struct {
	config     RazorpayConfig
	httpClient *http.Client
	logger     *zap.Logger
}

// NewRazorpayService creates a new Razorpay service
func NewRazorpayService(config RazorpayConfig, logger *zap.Logger) *RazorpayService {
	return &RazorpayService{
		config: config,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

// CreateOrderRequest represents the request to create a Razorpay order
type CreateOrderRequest struct {
	Amount         int               `json:"amount"`          // Amount in paise
	Currency       string            `json:"currency"`        // INR, USD, etc.
	Receipt        string            `json:"receipt"`         // Unique receipt ID
	Notes          map[string]string `json:"notes,omitempty"` // Additional notes
	PartialPayment bool              `json:"partial_payment"` // Allow partial payment
}

// CreateOrderResponse represents the Razorpay order creation response
type CreateOrderResponse struct {
	ID         string            `json:"id"`
	Entity     string            `json:"entity"`
	Amount     int               `json:"amount"`
	AmountPaid int               `json:"amount_paid"`
	AmountDue  int               `json:"amount_due"`
	Currency   string            `json:"currency"`
	Receipt    string            `json:"receipt"`
	Status     string            `json:"status"`
	Attempts   int               `json:"attempts"`
	Notes      map[string]string `json:"notes"`
	CreatedAt  int64             `json:"created_at"`
}

// CreateOrder creates a new Razorpay order
func (s *RazorpayService) CreateOrder(req CreateOrderRequest) (*CreateOrderResponse, error) {
	// Prepare request body
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequest("POST", fmt.Sprintf("%s/orders", RazorpayAPIURL), bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.SetBasicAuth(s.config.KeyID, s.config.KeySecret)

	// Send request
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		s.logger.Error("Razorpay API error",
			zap.Int("status_code", resp.StatusCode),
			zap.String("response", string(respBody)),
		)
		return nil, fmt.Errorf("razorpay API error: status %d, response: %s", resp.StatusCode, string(respBody))
	}

	// Parse response
	var orderResp CreateOrderResponse
	if err := json.Unmarshal(respBody, &orderResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	s.logger.Info("Razorpay order created",
		zap.String("order_id", orderResp.ID),
		zap.Int("amount", orderResp.Amount),
		zap.String("currency", orderResp.Currency),
	)

	return &orderResp, nil
}

// VerifyPaymentSignature verifies the Razorpay payment signature
func (s *RazorpayService) VerifyPaymentSignature(orderID, paymentID, signature string) bool {
	// Create signature string: order_id|payment_id
	message := fmt.Sprintf("%s|%s", orderID, paymentID)

	// Calculate HMAC SHA256
	h := hmac.New(sha256.New, []byte(s.config.KeySecret))
	h.Write([]byte(message))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	// Compare signatures
	isValid := hmac.Equal([]byte(expectedSignature), []byte(signature))

	if isValid {
		s.logger.Info("Payment signature verified",
			zap.String("order_id", orderID),
			zap.String("payment_id", paymentID),
		)
	} else {
		s.logger.Warn("Invalid payment signature",
			zap.String("order_id", orderID),
			zap.String("payment_id", paymentID),
			zap.String("expected", expectedSignature),
			zap.String("received", signature),
		)
	}

	return isValid
}

// VerifyWebhookSignature verifies the Razorpay webhook signature
func (s *RazorpayService) VerifyWebhookSignature(payload []byte, signature string) bool {
	// Calculate HMAC SHA256 of payload
	h := hmac.New(sha256.New, []byte(s.config.KeySecret))
	h.Write(payload)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	// Compare signatures
	isValid := hmac.Equal([]byte(expectedSignature), []byte(signature))

	if isValid {
		s.logger.Info("Webhook signature verified")
	} else {
		s.logger.Warn("Invalid webhook signature",
			zap.String("expected", expectedSignature),
			zap.String("received", signature),
		)
	}

	return isValid
}

// WebhookPayload represents the Razorpay webhook payload
type WebhookPayload struct {
	Entity    string             `json:"entity"`
	Account   string             `json:"account_id"`
	Event     string             `json:"event"`
	Contains  []string           `json:"contains"`
	Payload   WebhookPayloadData `json:"payload"`
	CreatedAt int64              `json:"created_at"`
}

// WebhookPayloadData contains the actual payment data
type WebhookPayloadData struct {
	Payment WebhookPaymentData `json:"payment"`
	Order   WebhookOrderData   `json:"order"`
}

// WebhookPaymentData represents payment information in webhook
type WebhookPaymentData struct {
	Entity PaymentEntity `json:"entity"`
}

// WebhookOrderData represents order information in webhook
type WebhookOrderData struct {
	Entity OrderEntity `json:"entity"`
}

// PaymentEntity represents a Razorpay payment
type PaymentEntity struct {
	ID               string            `json:"id"`
	Entity           string            `json:"entity"`
	Amount           int               `json:"amount"`
	Currency         string            `json:"currency"`
	Status           string            `json:"status"`
	OrderID          string            `json:"order_id"`
	InvoiceID        string            `json:"invoice_id,omitempty"`
	International    bool              `json:"international"`
	Method           string            `json:"method"`
	AmountRefunded   int               `json:"amount_refunded"`
	RefundStatus     string            `json:"refund_status,omitempty"`
	Captured         bool              `json:"captured"`
	Description      string            `json:"description,omitempty"`
	CardID           string            `json:"card_id,omitempty"`
	Bank             string            `json:"bank,omitempty"`
	Wallet           string            `json:"wallet,omitempty"`
	VPA              string            `json:"vpa,omitempty"`
	Email            string            `json:"email"`
	Contact          string            `json:"contact"`
	Notes            map[string]string `json:"notes"`
	Fee              int               `json:"fee,omitempty"`
	Tax              int               `json:"tax,omitempty"`
	ErrorCode        string            `json:"error_code,omitempty"`
	ErrorDescription string            `json:"error_description,omitempty"`
	CreatedAt        int64             `json:"created_at"`
}

// OrderEntity represents a Razorpay order
type OrderEntity struct {
	ID         string            `json:"id"`
	Entity     string            `json:"entity"`
	Amount     int               `json:"amount"`
	AmountPaid int               `json:"amount_paid"`
	AmountDue  int               `json:"amount_due"`
	Currency   string            `json:"currency"`
	Receipt    string            `json:"receipt"`
	Status     string            `json:"status"`
	Attempts   int               `json:"attempts"`
	Notes      map[string]string `json:"notes"`
	CreatedAt  int64             `json:"created_at"`
}

// ParseWebhookPayload parses the webhook payload
func ParseWebhookPayload(body []byte) (*WebhookPayload, error) {
	var payload WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("failed to parse webhook payload: %w", err)
	}
	return &payload, nil
}
