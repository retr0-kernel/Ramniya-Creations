import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import {type Product,type ProductsFilter,type Pagination } from '../../types';

interface ProductsState {
    products: Product[];
    currentProduct: Product | null;
    pagination: Pagination | null;
    loading: boolean;
    error: string | null;
    filters: ProductsFilter;
}

const initialState: ProductsState = {
    products: [],
    currentProduct: null,
    pagination: null,
    loading: false,
    error: null,
    filters: {
        page: 1,
        limit: 12,
        sort_by: 'created_at',
        sort_order: 'desc',
    },
};

// Async thunks
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (filters: ProductsFilter, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });

            const response = await axios.get(`${API_ENDPOINTS.PRODUCTS}?${params}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error || 'Failed to fetch products'
            );
        }
    }
);

export const fetchProductById = createAsyncThunk(
    'products/fetchProductById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_ENDPOINTS.PRODUCT_DETAIL(id));
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error || 'Failed to fetch product'
            );
        }
    }
);

// Slice
const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch products
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.products;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch product by ID
        builder
            .addCase(fetchProductById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentProduct = action.payload;
            })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setFilters, clearFilters, clearError } = productsSlice.actions;
export default productsSlice.reducer;
