import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosClient';
import type { CartItem } from '../../types';

export interface CartState {
    items: CartItem[];
    couponCode: string | null;
    couponDiscount: number;
    loading: boolean;
}

const initialState: CartState = {
    items: [],
    couponCode: null,
    couponDiscount: 0,
    loading: false
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
    try {
        const sessionId = localStorage.getItem('sessionId');
        const { data } = await api.get(`/cart${sessionId ? `?sessionId=${sessionId}` : ''}`);
        return data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
    }
});

export const addToCart = createAsyncThunk('cart/add',
    async (payload: { productId: string; variant?: any; quantity?: number }, { rejectWithValue }) => {
        try {
            let sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('sessionId', sessionId);
            }
            const { data } = await api.post('/cart/add', { ...payload, sessionId });
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
        }
    }
);

export const updateCartItem = createAsyncThunk('cart/update',
    async (payload: { productId: string; sku?: string; quantity: number }, { rejectWithValue }) => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const { data } = await api.put('/cart/update', { ...payload, sessionId });
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update cart');
        }
    }
);

export const removeFromCart = createAsyncThunk('cart/remove',
    async (payload: { productId: string; sku?: string }, { rejectWithValue }) => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            const { data } = await api.delete(`/cart/remove/${payload.productId}?sessionId=${sessionId || ''}${payload.sku ? `&sku=${payload.sku}` : ''}`);
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to remove from cart');
        }
    }
);

export const mergeCart = createAsyncThunk('cart/merge',
    async (sessionId: string, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/cart/merge', { sessionId });
            localStorage.removeItem('sessionId');
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to merge cart');
        }
    }
);

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCartState: (state) => {
            state.items = [];
            state.couponCode = null;
            state.couponDiscount = 0;
        }
    },
    extraReducers: (builder) => {
        const handleCartUpdate = (state: CartState, action: any) => {
            state.loading = false;
            if (action.payload) {
                state.items = action.payload.items || [];
                state.couponCode = action.payload.couponCode || null;
                state.couponDiscount = action.payload.couponDiscount || 0;
            }
        };

        builder
            .addCase(fetchCart.pending, (state) => { state.loading = true; })
            .addCase(fetchCart.fulfilled, handleCartUpdate)
            .addCase(fetchCart.rejected, (state) => { state.loading = false; })
            .addCase(addToCart.pending, (state) => { state.loading = true; })
            .addCase(addToCart.fulfilled, handleCartUpdate)
            .addCase(addToCart.rejected, (state) => { state.loading = false; })
            .addCase(updateCartItem.fulfilled, handleCartUpdate)
            .addCase(removeFromCart.fulfilled, handleCartUpdate)
            .addCase(mergeCart.fulfilled, handleCartUpdate);
    }
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
