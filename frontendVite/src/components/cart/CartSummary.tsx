import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { formatPrice } from '../../utils/formatters';

interface CartSummaryProps {
    total: number;
    itemsCount: number;
    onCheckout: () => void;
    loading?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
                                                     total,
                                                     itemsCount,
                                                     onCheckout,
                                                     loading = false,
                                                 }) => {
    const shippingCost = total > 500000 ? 0 : 10000; // Free shipping over ₹5000
    const tax = Math.round(total * 0.18); // 18% GST
    const grandTotal = total + shippingCost + tax;

    return (
        <Card className="sticky-top" style={{ top: '100px' }}>
            <Card.Body>
                <h5 className="mb-4">Order Summary</h5>

                <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal ({itemsCount} items)</span>
                    <span>{formatPrice(total)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>Shipping</span>
                    <span>
            {shippingCost === 0 ? (
                <span className="text-success">FREE</span>
            ) : (
                formatPrice(shippingCost)
            )}
          </span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                    <span>Tax (GST 18%)</span>
                    <span>{formatPrice(tax)}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-3">
                    <strong>Total</strong>
                    <strong className="price">{formatPrice(grandTotal)}</strong>
                </div>

                {shippingCost > 0 && (
                    <small className="text-muted d-block mb-3">
                        Add {formatPrice(500000 - total)} more for free shipping
                    </small>
                )}

                <Button
                    variant="primary"
                    className="w-100"
                    size="lg"
                    onClick={onCheckout}
                    disabled={loading || itemsCount === 0}
                >
                    {loading ? 'Processing...' : 'Proceed to Checkout'}
                </Button>
            </Card.Body>
        </Card>
    );
};

export default CartSummary;
