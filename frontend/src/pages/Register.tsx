import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { register, clearError } from '../features/auth/authSlice';
import { isValidEmail, isValidPassword } from '../utils/validators';

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

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

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
            }, 3000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (validationErrors[e.target.name]) {
            setValidationErrors({ ...validationErrors, [e.target.name]: '' });
        }
    };

    return (
        <Container className="py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <Card>
                        <Card.Body className="p-4">
                            <h2 className="text-center mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Register
                            </h2>

                            {success && (
                                <Alert variant="success">
                                    Registration successful! Please check your email to verify your account.
                                    Redirecting to login...
                                </Alert>
                            )}

                            {error && (
                                <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.name}
                                        required
                                        placeholder="Your full name"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.email}
                                        required
                                        placeholder="your@email.com"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.password}
                                        required
                                        placeholder="Create a strong password"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.password}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        isInvalid={!!validationErrors.confirmPassword}
                                        required
                                        placeholder="Re-enter your password"
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
                                    {loading ? 'Registering...' : 'Register'}
                                </Button>

                                <div className="text-center">
                                    <p className="mb-0">
                                        Already have an account?{' '}
                                        <Link to="/login" className="text-primary-custom">
                                            Login here
                                        </Link>
                                    </p>
                                </div>
                            </Form>
       w                 </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
};

export default Register;
