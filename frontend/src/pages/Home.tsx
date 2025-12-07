import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProducts } from '../features/products/productsSlice';
import ProductGrid from '../components/products/ProductGrid';
import Spinner from '../components/common/Spinner';

const Home: React.FC = () => {
    const dispatch = useAppDispatch();
    const { products, loading } = useAppSelector((state) => state.products);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        // Only fetch if not already loaded
        if (!hasLoaded && products.length === 0) {
            dispatch(fetchProducts({ page: 1, limit: 8, sort_by: 'created_at', sort_order: 'desc' }));
            setHasLoaded(true);
        }
    }, [dispatch, hasLoaded, products.length]);

    return (
        <>
            {/* Hero Section */}
            <section
                className="hero-section py-5"
                style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: '#000',
                }}
            >
                <Container>
                    <Row className="align-items-center min-vh-50">
                        <Col lg={6} className="mb-5 mb-lg-0">
                            <div className="hero-content" style={{ animation: 'slideUp 0.8s ease-out' }}>
                                <h1 className="display-3 fw-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Exquisite Indian Jewelry & Handicrafts
                                </h1>
                                <p className="lead mb-4" style={{ fontSize: '1.25rem', lineHeight: '1.8' }}>
                                    Discover our collection of handcrafted gold jewelry, traditional ornaments,
                                    and unique handicrafts from the heart of India.
                                </p>
                                <div className="d-flex gap-3">
                                    <Link to="/products">
                                        <Button variant="dark" size="lg" className="px-4 py-3">
                                            Explore Collection
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className="ms-2"
                                            >
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div
                                className="hero-image text-center"
                                style={{ animation: 'fadeIn 1s ease-in' }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        borderRadius: '1rem',
                                        background: 'rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <span style={{ fontSize: '8rem' }}>💍</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section className="features-section py-5" style={{ backgroundColor: 'var(--surface)' }}>
                <Container>
                    <Row className="text-center g-4">
                        {[
                            {
                                icon: '💎',
                                title: 'Premium Quality',
                                description: 'Handcrafted with finest materials and traditional techniques'
                            },
                            {
                                icon: '🔒',
                                title: 'Secure Payment',
                                description: 'Safe and secure online payment with Razorpay'
                            },
                            {
                                icon: '🚚',
                                title: 'Fast Delivery',
                                description: 'Quick and reliable shipping across India'
                            }
                        ].map((feature, index) => (
                            <Col md={4} key={index}>
                                <div
                                    className="feature-card p-4"
                                    style={{
                                        animation: `fadeIn 0.6s ease-in ${index * 0.2}s backwards`,
                                        transition: 'transform 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div className="mb-3" style={{ fontSize: '3rem' }}>
                                        {feature.icon}
                                    </div>
                                    <h5 className="mb-2">{feature.title}</h5>
                                    <p className="text-muted mb-0">{feature.description}</p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Featured Products */}
            <section className="featured-products-section py-5">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="display-5 fw-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Featured Products
                        </h2>
                        <p className="text-muted">Browse our latest collection</p>
                    </div>

                    {loading ? (
                        <Spinner fullScreen />
                    ) : (
                        <>
                            <ProductGrid products={products} />
                            {products.length > 0 && (
                                <div className="text-center mt-5">
                                    <Link to="/products">
                                        <Button variant="outline-primary" size="lg" className="px-5">
                                            View All Products
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </Container>
            </section>

            {/* CTA Section */}
            <section
                className="cta-section py-5 text-center"
                style={{
                    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%)',
                }}
            >
                <Container>
                    <h2 className="display-6 fw-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-primary)' }}>
                        Start Your Journey Today
                    </h2>
                    <p className="lead mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Join thousands of satisfied customers who trust us for authentic Indian craftsmanship
                    </p>
                    <Link to="/register">
                        <Button variant="primary" size="lg" className="px-5">
                            Create Account
                        </Button>
                    </Link>
                </Container>
            </section>
        </>
    );
};

export default Home;
