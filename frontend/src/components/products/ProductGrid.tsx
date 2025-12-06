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
            <div className="empty-state">
                <h3>No Products Found</h3>
                <p>Try adjusting your filters or search criteria</p>
            </div>
        );
    }

    return (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {products.map((product) => (
                <Col key={product.id}>
                    <ProductCard product={product} />
                </Col>
            ))}
        </Row>
    );
};

export default ProductGrid;
