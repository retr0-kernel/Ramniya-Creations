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
                    <Card>
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <div
                                    className="bg-primary-custom text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ fontFamily: 'Playfair Display, serif' }}>
                                    {user.name}
                                </h3>
                                <p className="text-muted">{user.email}</p>
                            </div>

                            <hr />

                            <div className="mb-3">
                                <strong>Account Type:</strong>{' '}
                                <span className="text-capitalize">{user.role}</span>
                            </div>

                            <div className="mb-3">
                                <strong>Email Verified:</strong>{' '}
                                {user.is_verified ? (
                                    <span className="text-success">✓ Verified</span>
                                ) : (
                                    <span className="text-danger">✗ Not Verified</span>
                                )}
                            </div>

                            <div className="mb-4">
                                <strong>Member Since:</strong>{' '}
                                {formatDateTime(user.created_at)}
                            </div>

                            <div className="d-grid gap-2">
                                {user.role === 'admin' && (
                                    <Button
                                        variant="primary"
                                        onClick={() => navigate('/admin/dashboard')}
                                    >
                                        Go to Admin Dashboard
                                    </Button>
                                )}

                                <Button
                                    variant="outline-primary"
                                    onClick={() => navigate('/orders')}
                                >
                                    View My Orders
                                </Button>

                                <Button variant="outline-danger" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;