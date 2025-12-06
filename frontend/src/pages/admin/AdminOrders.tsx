import React, { useEffect, useState } from 'react';
import { Container, Table, Badge, Form } from 'react-bootstrap';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/common/Spinner';
import { formatPrice, formatDateTime, getOrderStatusVariant } from '../../utils/formatters';
import { Order } from '../../types';

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [selectedStatus]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedStatus) params.append('status', selectedStatus);
            params.append('page', '1');
            params.append('limit', '50');

            const response = await axios.get(`${API_ENDPOINTS.ADMIN_ORDERS}?${params}`);
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await axios.put(API_ENDPOINTS.ADMIN_ORDER_STATUS(orderId), {
                status: newStatus,
            });
            fetchOrders();
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Failed to update order status');
        }
    };

    if (loading) return <Spinner fullScreen />;

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ fontFamily: 'Playfair Display, serif' }}>Manage Orders</h1>

                <Form.Select
                    style={{ width: '200px' }}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="created">Created</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                </Form.Select>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <h3>No Orders Found</h3>
                    <p>No orders match the selected criteria</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <Table hover>
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
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
                                    <small className="text-muted">#{order.id.substring(0, 8)}</small>
                                </td>
                                <td>
                                    <small>{order.user_id.substring(0, 8)}</small>
                                </td>
                                <td>{formatDateTime(order.created_at)}</td>
                                <td>{order.items.length}</td>
                                <td className="price">{formatPrice(order.amount_cents)}</td>
                                <td>
                                    <Badge bg={getOrderStatusVariant(order.status)}>
                                        {order.status.toUpperCase()}
                                    </Badge>
                                </td>
                                <td>
                                    <Form.Select
                                        size="sm"
                                        value={order.status}
                                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                        style={{ width: '150px' }}
                                    >
                                        <option value="created">Created</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                    </Form.Select>
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

export default AdminOrders;