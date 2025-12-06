import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import axios from '../api/axiosConfig';
import { API_ENDPOINTS } from '../api/endpoints';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link');
                return;
            }

            try {
                const response = await axios.get(`${API_ENDPOINTS.VERIFY_EMAIL}?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verification failed. Please try again.');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <Container className="py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <Card className="text-center">
                        <Card.Body className="p-5">
                            {status === 'loading' && (
                                <>
                                    <Spinner animation="border" variant="primary" className="mb-3" />
                                    <h4>Verifying your email...</h4>
                                    <p className="text-muted">Please wait while we verify your account</p>
                                </>
                            )}

                            {status === 'success' && (
                                <>
                                    <div className="mb-3">
                                        <svg
                                            width="64"
                                            height="64"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="text-success"
                                        >
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <h4 className="text-success mb-3">Email Verified!</h4>
                                    <p className="text-muted mb-4">{message}</p>
                                    <p className="small">Redirecting to login page in 3 seconds...</p>
                                    <Link to="/login" className="btn btn-primary mt-3">
                                        Go to Login Now
                                    </Link>
                                </>
                            )}

                            {status === 'error' && (
                                <>
                                    <div className="mb-3">
                                        <svg
                                            width="64"
                                            height="64"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="text-danger"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                    </div>
                                    <h4 className="text-danger mb-3">Verification Failed</h4>
                                    <Alert variant="danger">{message}</Alert>
                                    <div className="d-grid gap-2">
                                        <Link to="/register" className="btn btn-outline-primary">
                                            Register Again
                                        </Link>
                                        <Link to="/login" className="btn btn-primary">
                                            Go to Login
                                        </Link>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
};

export default VerifyEmail;
