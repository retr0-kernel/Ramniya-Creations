import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Badge, Carousel } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchProductById } from '../features/products/productsSlice';
import { addToCart } from '../features/cart/cartSlice';
import VariantSelector from '../components/products/VariantSelector';
import Spinner from '../components/common/Spinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { formatPrice } from '../utils/formatters';
import { ProductVariant } from '../types';

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
        if (product && product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
        }
    }, [product]);

    const handleAddToCart = () => {
        if (!product) return;

        const variant = selectedVariant || product.variants[0];
        const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];

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
                    {product.images.length > 0 ? (
                        <Carousel>
                            {product.images
                                .sort((a, b) => a.display_order - b.display_order)
                                .map((image) => (
                                    <Carousel.Item key={image.id}>
                                        <img
                                            src={image.url}
                                            alt={product.title}
                                            className="d-block w-100 rounded"
                                            style={{ height: '500px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                            }}
                                        />
                                    </Carousel.Item>
                                ))}
                        </Carousel>
                    ) : (
                        <img
                            src="/placeholder.jpg"
                            alt={product.title}
                            className="w-100 rounded"
                            style={{ height: '500px', objectFit: 'cover' }}
                        />
                    )}
                </Col>

                <Col lg={6}>
                    <h1 className="mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {product.title}
                    </h1>

                    <div className="price mb-3" style={{ fontSize: '2rem' }}>
                        {formatPrice(currentPrice)}
                    </div>

                    <p className="text-muted mb-4">{product.description}</p>

                    {product.variants.length > 0 && (
                        <VariantSelector
                            variants={product.variants}
                            selectedVariant={selectedVariant}
                            onSelect={setSelectedVariant}
                        />
                    )}

                    <Form.Group className="mb-4">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            max={selectedVariant?.stock || 99}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '100px' }}
                            disabled={isOutOfStock}
                        />
                    </Form.Group>

                    {isOutOfStock ? (
                        <Badge bg="danger" className="mb-3 p-2">
                            Out of Stock
                        </Badge>
                    ) : (
                        <div className="d-flex gap-3 mb-4">
                            <Button
                                variant="outline-primary"
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className="flex-grow-1"
                            >
                                {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleBuyNow}
                                disabled={isOutOfStock}
                                className="flex-grow-1"
                            >
                                Buy Now
                            </Button>
                        </div>
                    )}

                    {product.metadata && Object.keys(product.metadata).length > 0 && (
                        <div className="mt-4">
                            <h5 className="mb-3">Product Details</h5>
                            <ul className="list-unstyled">
                                {Object.entries(product.metadata).map(([key, value]) => (
                                    <li key={key} className="mb-2">
                                        <strong className="text-capitalize">{key}:</strong>{' '}
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ProductDetail;
