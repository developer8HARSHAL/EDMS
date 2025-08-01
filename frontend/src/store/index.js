// src/store/index.js - Fixed Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import slices
import authSlice from './slices/authSlice';
import documentsSlice from './slices/documentsSlice';
import uiSlice from './slices/uiSlice';

// Auth persist configuration - more specific
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Only persist essential auth data
  blacklist: ['loading', 'error'] // Don't persist loading states
};

// Root reducer with proper structure
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  documents: documentsSlice,
  ui: uiSlice,
});

// Main persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['documents', 'ui'] // Don't persist documents and UI state
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PURGE',
          'persist/FLUSH',
          'persist/PAUSE'
        ],
        ignoredPaths: ['register', 'rehydrate']
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types for better type checking
export const selectRootState = (state) => state;

export default store;