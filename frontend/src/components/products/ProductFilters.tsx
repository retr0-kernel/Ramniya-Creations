import React, { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
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
        <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="me-2"
                            style={{ verticalAlign: 'middle' }}
                        >
                            <line x1="4" y1="21" x2="4" y2="14" />
                            <line x1="4" y1="10" x2="4" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12" y2="3" />
                            <line x1="20" y1="21" x2="20" y2="16" />
                            <line x1="20" y1="12" x2="20" y2="3" />
                            <line x1="1" y1="14" x2="7" y2="14" />
                            <line x1="9" y1="8" x2="15" y2="8" />
                            <line x1="17" y1="16" x2="23" y2="16" />
                        </svg>
                        Filters
                    </h5>
                    <Button
                        variant="link"
                        onClick={handleClear}
                        className="text-muted p-0"
                        style={{ fontSize: '0.875rem', textDecoration: 'none' }}
                    >
                        Clear All
                    </Button>
                </div>

                <Form>
                    {/* Price Range Section */}
                    <div className="mb-4">
                        <h6 className="mb-3 fw-semibold" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            💰 Price Range
                        </h6>
                        <div className="px-2">
                            <Form.Group className="mb-3">
                                <Form.Label className="small text-muted mb-1">Minimum Price (₹)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={localFilters.min_price ? localFilters.min_price / 100 : ''}
                                    onChange={(e) => handleChange('min_price', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                                    placeholder="0"
                                    className="form-control-sm"
                                />
                            </Form.Group>

                            <Form.Group className="mb-0">
                                <Form.Label className="small text-muted mb-1">Maximum Price (₹)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={localFilters.max_price ? localFilters.max_price / 100 : ''}
                                    onChange={(e) => handleChange('max_price', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                                    placeholder="100000"
                                    className="form-control-sm"
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <hr style={{ borderColor: 'var(--border)' }} />

                    {/* Attributes Section */}
                    <div className="mb-4">
                        <h6 className="mb-3 fw-semibold" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            📏 Attributes
                        </h6>
                        <div className="px-2">
                            <Form.Group className="mb-3">
                                <Form.Label className="small text-muted mb-1">Size</Form.Label>
                                <Form.Select
                                    value={localFilters.size || ''}
                                    onChange={(e) => handleChange('size', e.target.value || undefined)}
                                    className="form-select-sm"
                                >
                                    <option value="">All Sizes</option>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-0">
                                <Form.Label className="small text-muted mb-1">Color</Form.Label>
                                <Form.Select
                                    value={localFilters.color || ''}
                                    onChange={(e) => handleChange('color', e.target.value || undefined)}
                                    className="form-select-sm"
                                >
                                    <option value="">All Colors</option>
                                    <option value="gold">🟡 Gold</option>
                                    <option value="silver">⚪ Silver</option>
                                    <option value="rose-gold">🌸 Rose Gold</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </div>

                    <hr style={{ borderColor: 'var(--border)' }} />

                    {/* Sort Section */}
                    <div className="mb-4">
                        <h6 className="mb-3 fw-semibold" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            🔄 Sort By
                        </h6>
                        <div className="px-2">
                            <Form.Group className="mb-3">
                                <Form.Label className="small text-muted mb-1">Sort Field</Form.Label>
                                <Form.Select
                                    value={localFilters.sort_by || 'created_at'}
                                    onChange={(e) => handleChange('sort_by', e.target.value)}
                                    className="form-select-sm"
                                >
                                    <option value="created_at">⭐ Newest First</option>
                                    <option value="price">💵 Price</option>
                                    <option value="title">🔤 Name</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-0">
                                <Form.Label className="small text-muted mb-1">Order</Form.Label>
                                <Form.Select
                                    value={localFilters.sort_order || 'desc'}
                                    onChange={(e) => handleChange('sort_order', e.target.value as 'asc' | 'desc')}
                                    className="form-select-sm"
                                >
                                    <option value="desc">↓ High to Low</option>
                                    <option value="asc">↑ Low to High</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </div>

                    {/* Apply Button */}
                    <Button
                        variant="primary"
                        onClick={handleApply}
                        className="w-100 mt-3"
                        size="lg"
                        style={{ fontWeight: '600' }}
                    >
                        Apply Filters
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default ProductFilters;