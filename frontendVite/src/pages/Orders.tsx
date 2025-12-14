import React, { useEffect } from 'react';
import { Container, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchOrders } from '../features/orders/ordersSlice';
import Spinner from '../components/common/Spinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatPrice, formatDateTime, getOrderStatusVariant } from '../utils/formatters';

const Orders: React.FC = () => {
    const dispatch = useAppDispatch();
    const { orders, loading, error } = useAppSelector((state) => state.orders);

    useEffect(() => {
        dispatch(fetchOrders({ page: 1, limit: 20 }));
    }, [dispatch]);

    if (loading) return <Spinner fullScreen />;

    return (
        <Container className="py-4">
            <h1 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                My Orders
            </h1>

            {error && <ErrorAlert error={error} />}

            {orders.length === 0 ? (
                <div className="empty-state">
                    <h3>No Orders Yet</h3>
                    <p>Start shopping to see your orders here</p>
                    <Link to="/products">
                        <button className="btn btn-primary btn-lg mt-3">
                            Browse Products
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="table-responsive">
                    <Table hover>
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>
                                    <small className="text-muted">
                                        #{order.id.substring(0, 8)}
                                    </small>
                                </td>
                                <td>{formatDateTime(order.created_at)}</td>
                                <td>{order.items.length} item(s)</td>
                                <td className="price">{formatPrice(order.amount_cents)}</td>
                                <td>
                                    <Badge bg={getOrderStatusVariant(order.status)}>
                                        {order.status.toUpperCase()}
                                    </Badge>
                                </td>
                                <td>
                                    <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-primary">
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </Container>
    );
};

export default Orders;
