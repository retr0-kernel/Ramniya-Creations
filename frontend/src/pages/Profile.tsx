import React from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { formatDateTime } from '../utils/formatters';

const Profile: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    if (!user) return null;

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="border-0 shadow-lg">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <div
                                    className="d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                        color: '#000',
                                        fontSize: '2.5rem',
                                        fontWeight: '600',
                                        fontFamily: 'Playfair Display, serif',
                                    }}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ fontFamily: 'Playfair Display, serif' }}>
                                    {user.name}
                                </h3>
                                <p className="text-muted mb-0">{user.email}</p>
                            </div>

                            <hr className="my-4" />

                            <div className="mb-3 d-flex justify-content-between align-items-center py-2">
                                <strong className="text-muted">Account Type:</strong>
                                <span className="badge bg-primary text-capitalize px-3 py-2">
                                    {user.role}
                                </span>
                            </div>

                            <div className="mb-3 d-flex justify-content-between align-items-center py-2">
                                <strong className="text-muted">Email Status:</strong>
                                {user.is_verified ? (
                                    <span className="badge bg-success px-3 py-2">
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-1"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Verified
                                    </span>
                                ) : (
                                    <span className="badge bg-warning px-3 py-2">
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-1"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        Not Verified
                                    </span>
                                )}
                            </div>

                            {user.created_at && (
                                <div className="mb-4 d-flex justify-content-between align-items-center py-2">
                                    <strong className="text-muted">Member Since:</strong>
                                    <span>{formatDateTime(user.created_at)}</span>
                                </div>
                            )}

                            <hr className="my-4" />

                            <div className="d-grid gap-3">
                                {user.role === 'admin' && (
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={() => navigate('/admin/dashboard')}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-2"
                                        >
                                            <rect x="3" y="3" width="7" height="7" />
                                            <rect x="14" y="3" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" />
                                            <rect x="3" y="14" width="7" height="7" />
                                        </svg>
                                        Admin Dashboard
                                    </Button>
                                )}

                                <Button
                                    variant="outline-primary"
                                    size="lg"
                                    onClick={() => navigate('/orders')}
                                >
                                    <svg
                                        width="20"
                                        height="20"
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
                                    My Orders
                                </Button>

                                <Button
                                    variant="outline-secondary"
                                    size="lg"
                                    onClick={() => navigate('/cart')}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-2"
                                    >
                                        <path d="M9 2L7 6" />
                                        <path d="M17 2L19 6" />
                                        <path d="M1 6h22v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6z" />
                                        <path d="M7 10h10" />
                                    </svg>
                                    View Cart
                                </Button>

                                <Button variant="outline-danger" size="lg" onClick={handleLogout}>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="me-2"
                                    >
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Logout
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="border-0 shadow-sm mt-4">
                        <Card.Body>
                            <h6 className="mb-3">Quick Stats</h6>
                            <div className="row text-center g-3">
                                <div className="col-4">
                                    <div className="p-3 rounded" style={{ backgroundColor: 'var(--surface-hover)' }}>
                                        <h4 className="mb-1 text-primary">0</h4>
                                        <small className="text-muted">Orders</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-3 rounded" style={{ backgroundColor: 'var(--surface-hover)' }}>
                                        <h4 className="mb-1 text-primary">0</h4>
                                        <small className="text-muted">Cart Items</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-3 rounded" style={{ backgroundColor: 'var(--surface-hover)' }}>
                                        <h4 className="mb-1 text-primary">₹0</h4>
                                        <small className="text-muted">Total Spent</small>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;
