import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import documentsSlice from './slices/documentsSlice';
import uiSlice from './slices/uiSlice';
import workspaceReducer from './slices/workspaceSlice';  // ✅ Added
import invitationReducer from './slices/invitationSlice';  // ✅ Added

// Auth persist configuration
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'],
  blacklist: ['loading', 'error']
};

// Root reducer with all slices
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  documents: documentsSlice,
  ui: uiSlice,
  workspaces: workspaceReducer,  // ✅ Added
  invitations: invitationReducer  // ✅ Added
});

// Main persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
  blacklist: ['documents', 'ui', 'workspaces', 'invitations']  // You can persist more if needed
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
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

export const persistor = persistStore(store);
export const selectRootState = (state) => state;
export default store;
