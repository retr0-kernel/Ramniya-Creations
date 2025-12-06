import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../../types';

// Load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Failed to load cart from localStorage', error);
        return [];
    }
};

// Save cart to localStorage
const saveCartToStorage = (items: CartItem[]) => {
    try {
        localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
        console.error('Failed to save cart to localStorage', error);
    }
};

// Calculate total
const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + item.price_cents * item.quantity, 0);
};

const initialState: CartState = {
    items: loadCartFromStorage(),
    total: 0,
};

initialState.total = calculateTotal(initialState.items);

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<CartItem>) => {
            const existingItem = state.items.find(
                (item) =>
                    item.product_id === action.payload.product_id &&
                    item.variant_id === action.payload.variant_id
            );

            if (existingItem) {
                existingItem.quantity += action.payload.quantity;
            } else {
                state.items.push(action.payload);
            }

            state.total = calculateTotal(state.items);
            saveCartToStorage(state.items);
        },

        removeFromCart: (state, action: PayloadAction<{ product_id: string; variant_id?: string }>) => {
            state.items = state.items.filter(
                (item) =>
                    !(
                        item.product_id === action.payload.product_id &&
                        item.variant_id === action.payload.variant_id
                    )
            );

            state.total = calculateTotal(state.items);
            saveCartToStorage(state.items);
        },

        updateQuantity: (
            state,
            action: PayloadAction<{ product_id: string; variant_id?: string; quantity: number }>
        ) => {
            const item = state.items.find(
                (item) =>
                    item.product_id === action.payload.product_id &&
                    item.variant_id === action.payload.variant_id
            );

            if (item) {
                item.quantity = action.payload.quantity;
                if (item.quantity <= 0) {
                    state.items = state.items.filter((i) => i !== item);
                }
            }

            state.total = calculateTotal(state.items);
            saveCartToStorage(state.items);
        },

        clearCart: (state) => {
            state.items = [];
            state.total = 0;
            saveCartToStorage([]);
        },

        syncCart: (state, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
            state.total = calculateTotal(state.items);
            saveCartToStorage(state.items);
        },
    },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, syncCart } =
    cartSlice.actions;
export default cartSlice.reducer;
