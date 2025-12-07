import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import { Product } from '../../types';

interface ProductGridProps {
    products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
    if (!products || products.length === 0) {
        return (
            <div className="empty-state text-center py-5">
                <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mb-3"
                    style={{ opacity: 0.3 }}
                >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
                <h3>No Products Found</h3>
                <p className="text-muted">Check back later for new products</p>
            </div>
        );
    }

    return (
        <Row className="g-4">
            {products.map((product) => (
                <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
                    <ProductCard product={product} />
                </Col>
            ))}
        </Row>
    );
};

export default ProductGrid;
