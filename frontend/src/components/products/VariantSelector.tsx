import React from 'react';
import { Form, Badge } from 'react-bootstrap';
import { ProductVariant } from '../../types';

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedVariant: ProductVariant | null;
    onSelect: (variant: ProductVariant) => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
                                                             variants,
                                                             selectedVariant,
                                                             onSelect,
                                                         }) => {
    if (variants.length === 0) return null;

    // Group variants by attribute keys
    const attributeKeys = Array.from(
        new Set(variants.flatMap((v) => Object.keys(v.attributes)))
    );

    return (
        <div className="mb-4">
            <h6 className="mb-3">Select Variant</h6>

            {attributeKeys.map((key) => {
                const values = Array.from(new Set(variants.map((v) => v.attributes[key])));

                return (
                    <div key={key} className="mb-3">
                        <Form.Label className="text-capitalize">{key}</Form.Label>
                        <div className="d-flex flex-wrap gap-2">
                            {values.map((value) => {
                                const variant = variants.find((v) => v.attributes[key] === value);
                                const isSelected = selectedVariant?.attributes[key] === value;
                                const isOutOfStock = variant && variant.stock === 0;

                                return (
                                    <Badge
                                        key={value}
                                        bg={isSelected ? 'primary' : 'light'}
                                        text={isSelected ? 'white' : 'dark'}
                                        className={`p-2 ${!isOutOfStock ? 'cursor-pointer' : 'opacity-50'}`}
                                        style={{
                                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                            fontSize: '0.9rem',
                                            border: isSelected ? 'none' : '1px solid #dee2e6'
                                        }}
                                        onClick={() => {
                                            if (!isOutOfStock && variant) {
                                                onSelect(variant);
                                            }
                                        }}
                                    >
                                        {value}
                                        {isOutOfStock && ' (Out of Stock)'}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {selectedVariant && (
                <div className="mt-3">
                    <small className="text-muted">
                        SKU: {selectedVariant.sku} | Stock: {selectedVariant.stock} available
                    </small>
                </div>
            )}
        </div>
    );
};

export default VariantSelector;
