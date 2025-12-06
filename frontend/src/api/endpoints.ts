export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_EMAIL: '/api/auth/verify-email',
    GOOGLE_OAUTH: '/api/auth/oauth/google',
    GOOGLE_OAUTH_CALLBACK: '/api/auth/oauth/google/callback',

    // Products
    PRODUCTS: '/api/products',
    PRODUCT_DETAIL: (id: string) => `/api/products/${id}`,

    // Orders
    ORDERS: '/api/orders',
    ORDER_DETAIL: (id: string) => `/api/orders/${id}`,
    CREATE_ORDER: '/api/checkout/create-order',
    VERIFY_PAYMENT: '/api/checkout/verify-payment',

    // Admin
    ADMIN_ORDERS: '/api/admin/orders',
    ADMIN_ORDER_STATS: '/api/admin/orders/stats',
    ADMIN_ORDER_STATUS: (id: string) => `/api/admin/orders/${id}/status`,
    ADMIN_PRODUCTS: '/api/admin/products',
    ADMIN_PRODUCT_DETAIL: (id: string) => `/api/admin/products/${id}`,
};
