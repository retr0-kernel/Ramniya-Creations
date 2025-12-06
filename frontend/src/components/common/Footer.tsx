import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-secondary-custom text-white mt-5 py-4">
            <Container>
                <Row>
                    <Col md={4} className="mb-3 mb-md-0">
                        <h5 className="mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Ramniya Creations
                        </h5>
                        <p className="text-light">
                            Exquisite handcrafted jewelry and traditional handicrafts from India.
                        </p>
                    </Col>

                    <Col md={2} className="mb-3 mb-md-0">
                        <h6 className="mb-3">Quick Links</h6>
                        <ul className="list-unstyled">
                            <li><Link to="/" className="text-light text-decoration-none">Home</Link></li>
                            <li><Link to="/products" className="text-light text-decoration-none">Products</Link></li>
                            <li><Link to="/cart" className="text-light text-decoration-none">Cart</Link></li>
                        </ul>
                    </Col>

                    <Col md={3} className="mb-3 mb-md-0">
                        <h6 className="mb-3">Customer Service</h6>
                        <ul className="list-unstyled">
                            <li><Link to="/orders" className="text-light text-decoration-none">Orders</Link></li>
                            <li><Link to="/profile" className="text-light text-decoration-none">My Account</Link></li>
                            <li className="text-light">Help & Support</li>
                        </ul>
                    </Col>

                    <Col md={3}>
                        <h6 className="mb-3">Contact Us</h6>
                        <p className="text-light mb-1">
                            <i className="bi bi-envelope me-2"></i>
                            info@ramniya.com
                        </p>
                        <p className="text-light mb-1">
                            <i className="bi bi-phone me-2"></i>
                            +91-9876543210
                        </p>
                        <p className="text-light">
                            <i className="bi bi-geo-alt me-2"></i>
                            Lucknow, Uttar Pradesh
                        </p>
                    </Col>
                </Row>

                <hr className="my-4 bg-light" />

                <Row>
                    <Col className="text-center">
                        <p className="mb-0 text-light">
                            &copy; {currentYear} Ramniya Creations. All rights reserved.
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
