import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { createOrder, verifyPayment } from '../features/orders/ordersSlice';
import { clearCart } from '../features/cart/cartSlice';
import { validateAddress } from '../utils/validators';
import { formatPrice } from '../utils/formatters';
import { ShippingAddress, RazorpayOptions, RazorpayResponse } from '../types';

const Checkout: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { items, total } = useAppSelector((state) => state.cart);
    const { user } = useAppSelector((state) => state.auth);
    const { loading } = useAppSelector((state) => state.orders);

    const [address, setAddress] = useState<ShippingAddress>({
        name: user?.name || '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
    });

    const [errors, setErrors] = useState<{
        name?: string;
        phone?: string;
        line1?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
    }>({});

    const [processing, setProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
        if (errors[e.target.name as keyof typeof errors]) {
            const newErrors = { ...errors };
            delete newErrors[e.target.name as keyof typeof errors];
            setErrors(newErrors);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate address
        const validationErrors = validateAddress(address);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setProcessing(true);

        try {
            // Create order
            const result = await dispatch(
                createOrder({
                    items,
                    shipping_address: address,
                    payment_method: 'razorpay',
                })
            ).unwrap();

            // Initialize Razorpay
            const options: RazorpayOptions = {
                key: result.key_id,
                amount: result.amount,
                currency: result.currency,
                order_id: result.razorpay_order_id,
                name: 'Ramniya Creations',
                description: 'Order Payment',
                handler: async (response: RazorpayResponse) => {
                    try {
                        // Verify payment
                        await dispatch(
                            verifyPayment({
                                order_id: result.order_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        ).unwrap();

                        // Clear cart and redirect to success page
                        dispatch(clearCart());
                        navigate(`/orders/${result.order_id}`);
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        alert('Payment verification failed. Please contact support.');
                        setProcessing(false);
                    }
                },
                prefill: {
                    name: address.name,
                    email: user?.email,
                    contact: address.phone,
                },
                theme: {
                    color: '#d4af37',
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

            razorpay.on('payment.failed', (response: any) => {
                alert('Payment failed: ' + response.error.description);
                setProcessing(false);
            });
        } catch (error: any) {
            console.error('Order creation failed:', error);
            alert(error.message || 'Failed to create order');
            setProcessing(false);
        }
    };

    if (items.length === 0) {
        navigate('/cart');
        return null;
    }

    const itemsCount = items.reduce((count, item) => count + item.quantity, 0);
    const shippingCost = total > 500000 ? 0 : 10000;
    const tax = Math.round(total * 0.18);
    const grandTotal = total + shippingCost + tax;

    return (
        <Container className="py-4">
            <h1 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Checkout
            </h1>

            <Row>
                <Col lg={8} className="mb-4">
                    <Card>
                        <Card.Body>
                            <h5 className="mb-4">Shipping Address</h5>

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Full Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                value={address.name}
                                                onChange={handleChange}
                                                isInvalid={!!errors.name}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.name}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Phone Number *</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={address.phone}
                                                onChange={handleChange}
                                                isInvalid={!!errors.phone}
                                                placeholder="+91-9876543210"
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.phone}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Address Line 1 *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="line1"
                                                value={address.line1}
                                                onChange={handleChange}
                                                isInvalid={!!errors.line1}
                                                placeholder="House No., Building Name"
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.line1}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Address Line 2</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="line2"
                                                value={address.line2}
                                                onChange={handleChange}
                                                placeholder="Road Name, Area, Colony"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">City *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="city"
                                                value={address.city}
                                                onChange={handleChange}
                                                isInvalid={!!errors.city}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.city}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">State *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="state"
                                                value={address.state}
                                                onChange={handleChange}
                                                isInvalid={!!errors.state}
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.state}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Pincode *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="pincode"
                                                value={address.pincode}
                                                onChange={handleChange}
                                                isInvalid={!!errors.pincode}
                                                placeholder="110001"
                                                required
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.pincode}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Country *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="country"
                                                value={address.country}
                                                onChange={handleChange}
                                                isInvalid={!!errors.country}
                                                required
                                                readOnly
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.country}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    size="lg"
                                    className="w-100 mt-3"
                                    disabled={processing || loading}
                                >
                                    {processing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Proceed to Payment'
                                    )}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="sticky-top" style={{ top: '100px' }}>
                        <Card.Body>
                            <h6 className="mb-3">Order Summary</h6>

                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal ({itemsCount} items)</span>
                                <span>{formatPrice(total)}</span>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span>Shipping</span>
                                <span>
                  {shippingCost === 0 ? (
                      <span className="text-success fw-semibold">FREE</span>
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

                            {/* Payment Method Info */}
                            <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'var(--surface-hover)' }}>
                                <h6 className="mb-2 small">Payment Method</h6>
                                <div className="d-flex align-items-center mb-2">
                                    <img
                                        src="https://razorpay.com/assets/razorpay-glyph.svg"
                                        alt="Razorpay"
                                        style={{ height: '20px', marginRight: '8px' }}
                                    />
                                    <small>Razorpay</small>
                                </div>
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                    UPI, Cards, Net Banking & Wallets
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Checkout;
