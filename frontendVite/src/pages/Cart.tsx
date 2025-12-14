import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { updateQuantity, removeFromCart } from '../features/cart/cartSlice';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

const Cart: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { items, total } = useAppSelector((state) => state.cart);
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const handleUpdateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
        dispatch(updateQuantity({ product_id: productId, variant_id: variantId, quantity }));
    };

    const handleRemove = (productId: string, variantId: string | undefined) => {
        dispatch(removeFromCart({ product_id: productId, variant_id: variantId }));
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/checkout' } });
        } else {
            navigate('/checkout');
        }
    };

    const itemsCount = items.reduce((count, item) => count + item.quantity, 0);

    if (items.length === 0) {
        return (
            <Container className="py-5">
                <div className="empty-state">
                    <h3>Your Cart is Empty</h3>
                    <p>Add some products to get started</p>
                    <Link to="/products">
                        <Button variant="primary" size="lg" className="mt-3">
                            Browse Products
                        </Button>
                    </Link>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Shopping Cart
            </h1>

            <Row>
                <Col lg={8} className="mb-4">
                    {items.map((item) => (
                        <CartItem
                            key={`${item.product_id}-${item.variant_id}`}
                            item={item}
                            onUpdateQuantity={(qty) => handleUpdateQuantity(item.product_id, item.variant_id, qty)}
                            onRemove={() => handleRemove(item.product_id, item.variant_id)}
                        />
                    ))}
                </Col>

                <Col lg={4}>
                    <CartSummary
                        total={total}
                        itemsCount={itemsCount}
                        onCheckout={handleCheckout}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export default Cart;