import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Table } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchOrderById } from '../features/orders/ordersSlice';
import Spinner from '../components/common/Spinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatPrice, formatDateTime, getOrderStatusVariant } from '../utils/formatters';

const OrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { currentOrder: order, loading, error } = useAppSelector((state) => state.orders);

    useEffect(() => {
        if (id) {
            dispatch(fetchOrderById(id));
        }
    }, [dispatch, id]);

    if (loading) return <Spinner fullScreen />;
    if (error) return <ErrorAlert error={error} />;
    if (!order) return <div className="container py-5">Order not found</div>;

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ fontFamily: 'Playfair Display, serif' }}>Order Details</h1>
                <Link to="/orders">
                    <button className="btn btn-outline-primary">← Back to Orders</button>
                </Link>
            </div>

            <Row>
                <Col lg={8}>
                    <Card className="mb-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5>Order #{order.id.substring(0, 8).toUpperCase()}</h5>
                                    <p className="text-muted mb-0">
                                        Placed on {formatDateTime(order.created_at)}
                                    </p>
                                </div>
                                <Badge bg={getOrderStatusVariant(order.status)} className="p-2">
                                    {order.status.toUpperCase()}
                                </Badge>
                            </div>

                            <hr />

                            <h6 className="mb-3">Order Items</h6>
                            <Table hover responsive>
                                <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {order.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    className="rounded"
                                                />
                                                <span>{item.title}</span>
                                            </div>
                                        </td>
                                        <td><small className="text-muted">{item.sku}</small></td>
                                        <td>{item.quantity}</td>
                                        <td>{formatPrice(item.price_cents)}</td>
                                        <td className="price">{formatPrice(item.price_cents * item.quantity)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Body>
                            <h6 className="mb-3">Shipping Address</h6>
                            <address>
                                <strong>{order.shipping_address.name}</strong><br />
                                {order.shipping_address.line1}<br />
                                {order.shipping_address.line2 && (
                                    <>{order.shipping_address.line2}<br /></>
                                )}
                                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}<br />
                                {order.shipping_address.country}<br />
                                <strong>Phone:</strong> {order.shipping_address.phone}
                            </address>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="mb-3">
                        <Card.Body>
                            <h6 className="mb-3">Order Summary</h6>

                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.amount_cents)}</span>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between mb-3">
                                <strong>Total</strong>
                                <strong className="price">{formatPrice(order.amount_cents)}</strong>
                            </div>

                            {order.status === 'paid' && order.paid_at && (
                                <div className="alert alert-success mb-0">
                                    <small>
                                        <strong>Paid on:</strong><br />
                                        {formatDateTime(order.paid_at)}
                                    </small>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {order.razorpay_payment_id && (
                        <Card>
                            <Card.Body>
                                <h6 className="mb-3">Payment Details</h6>
                                <small className="text-muted d-block mb-1">
                                    <strong>Payment ID:</strong><br />
                                    {order.razorpay_payment_id}
                                </small>
                                <small className="text-muted d-block mb-1">
                                    <strong>Order ID:</strong><br />
                                    {order.razorpay_order_id}
                                </small>
                                <small className="text-muted d-block">
                                    <strong>Method:</strong> {order.payment_method || 'Razorpay'}
                                </small>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default OrderDetail;
