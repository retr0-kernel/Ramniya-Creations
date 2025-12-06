import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { AuthState } from '../../types';

// Initial state
const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('access_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
    error: null, // REMOVED the 'w' typo here
};

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(API_ENDPOINTS.LOGIN, credentials);
            const { access_token, user } = response.data;

            // Store in localStorage
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            return { token: access_token, user };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error || 'Login failed'
            );
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (
        data: { name: string; email: string; password: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(API_ENDPOINTS.REGISTER, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error || 'Registration failed'
            );
        }
    }
);

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Register
        builder
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;