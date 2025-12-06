import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Order, CreateOrderRequest, CreateOrderResponse, Pagination } from '../../types';

interface OrdersState {
    orders: Order[];
    currentOrder: Order | null;
    pagination: Pagination | null;
    loading: boolean;
    error: string | null;
}

const initialState: OrdersState = {
    orders: [],
    currentOrder: null,
    pagination: null,
    loading: false,
    error: null,
};

// Async thunks
export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (orderData: CreateOrderRequest, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.CREATE_ORDER, orderData);
            return response.data as CreateOrderResponse;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create order');
        }
    }
);

export const verifyPayment = createAsyncThunk(
    'orders/verifyPayment',
    async (
        paymentData: {
            order_id: string;
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(API_ENDPOINTS.VERIFY_PAYMENT, paymentData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Payment verification failed');
        }
    }
);

export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (params: { page?: number; limit?: number; status?: string }, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.status) queryParams.append('status', params.status);

            const response = await axios.get(`${API_ENDPOINTS.ORDERS}?${queryParams}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
        }
    }
);

export const fetchOrderById = createAsyncThunk(
    'orders/fetchOrderById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.ORDER_DETAIL(id));
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch order');
        }
    }
);

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
    },
    extraReducers: (builder) => {
        // Create order
        builder
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Verify payment
        builder
            .addCase(verifyPayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyPayment.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload.order;
            })
            .addCase(verifyPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch orders
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.orders;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch order by ID
        builder
            .addCase(fetchOrderById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
