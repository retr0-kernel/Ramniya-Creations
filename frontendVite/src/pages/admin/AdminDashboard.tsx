import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface OrderStats {
    total_orders: number;
    paid_orders: number;
    pending_orders: number;
    failed_orders: number;
    total_revenue: number;
    today_revenue: number;
    week_revenue: number;
    month_revenue: number;
}

interface RecentOrder {
    id: string;
    user_email: string;
    amount_cents: number;
    status: string;
    created_at: string;
}

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch order stats
            const statsResponse = await axios.get(API_ENDPOINTS.ADMIN_ORDER_STATS);
            setStats(statsResponse.data);

            // Fetch recent orders
            const ordersResponse = await axios.get(`${API_ENDPOINTS.ADMIN_ORDERS}?page=1&limit=10`);
            setRecentOrders(ordersResponse.data.orders || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spinner fullScreen />;

    // Chart data
    const revenueChartData = {
        labels: ['Today', 'This Week', 'This Month'],
        datasets: [
            {
                label: 'Revenue',
                data: [
                    (stats?.today_revenue || 0) / 100,
                    (stats?.week_revenue || 0) / 100,
                    (stats?.month_revenue || 0) / 100,
                ],
                backgroundColor: 'rgba(212, 175, 55, 0.8)',
                borderColor: 'rgba(212, 175, 55, 1)',
                borderWidth: 2,
            },
        ],
    };

    const ordersChartData = {
        labels: ['Paid', 'Pending', 'Failed'],
        datasets: [
            {
                data: [stats?.paid_orders || 0, stats?.pending_orders || 0, stats?.failed_orders || 0],
                backgroundColor: [
                    'rgba(39, 174, 96, 0.8)',
                    'rgba(243, 156, 18, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                ],
                borderColor: ['rgba(39, 174, 96, 1)', 'rgba(243, 156, 18, 1)', 'rgba(231, 76, 60, 1)'],
                borderWidth: 2,
            },
        ],
    };

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif' }}>Admin Dashboard</h1>
                    <p className="text-muted mb-0">Welcome to your admin control panel</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/admin/products">
                        <button className="btn btn-outline-primary">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="me-2"
                            >
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                            </svg>
                            Manage Products
                        </button>
                    </Link>
                    <Link to="/admin/orders">
                        <button className="btn btn-primary">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="me-2"
                            >
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                            Manage Orders
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p className="text-muted mb-1 small">Total Orders</p>
                                    <h3 className="mb-0">{stats?.total_orders || 0}</h3>
                                </div>
                                <div
                                    className="rounded-circle p-3"
                                    style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="var(--primary)"
                                        strokeWidth="2"
                                    >
                                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                        <line x1="3" y1="6" x2="21" y2="6" />
                                        <path d="M16 10a4 4 0 01-8 0" />
                                    </svg>
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                <span className="badge bg-success small">
                  {stats?.paid_orders || 0} Paid
                </span>
                                <span className="badge bg-warning small">
                  {stats?.pending_orders || 0} Pending
                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p className="text-muted mb-1 small">Total Revenue</p>
                                    <h3 className="mb-0">{formatPrice(stats?.total_revenue || 0)}</h3>
                                </div>
                                <div
                                    className="rounded-circle p-3"
                                    style={{ backgroundColor: 'rgba(39, 174, 96, 0.1)' }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#27ae60"
                                        strokeWidth="2"
                                    >
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                                    </svg>
                                </div>
                            </div>
                            <small className="text-success">
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="me-1"
                                >
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                </svg>
                                This Month: {formatPrice(stats?.month_revenue || 0)}
                            </small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p className="text-muted mb-1 small">Paid Orders</p>
                                    <h3 className="mb-0 text-success">{stats?.paid_orders || 0}</h3>
                                </div>
                                <div
                                    className="rounded-circle p-3"
                                    style={{ backgroundColor: 'rgba(39, 174, 96, 0.1)' }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#27ae60"
                                        strokeWidth="2"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            </div>
                            <small className="text-muted">
                                {stats?.total_orders
                                    ? ((stats.paid_orders / stats.total_orders) * 100).toFixed(1)
                                    : 0}
                                % of total orders
                            </small>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p className="text-muted mb-1 small">Pending Orders</p>
                                    <h3 className="mb-0 text-warning">{stats?.pending_orders || 0}</h3>
                                </div>
                                <div
                                    className="rounded-circle p-3"
                                    style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)' }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#f39c12"
                                        strokeWidth="2"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                            </div>
                            <small className="text-muted">Awaiting payment confirmation</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <h5 className="mb-4">Revenue Overview</h5>
                            <Bar
                                data={revenueChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function (value) {
                                                    return '₹' + value.toLocaleString('en-IN');
                                                },
                                            },
                                        },
                                    },
                                }}
                                height={250}
                            />
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <h5 className="mb-4">Order Status</h5>
                            <Doughnut
                                data={ordersChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                        },
                                    },
                                }}
                                height={250}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Recent Orders */}
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">Recent Orders</h5>
                        <Link to="/admin/orders" className="text-primary-custom text-decoration-none">
                            View All →
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="mb-3"
                                style={{ opacity: 0.3 }}
                            >
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                            <p>No orders yet</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover>
                                <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <code className="small">#{order.id.substring(0, 8)}</code>
                                        </td>
                                        <td>{order.user_email}</td>
                                        <td className="price">{formatPrice(order.amount_cents)}</td>
                                        <td>
                        <span
                            className={`badge bg-${
                                order.status === 'paid'
                                    ? 'success'
                                    : order.status === 'pending'
                                        ? 'warning'
                                        : 'danger'
                            }`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                                        </td>
                                        <td>
                                            <small className="text-muted">{formatDateTime(order.created_at)}</small>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/admin/orders?order_id=${order.id}`}
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminDashboard;
