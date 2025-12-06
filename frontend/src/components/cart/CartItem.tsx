import React from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { CartItem as CartItemType } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
    return (
        <Card className="mb-3">
            <Card.Body>
                <div className="d-flex gap-3">
                    <img
                        src={item.image_url}
                        alt={item.title}
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        className="rounded"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                    />

                    <div className="flex-grow-1">
                        <h6 className="mb-1">{item.title}</h6>
                        {item.sku && (
                            <small className="text-muted d-block mb-2">SKU: {item.sku}</small>
                        )}
                        <div className="price mb-2">{formatPrice(item.price_cents)}</div>

                        <div className="d-flex align-items-center gap-3">
                            <Form.Group className="mb-0" style={{ width: '100px' }}>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={item.quantity}
                                    onChange={(e) => {
                                        const qty = parseInt(e.target.value);
                                        if (qty > 0 && qty <= 99) {
                                            onUpdateQuantity(qty);
                                        }
                                    }}
                                    size="sm"
                                />
                            </Form.Group>

                            <Button variant="outline-danger" size="sm" onClick={onRemove}>
                                Remove
                            </Button>
                        </div>
                    </div>

                    <div className="text-end">
                        <div className="price">
                            {formatPrice(item.price_cents * item.quantity)}
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default CartItem;
