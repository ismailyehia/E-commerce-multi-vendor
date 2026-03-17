import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    searchQuery: string;
    theme: 'light' | 'dark';
}

const initialState: UIState = {
    sidebarOpen: true,
    mobileMenuOpen: false,
    searchQuery: '',
    theme: 'light'
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
        toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen; },
        setSearchQuery: (state, action: PayloadAction<string>) => { state.searchQuery = action.payload; },
        setTheme: (state, action: PayloadAction<'light' | 'dark'>) => { state.theme = action.payload; },
        closeMobileMenu: (state) => { state.mobileMenuOpen = false; }
    }
});

export const { toggleSidebar, toggleMobileMenu, setSearchQuery, setTheme, closeMobileMenu } = uiSlice.actions;
export default uiSlice.reducer;
