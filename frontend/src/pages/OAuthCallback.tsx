import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';

const OAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const accessToken = searchParams.get('access_token');
            const userId = searchParams.get('user_id');
            const userName = searchParams.get('user_name');
            const userEmail = searchParams.get('user_email');
            const userRole = searchParams.get('user_role');
            // const expiresIn = searchParams.get('expires_in');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage(getErrorMessage(error));
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            if (!accessToken || !userId || !userEmail) {
                setStatus('error');
                setMessage('Invalid OAuth callback - missing required data');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            try {
                // Construct user object
                const user = {
                    id: userId,
                    name: userName || '',
                    email: userEmail,
                    role: userRole || 'customer',
                    is_verified: true, // Google OAuth users are always verified
                };

                // Store in localStorage
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('user', JSON.stringify(user));

                setStatus('success');
                setMessage('Login successful! Redirecting...');

                // Redirect to home after 1 second
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } catch (error: any) {
                console.error('OAuth callback error:', error);
                setStatus('error');
                setMessage('Authentication failed');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    const getErrorMessage = (error: string): string => {
        const messages: Record<string, string> = {
            missing_code: 'Authorization code is missing',
            missing_state: 'State parameter is missing',
            invalid_state: 'Invalid state - possible CSRF attack',
            exchange_failed: 'Failed to exchange authorization code',
            email_not_verified: 'Google email is not verified',
            user_creation_failed: 'Failed to create user account',
            token_generation_failed: 'Failed to generate authentication token',
        };
        return messages[error] || 'Authentication failed';
    };

    return (
        <Container className="py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <Card className="text-center border-0 shadow-lg">
                        <Card.Body className="p-5">
                            {status === 'loading' && (
                                <>
                                    <Spinner
                                        animation="border"
                                        variant="primary"
                                        className="mb-3"
                                        style={{ width: '3rem', height: '3rem' }}
                                    />
                                    <h4>Completing sign in...</h4>
                                    <p className="text-muted">Please wait while we authenticate your account</p>
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
                                            stroke="var(--primary)"
                                            strokeWidth="2"
                                        >
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <h4 className="mb-3" style={{ color: 'var(--primary)' }}>Login Successful!</h4>
                                    <p className="text-muted">{message}</p>
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
                                            stroke="#e74c3c"
                                            strokeWidth="2"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                    </div>
                                    <h4 className="text-danger mb-3">Authentication Failed</h4>
                                    <Alert variant="danger">{message}</Alert>
                                    <p className="text-muted small">Redirecting to login...</p>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
};

export default OAuthCallback;
