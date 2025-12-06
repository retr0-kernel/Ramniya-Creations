export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_EMAIL: '/api/auth/verify',

    // Products
    PRODUCTS: '/api/products',
    PRODUCT_DETAIL: (id: string) => `/api/products/${id}`,

    // Admin Products
    ADMIN_PRODUCTS: '/api/admin/products',
    ADMIN_PRODUCT_DETAIL: (id: string) => `/api/admin/products/${id}`,
    ADMIN_PRODUCT_IMAGES: (id: string) => `/api/admin/products/${id}/images`,

    // Orders
    ORDERS: '/api/orders',
    ORDER_DETAIL: (id: string) => `/api/orders/${id}`,

    // Checkout
    CREATE_ORDER: '/api/checkout/create-order',
    VERIFY_PAYMENT: '/api/checkout/verify-payment',

    // Admin Orders
    ADMIN_ORDERS: '/api/admin/orders',
    ADMIN_ORDER_DETAIL: (id: string) => `/api/admin/orders/${id}`,
    ADMIN_ORDER_STATUS: (id: string) => `/api/admin/orders/${id}/status`,
    ADMIN_ORDER_STATS: '/api/admin/orders/stats',
};
