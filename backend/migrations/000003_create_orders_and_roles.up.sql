-- Add roles to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
CREATE INDEX idx_users_role ON users(role);

COMMENT ON COLUMN users.role IS 'User role: customer, admin';

-- Create orders table
CREATE TABLE orders (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
                        items JSONB NOT NULL,
                        shipping_address JSONB NOT NULL,
                        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
                        currency TEXT NOT NULL DEFAULT 'INR',
                        status TEXT NOT NULL DEFAULT 'created',
                        razorpay_order_id TEXT UNIQUE,
                        razorpay_payment_id TEXT,
                        razorpay_signature TEXT,
                        payment_method TEXT,
                        notes JSONB DEFAULT '{}',
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        paid_at TIMESTAMP WITH TIME ZONE,

                        CONSTRAINT valid_status CHECK (status IN ('created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'))
);

-- Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_razorpay_order_id ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX idx_orders_razorpay_payment_id ON orders(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

-- Create webhook_events table for idempotency
CREATE TABLE webhook_events (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                event_id TEXT UNIQUE NOT NULL,
                                event_type TEXT NOT NULL,
                                payload JSONB NOT NULL,
                                processed BOOLEAN DEFAULT FALSE,
                                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- Trigger to update updated_at on orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- Comments for documentation
COMMENT ON TABLE orders IS 'Customer orders with Razorpay integration';
COMMENT ON COLUMN orders.items IS 'Order items as JSON array: [{"product_id":"uuid","variant_id":"uuid","quantity":1,"price":1000}]';
COMMENT ON COLUMN orders.shipping_address IS 'Shipping address as JSON: {"name":"","phone":"","line1":"","line2":"","city":"","state":"","pincode":""}';
COMMENT ON COLUMN orders.amount_cents IS 'Total amount in paise (1 INR = 100 paise)';
COMMENT ON COLUMN orders.status IS 'Order status: created, pending, paid, failed, cancelled, refunded';
COMMENT ON COLUMN orders.razorpay_order_id IS 'Razorpay order ID from Orders API';
COMMENT ON COLUMN orders.razorpay_payment_id IS 'Razorpay payment ID after successful payment';
COMMENT ON COLUMN orders.razorpay_signature IS 'Razorpay signature for verification';

COMMENT ON TABLE webhook_events IS 'Webhook events for idempotency';
COMMENT ON COLUMN webhook_events.event_id IS 'Unique event ID from webhook provider';
COMMENT ON COLUMN webhook_events.processed IS 'Whether event has been processed';