import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { register, clearError } from '../features/auth/authSlice';
import { isValidEmail, isValidPassword, getPasswordStrength } from '../utils/validators';
import axios from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';

const Register: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    useEffect(() => {
        if (formData.password) {
            setPasswordStrength(getPasswordStrength(formData.password));
        }
    }, [formData.password]);

    const validate = () => {
        const errors: Record<string, string> = {};

        if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        if (!isValidEmail(formData.email)) {
            errors.email = 'Invalid email address';
        }

        if (!isValidPassword(formData.password)) {
            errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const result = await dispatch(
            register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            })
        );

        if (register.fulfilled.match(result)) {
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 5000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (validationErrors[e.target.name]) {
            setValidationErrors({ ...validationErrors, [e.target.name]: '' });
        }
    };

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 'weak': return 'danger';
            case 'medium': return 'warning';
            case 'strong': return 'success';
        }
    };

    const getStrengthPercent = () => {
        switch (passwordStrength) {
            case 'weak': return 33;
            case 'medium': return 66;
            case 'strong': return 100;
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const response = await axios.get(API_ENDPOINTS.GOOGLE_OAUTH);
            const { auth_url } = response.data;
            window.location.href = auth_url;
        } catch (error) {
            console.error('Failed to get Google auth URL:', error);
        }
    };

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
                                    Create Account
                                </h2>
                                <p className="text-muted">Join us to start shopping</p>
                            </div>

                            {success && (
                                <Alert variant="success" className="mb-4">
                                    <div className="d-flex align-items-center">
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="me-2"
                                        >
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        <div>
                                            <strong>Registration successful!</strong>
                                            <p className="mb-0 small">
                                                Please check your email to verify your account. Redirecting to login...
                                            </p>
                                        </div>
                                    </div>
                                </Alert>
                            )}

                            {error && (
                                <Alert variant="danger" dismissible onClose={() => dispatch(clearError())} className="mb-4">
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.name}
                                        required
                                        placeholder="John Doe"
                                        size="lg"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.email}
                                        required
                                        placeholder="your@email.com"
                                        size="lg"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.password}
                                        required
                                        placeholder="Create a strong password"
                                        size="lg"
                                    />
                                    {formData.password && (
                                        <div className="mt-2">
                                            <small className="text-muted d-block mb-1">
                                                Password strength: <strong className={`text-${getStrengthColor()}`}>
                                                {passwordStrength.toUpperCase()}
                                            </strong>
                                            </small>
                                            <ProgressBar
                                                now={getStrengthPercent()}
                                                variant={getStrengthColor()}
                                                style={{ height: '6px' }}
                                            />
                                        </div>
                                    )}
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.password}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold">Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.confirmPassword}
                                        required
                                        placeholder="Re-enter your password"
                                        size="lg"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.confirmPassword}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mb-3"
                                    size="lg"
                                    disabled={loading || success}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
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
                                        Already have an account?{' '}
                                        <Link to="/login" className="text-primary-custom fw-semibold">
                                            Sign in
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

export default Register;
