import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Badge } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProductById } from '../features/products/productsSlice';
import { addToCart } from '../features/cart/cartSlice';
import VariantSelector from '../components/products/VariantSelector';
import ProductImageZoom from '../components/products/ProductImageZoom';
import Spinner from '../components/common/Spinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatPrice } from '../utils/formatters';
import { type ProductVariant } from '../types';

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { currentProduct: product, loading, error } = useAppSelector((state) => state.products);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        if (id) {
            dispatch(fetchProductById(id));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (product && product.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product]);

    const handleAddToCart = () => {
        if (!product) return;

        const variant = selectedVariant || (product.variants && product.variants[0]);
        const primaryImage = product.images && (product.images.find((img) => img.is_primary) || product.images[0]);

        dispatch(
            addToCart({
                product_id: product.id,
                variant_id: variant?.id,
                title: product.title,
                sku: variant?.sku || '',
                quantity,
                price_cents: product.price + (variant?.price_modifier || 0),
                image_url: primaryImage?.url || '/placeholder.jpg',
            })
        );

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/cart');
    };

    if (loading) return <Spinner fullScreen />;
    if (error) return <ErrorAlert error={error} />;
    if (!product) return <div className="container py-5">Product not found</div>;

    const currentPrice = product.price + (selectedVariant?.price_modifier || 0);
    const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;

    return (
        <Container className="py-5">
            <Row>
                <Col lg={6} className="mb-4 mb-lg-0">
                    <ProductImageZoom images={product.images || []} title={product.title} />
                </Col>

                <Col lg={6}>
                    <div className="product-details">
                        <h1 className="mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {product.title}
                        </h1>

                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="price" style={{ fontSize: '2rem' }}>
                                {formatPrice(currentPrice)}
                            </div>
                            {selectedVariant && selectedVariant.price_modifier !== 0 && (
                                <div className="price strike">
                                    {formatPrice(product.price)}
                                </div>
                            )}
                        </div>

                        <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                            <p className="text-muted mb-0">{product.description}</p>
                        </div>

                        {product && product.variants && product.variants.length > 0 && (
                            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                                <VariantSelector
                                    variants={product.variants}
                                    selectedVariant={selectedVariant}
                                    onSelect={setSelectedVariant}
                                />
                            </div>
                        )}

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Quantity</Form.Label>
                            <div className="d-flex align-items-center gap-3">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={isOutOfStock || quantity <= 1}
                                >
                                    −
                                </Button>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max={selectedVariant?.stock || 99}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    style={{ width: '80px', textAlign: 'center' }}
                                    disabled={isOutOfStock}
                                />
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                                    disabled={isOutOfStock || quantity >= (selectedVariant?.stock || 99)}
                                >
                                    +
                                </Button>
                                {selectedVariant && (
                                    <span className="text-muted small">
                    {selectedVariant.stock} available
                  </span>
                                )}
                            </div>
                        </Form.Group>

                        {isOutOfStock ? (
                            <Badge bg="danger" className="mb-3 p-3 d-block text-center" style={{ fontSize: '1rem' }}>
                                Out of Stock
                            </Badge>
                        ) : (
                            <div className="d-grid gap-3 mb-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock}
                                >
                                    Buy Now
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    size="lg"
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock}
                                >
                                    {addedToCart ? (
                                        <>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className="me-2"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Added to Cart
                                        </>
                                    ) : (
                                        'Add to Cart'
                                    )}
                                </Button>
                            </div>
                        )}

                        {product.metadata && Object.keys(product.metadata).length > 0 && (
                            <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'var(--surface-hover)' }}>
                                <h5 className="mb-3">Product Details</h5>
                                <ul className="list-unstyled mb-0">
                                    {Object.entries(product.metadata).map(([key, value]) => (
                                        <li key={key} className="mb-2 d-flex">
                                            <strong className="text-capitalize me-2" style={{ minWidth: '120px' }}>
                                                {key}:
                                            </strong>
                                            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Features */}
                        <div className="mt-4">
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="d-flex align-items-center gap-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        <small>Secure Payment</small>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="d-flex align-items-center gap-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                                            <rect x="1" y="3" width="15" height="13" />
                                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                            <circle cx="5.5" cy="18.5" r="2.5" />
                                            <circle cx="18.5" cy="18.5" r="2.5" />
                                        </svg>
                                        <small>Fast Delivery</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default ProductDetail;
