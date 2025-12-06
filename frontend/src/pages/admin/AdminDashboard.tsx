import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { formatPrice } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(API_ENDPOINTS.ADMIN_ORDER_STATS);
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <Spinner fullScreen />;

    return (
        <Container className="py-4">
            <h1 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Admin Dashboard
            </h1>

            <Row className="g-4 mb-4">
                <Col md={6} lg={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-primary-custom">{stats?.total_orders || 0}</h3>
                            <p className="text-muted mb-0">Total Orders</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-success">{stats?.paid_orders || 0}</h3>
                            <p className="text-muted mb-0">Paid Orders</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-warning">{stats?.pending_orders || 0}</h3>
                            <p className="text-muted mb-0">Pending Orders</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-primary-custom">
                                {formatPrice(stats?.total_revenue || 0)}
                            </h3>
                            <p className="text-muted mb-0">Total Revenue</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">Quick Actions</h5>
                            <div className="d-grid gap-2">
                                <Link to="/admin/products">
                                    <button className="btn btn-outline-primary w-100">
                                        Manage Products
                                    </button>
                                </Link>
                                <Link to="/admin/orders">
                                    <button className="btn btn-outline-primary w-100">
                                        Manage Orders
                                    </button>
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">System Info</h5>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <strong>Environment:</strong> {process.env.NODE_ENV}
                                </li>
                                <li className="mb-2">
                                    <strong>API URL:</strong> {process.env.REACT_APP_API_URL}
                                </li>
                                <li className="mb-2">
                                    <strong>Cache:</strong> Redis Enabled
                                </li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminDashboard;
