import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import { ProductsFilter } from '../../types';

interface ProductFiltersProps {
    filters: ProductsFilter;
    onFilterChange: (filters: ProductsFilter) => void;
    onClearFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
                                                           filters,
                                                           onFilterChange,
                                                           onClearFilters,
                                                       }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleChange = (key: string, value: any) => {
        const updated = { ...localFilters, [key]: value };
        setLocalFilters(updated);
    };

    const handleApply = () => {
        onFilterChange(localFilters);
    };

    const handleClear = () => {
        setLocalFilters({
            page: 1,
            limit: 12,
            sort_by: 'created_at',
            sort_order: 'desc',
        });
        onClearFilters();
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <h5 className="mb-3">Filters</h5>

                <Form>
                    <Row>
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Min Price (₹)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={localFilters.min_price || ''}
                                    onChange={(e) => handleChange('min_price', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                                    placeholder="0"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Max Price (₹)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={localFilters.max_price ? localFilters.max_price / 100 : ''}
                                    onChange={(e) => handleChange('max_price', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                                    placeholder="100000"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Size</Form.Label>
                                <Form.Select
                                    value={localFilters.size || ''}
                                    onChange={(e) => handleChange('size', e.target.value || undefined)}
                                >
                                    <option value="">All Sizes</option>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Color</Form.Label>
                                <Form.Select
                                    value={localFilters.color || ''}
                                    onChange={(e) => handleChange('color', e.target.value || undefined)}
                                >
                                    <option value="">All Colors</option>
                                    <option value="gold">Gold</option>
                                    <option value="silver">Silver</option>
                                    <option value="rose-gold">Rose Gold</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Sort By</Form.Label>
                                <Form.Select
                                    value={localFilters.sort_by || 'created_at'}
                                    onChange={(e) => handleChange('sort_by', e.target.value)}
                                >
                                    <option value="created_at">Newest First</option>
                                    <option value="price">Price</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Order</Form.Label>
                                <Form.Select
                                    value={localFilters.sort_order || 'desc'}
                                    onChange={(e) => handleChange('sort_order', e.target.value as 'asc' | 'desc')}
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex gap-2">
                        <Button variant="primary" onClick={handleApply} className="flex-grow-1">
                            Apply Filters
                        </Button>
                        <Button variant="outline-secondary" onClick={handleClear}>
                            Clear
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default ProductFilters;