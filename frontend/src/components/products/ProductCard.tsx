import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
    const imageUrl = primaryImage?.url || '/placeholder.jpg';

    return (
        <Card className="h-100 product-card">
            <Link to={`/products/${product.id}`} className="text-decoration-none">
                <div style={{ height: '300px', overflow: 'hidden' }}>
                    <Card.Img
                        variant="top"
                        src={imageUrl}
                        alt={product.title}
                        style={{
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                        className="product-card-image"
                    />
                </div>
                <Card.Body>
                    <Card.Title className="text-dark h6 mb-2">
                        {product.title}
                    </Card.Title>
                    <Card.Text className="text-muted small mb-2" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {product.description}
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
            <span className="price">
              {formatPrice(product.price)}
            </span>
                        {product.variants.length > 0 && (
                            <small className="text-muted">
                                {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                            </small>
                        )}
                    </div>
                </Card.Body>
            </Link>
        </Card>
    );
};

export default ProductCard;