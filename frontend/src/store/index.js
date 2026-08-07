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
// NOTE: 'token' is intentionally NOT persisted here. The actual token used by
// the axios interceptor (apiService.js) and re-derived by validateToken() on
// every app boot is the raw 'authToken' localStorage key, not this Redux state.
// Persisting it here as well created a second, easily-desynced copy of the
// same value. user/isAuthenticated are still persisted for optimistic UI.
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated'],
  blacklist: ['loading', 'error', 'token', 'tokenValidated']
};

// Root reducer with all slices
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  documents: documentsSlice,
  ui: uiSlice,
  workspaces: workspaceReducer,  // ✅ Added
  invitations: invitationReducer  // ✅ Added
});

// NOTE: Only the 'auth' slice is persisted, and it's already wrapped in its
// own persistReducer above (authPersistConfig). Do NOT wrap rootReducer in a
// second, outer persistReducer here — that's a "nested persist", a known
// redux-persist anti-pattern that double-writes storage and can cause stale
// rehydration. persistStore(store) below picks up the nested auth
// persistReducer just fine without an outer wrap.

// Configure store
export const store = configureStore({
  reducer: rootReducer,
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
