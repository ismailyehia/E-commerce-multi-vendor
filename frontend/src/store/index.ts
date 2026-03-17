import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import uiReducer from './slices/uiSlice';
import type { AuthState } from './slices/authSlice';
import type { CartState } from './slices/cartSlice';
import type { UIState } from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        ui: uiReducer
    }
});

export interface RootState {
    auth: AuthState;
    cart: CartState;
    ui: UIState;
}
export type AppDispatch = typeof store.dispatch;
