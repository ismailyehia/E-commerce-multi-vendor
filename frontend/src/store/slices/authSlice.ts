import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axiosClient';
import { mergeCart } from './cartSlice';
import type { User } from '../../types';

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const userStr = localStorage.getItem('user');
const initialState: AuthState = {
    user: userStr ? JSON.parse(userStr) : null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading: false,
    error: null
};

export const login = createAsyncThunk('auth/login',
    async (credentials: { email: string; password: string }, { dispatch, rejectWithValue }) => {
        try {
            const { data } = await api.post('/auth/login', credentials);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            const sessionId = localStorage.getItem('sessionId');
            if (sessionId) {
                await dispatch(mergeCart(sessionId));
            }

            return data.user;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Login failed');
        }
    }
);

export const register = createAsyncThunk('auth/register',
    async (userData: { name: string; email: string; password: string }, { dispatch, rejectWithValue }) => {
        try {
            const { data } = await api.post('/auth/register', userData);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            const sessionId = localStorage.getItem('sessionId');
            if (sessionId) {
                await dispatch(mergeCart(sessionId));
            }

            return data.user;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Registration failed');
        }
    }
);

export const fetchMe = createAsyncThunk('auth/fetchMe',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            api.post('/auth/logout').catch(() => { });
        },
        clearError: (state) => { state.error = null; },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            localStorage.setItem('user', JSON.stringify(action.payload));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true; })
            .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true; })
            .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; state.isAuthenticated = true; })
            .addCase(fetchMe.rejected, (state) => { state.user = null; state.isAuthenticated = false; });
    }
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
