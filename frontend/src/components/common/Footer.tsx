import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-secondary-custom mt-5 py-4" style={{ color: 'var(--text-primary)' }}>
            <Container>
                <Row>
                    <Col md={4} className="mb-3 mb-md-0">
                        <h5 className="mb-3" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                            Ramniya Creations
                        </h5>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Exquisite handcrafted jewelry and traditional handicrafts from India.
                        </p>
                    </Col>

                    <Col md={2} className="mb-3 mb-md-0">
                        <h6 className="mb-3" style={{ color: 'var(--text-primary)' }}>Quick Links</h6>
                        <ul className="list-unstyled">
                            <li><Link to="/" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>Home</Link></li>
                            <li><Link to="/products" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>Products</Link></li>
                            <li><Link to="/cart" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>Cart</Link></li>
                        </ul>
                    </Col>

                    <Col md={3} className="mb-3 mb-md-0">
                        <h6 className="mb-3" style={{ color: 'var(--text-primary)' }}>Customer Service</h6>
                        <ul className="list-unstyled">
                            <li><Link to="/orders" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>Orders</Link></li>
                            <li><Link to="/profile" className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>My Account</Link></li>
                            <li style={{ color: 'var(--text-secondary)' }}>Help & Support</li>
                        </ul>
                    </Col>

                    <Col md={3}>
                        <h6 className="mb-3" style={{ color: 'var(--text-primary)' }}>Contact Us</h6>
                        <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                            <i className="bi bi-envelope me-2"></i>
                            ramniyacreations@gmail.com
                        </p>
                        <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                            <i className="bi bi-phone me-2"></i>
                            +91-7774077058
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            <i className="bi bi-geo-alt me-2"></i>
                            Noida, Uttar Pradesh
                        </p>
                    </Col>
                </Row>

                <hr className="my-4" style={{ borderColor: 'var(--border)' }} />

                <Row>
                    <Col className="text-center">
                        <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
                            &copy; {currentYear} Ramniya Creations. All rights reserved.
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
