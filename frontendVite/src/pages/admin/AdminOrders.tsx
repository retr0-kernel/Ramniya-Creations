import React, { useEffect, useState } from 'react';
import { Container, Table, Badge, Form, Card, Row, Col, InputGroup } from 'react-bootstrap';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/common/Spinner';
import { formatPrice, formatDateTime, getOrderStatusVariant } from '../../utils/formatters';
import { Order } from '../../types';

const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [selectedStatus, page]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedStatus) params.append('status', selectedStatus);
            params.append('page', page.toString());
            params.append('limit', '20');

            const response = await axios.get(`${API_ENDPOINTS.ADMIN_ORDERS}?${params}`);
            setOrders(response.data.orders || []);

            if (response.data.pagination) {
                setTotalPages(response.data.pagination.total_pages);
            }
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

    const filteredOrders = orders.filter((order) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            order.id.toLowerCase().includes(search) ||
            order.user_id.toLowerCase().includes(search) ||
            order.razorpay_order_id?.toLowerCase().includes(search)
        );
    });

    if (loading && orders.length === 0) return <Spinner fullScreen />;

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif' }}>Manage Orders</h1>
                    <p className="text-muted mb-0">View and manage all customer orders</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">Filter by Status</Form.Label>
                                <Form.Select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="created">Created</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="refunded">Refunded</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={8}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">Search Orders</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.35-4.35" />
                                        </svg>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by Order ID, User ID, or Razorpay Order ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Orders Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Orders Found</h3>
                            <p>No orders match the selected criteria</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table hover>
                                    <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer ID</th>
                                        <th>Date</th>
                                        <th>Items</th>
                                        <th>Amount</th>
                                        <th>Payment ID</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <code className="small">#{order.id.substring(0, 8)}</code>
                                            </td>
                                            <td>
                                                <small className="text-muted">{order.user_id.substring(0, 8)}</small>
                                            </td>
                                            <td>
                                                <small>{formatDateTime(order.created_at)}</small>
                                            </td>
                                            <td>{order.items.length}</td>
                                            <td className="price">{formatPrice(order.amount_cents)}</td>
                                            <td>
                                                {order.razorpay_payment_id ? (
                                                    <code className="small">{order.razorpay_payment_id}</code>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
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
                                                    style={{ width: '140px' }}
                                                    className="border-0"
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <nav>
                                        <ul className="pagination">
                                            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => setPage(page - 1)}>
                                                    Previous
                                                </button>
                                            </li>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = Math.max(1, page - 2) + i;
                                                if (pageNum > totalPages) return null;
                                                return (
                                                    <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setPage(pageNum)}>
                                                            {pageNum}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => setPage(page + 1)}>
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminOrders;
