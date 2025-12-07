import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';
import { Product } from '../../types';

interface ProductGridProps {
    products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
    if (products.length === 0) {
        return (
            <div className="empty-state text-center py-5">
                <div className="mb-4">
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        style={{ opacity: 0.3 }}
                    >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                </div>
                <h3 style={{ color: 'var(--text-primary)' }}>No Products Found</h3>
                <p className="text-muted">Try adjusting your filters or search criteria</p>
            </div>
        );
    }

    return (
        <Row xs={1} sm={2} lg={3} xl={4} className="g-4">
            {products.map((product) => (
                <Col key={product.id}>
                    <ProductCard product={product} />
                </Col>
            ))}
        </Row>
    );
};

export default ProductGrid;
