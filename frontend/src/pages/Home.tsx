import React, { useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProducts } from '../features/products/productsSlice';
import ProductGrid from '../components/products/ProductGrid';
import Spinner from '../components/common/Spinner';

const Home: React.FC = () => {
    const dispatch = useAppDispatch();
    const { products, loading } = useAppSelector((state) => state.products);

    useEffect(() => {
        dispatch(fetchProducts({ page: 1, limit: 8, sort_by: 'created_at', sort_order: 'desc' }));
    }, [dispatch]);

    return (
        <>
            {/* Hero Section */}
            <section className="bg-primary-custom text-dark py-5">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6}>
                            <h1 className="display-4 fw-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Exquisite Indian Jewelry & Handicrafts
                            </h1>
                            <p className="lead mb-4">
                                Discover our collection of handcrafted gold jewelry, traditional ornaments,
                                and unique handicrafts from the heart of India.
                            </p>
                            <Link to="/products">
                                <Button variant="dark" size="lg">
                                    Shop Collection
                                </Button>
                            </Link>
                        </Col>
                        <Col lg={6} className="text-center mt-4 mt-lg-0">
                            <img
                                src="/hero-image.jpg"
                                alt="Jewelry Collection"
                                className="img-fluid rounded shadow-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                }}
                            />
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section className="py-5 bg-light">
                <Container>
                    <Row className="text-center">
                        <Col md={4} className="mb-4 mb-md-0">
                            <div className="mb-3">
                                <i className="bi bi-gem" style={{ fontSize: '3rem', color: '#d4af37' }}></i>
                            </div>
                            <h5>Premium Quality</h5>
                            <p className="text-muted">
                                Handcrafted with finest materials and traditional techniques
                            </p>
                        </Col>
                        <Col md={4} className="mb-4 mb-md-0">
                            <div className="mb-3">
                                <i className="bi bi-shield-check" style={{ fontSize: '3rem', color: '#d4af37' }}></i>
                            </div>
                            <h5>Secure Payment</h5>
                            <p className="text-muted">
                                Safe and secure online payment with Razorpay
                            </p>
                        </Col>
                        <Col md={4}>
                            <div className="mb-3">
                                <i className="bi bi-truck" style={{ fontSize: '3rem', color: '#d4af37' }}></i>
                            </div>
                            <h5>Fast Delivery</h5>
                            <p className="text-muted">
                                Quick and reliable shipping across India
                            </p>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Featured Products */}
            <section className="py-5">
                <Container>
                    <div className="text-center mb-5">
                        <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Featured Products</h2>
                        <p className="text-muted">Browse our latest collection</p>
                    </div>

                    {loading ? (
                        <Spinner fullScreen />
                    ) : (
                        <>
                            <ProductGrid products={products} />
                            <div className="text-center mt-5">
                                <Link to="/products">
                                    <Button variant="outline-primary" size="lg">
                                        View All Products
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </Container>
            </section>
        </>
    );
};

export default Home;
