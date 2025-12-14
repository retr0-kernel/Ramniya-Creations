// User types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin';
    is_verified: boolean;
    created_at: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

// Product types
export interface ProductVariant {
    id: string;
    sku: string;
    attributes: Record<string, string>;
    stock: number;
    price_modifier: number;
}

export interface ProductImage {
    id: string;
    url: string;
    is_primary: boolean;
    display_order: number;
}

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    metadata: Record<string, any>;
    variants: ProductVariant[];
    images: ProductImage[];
    created_at: string;
    updated_at: string;
}

export interface ProductsFilter {
    min_price?: number;
    max_price?: number;
    size?: string;
    color?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

// Cart types
export interface CartItem {
    product_id: string;
    variant_id?: string;
    title: string;
    sku: string;
    quantity: number;
    price_cents: number;
    image_url: string;
}

export interface CartState {
    items: CartItem[];
    total: number;
}

// Order types
export interface ShippingAddress {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}

export interface Order {
    id: string;
    user_id: string;
    items: CartItem[];
    shipping_address: ShippingAddress;
    amount_cents: number;
    currency: string;
    status: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    payment_method?: string;
    created_at: string;
    updated_at: string;
    paid_at?: string;
}

export interface CreateOrderRequest {
    items: CartItem[];
    shipping_address: ShippingAddress;
    payment_method: string;
}

export interface CreateOrderResponse {
    order_id: string;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    key_id: string;
}

// Admin types
export interface OrderStats {
    total_orders: number;
    paid_orders: number;
    pending_orders: number;
    failed_orders: number;
    total_revenue: number;
    currency: string;
}

// Razorpay types
export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
}

export interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}
