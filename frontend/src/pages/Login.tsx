import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { login, clearError } from '../features/auth/authSlice';
import axios from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';

const Login: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const from = (location.state as any)?.from || '/';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(login(formData));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleLogin = async () => {
        try {
            const response = await axios.get(API_ENDPOINTS.LOGIN.replace('/login', '/oauth/google'));
            const { auth_url } = response.data;
            window.location.href = auth_url;
        } catch (error) {
            console.error('Failed to get Google auth URL:', error);
        }
    };

    const isEmailVerificationError = error?.includes('verify your email');

    return (
        <Container className="py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <Card className="border-0 shadow-lg">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <div className="mb-3">
                                    <span style={{ fontSize: '3rem' }}>✨</span>
                                </div>
                                <h2 style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Welcome Back
                                </h2>
                                <p className="text-muted">Sign in to continue shopping</p>
                            </div>

                            {error && (
                                <Alert
                                    variant={isEmailVerificationError ? 'warning' : 'danger'}
                                    dismissible
                                    onClose={() => dispatch(clearError())}
                                    className="mb-4"
                                >
                                    {error}
                                    {isEmailVerificationError && (
                                        <div className="mt-2">
                                            <small>
                                                Didn't receive the email?{' '}
                                                <Link to="/register" className="alert-link fw-semibold">
                                                    Register again
                                                </Link>
                                            </small>
                                        </div>
                                    )}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="your@email.com"
                                        size="lg"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        size="lg"
                                    />
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mb-3"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Logging in...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </Button>

                                <div className="position-relative my-4">
                                    <hr style={{ borderColor: 'var(--border)' }} />
                                    <span
                                        className="position-absolute top-50 start-50 translate-middle px-3 text-muted small"
                                        style={{ backgroundColor: 'var(--card-bg)' }}
                                    >
                    OR
                  </span>
                                </div>

                                <Button
                                    variant="outline-secondary"
                                    className="w-100 mb-3"
                                    size="lg"
                                    onClick={handleGoogleLogin}
                                    type="button"
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" className="me-2">
                                        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                                        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                                        <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                                        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                                    </svg>
                                    Continue with Google
                                </Button>

                                <div className="text-center mt-4">
                                    <p className="mb-0 text-muted">
                                        Don't have an account?{' '}
                                        <Link to="/register" className="text-primary-custom fw-semibold">
                                            Create account
                                        </Link>
                                    </p>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
};

export default Login;
