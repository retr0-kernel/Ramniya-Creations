import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const images = product.images || [];
    const primaryImage = images.find((img) => img.is_primary) || images[0];
    const imageUrl = primaryImage?.url || '/placeholder.jpg';

    // Safe access to variants
    const variants = product.variants || [];
    const hasVariants = variants.length > 0;
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

    return (
        <Card className="product-card h-100 border-0 shadow-sm">
            <Link to={`/products/${product.id}`} className="text-decoration-none">
                <div className="image-zoom-container" style={{ height: '250px', overflow: 'hidden' }}>
                    <Card.Img
                        variant="top"
                        src={imageUrl}
                        alt={product.title}
                        style={{
                            height: '250px',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                    />
                </div>
                <Card.Body>
                    <Card.Title className="h6 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {product.title}
                    </Card.Title>
                    <Card.Text className="text-muted small mb-2" style={{ height: '40px', overflow: 'hidden' }}>
                        {product.description
                            ? product.description.substring(0, 80) + (product.description.length > 80 ? '...' : '')
                            : 'No description available'}
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="price" style={{ fontSize: '1.25rem' }}>
                            {formatPrice(product.price)}
                        </div>
                        {hasVariants && totalStock > 0 && (
                            <small className="text-muted">
                                {totalStock} in stock
                            </small>
                        )}
                    </div>
                    {hasVariants && variants.length > 1 && (
                        <div className="mt-2">
                            <small className="text-muted">
                                {variants.length} variants available
                            </small>
                        </div>
                    )}
                </Card.Body>
            </Link>
        </Card>
    );
};

export default ProductCard;
