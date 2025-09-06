// src/store/slices/authSlice.js - FIXED Authentication Redux Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import { userApi } from '../../services/apiService';

// Initial state with proper structure
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  tokenValidated: false,
};

// ✅ FIXED: Helper function to set axios headers properly
const setAxiosAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Axios auth header set:', axios.defaults.headers.common['Authorization']);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log('❌ Axios auth header removed');
  }
};

// Async thunks for API calls

// ✅ FIXED: Validate token on app initialization
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Starting token validation...');
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.log('❌ No token found in localStorage');
        return { user: null, token: null, isAuthenticated: false };
      }

      console.log('🔍 Token found, decoding...');
      
      // ✅ FIXED: Proper JWT decode with error handling
      let decoded;
      try {
        decoded = jwtDecode(token);
        console.log('✅ Token decoded successfully:', { id: decoded.id, email: decoded.email, exp: decoded.exp });
      } catch (decodeError) {
        console.error('❌ JWT decode failed:', decodeError);
        localStorage.removeItem('authToken');
        setAxiosAuthHeader(null);
        return { user: null, token: null, isAuthenticated: false };
      }
      
      // Check if token is expired
      const now = Date.now();
      const expiry = decoded.exp * 1000;
      console.log('🕒 Token expiry check:', { now: new Date(now), expiry: new Date(expiry), expired: expiry < now });
      
      if (expiry < now) {
        console.log('❌ Token expired, removing...');
        localStorage.removeItem('authToken');
        setAxiosAuthHeader(null);
        return { user: null, token: null, isAuthenticated: false };
      }

      // ✅ FIXED: Set axios header BEFORE making API calls
      setAxiosAuthHeader(token);

      // Verify with backend
      try {
        console.log('🔍 Verifying token with backend...');
        const profileResponse = await userApi.getProfile();
        console.log('✅ Backend verification successful:', profileResponse);
        
        const userData = {
          id: decoded.id,
          name: decoded.name || profileResponse.name,
          email: decoded.email || profileResponse.email,
          role: decoded.role || profileResponse.role
        };
        
        console.log('✅ Token validation complete:', userData);
        
        return {
          user: userData,
          token,
          isAuthenticated: true
        };
      } catch (verifyError) {
        console.error('❌ Backend verification failed:', verifyError);
        
        if (verifyError.response?.status === 401) {
          console.log('❌ Token invalid on server, removing...');
          localStorage.removeItem('authToken');
          setAxiosAuthHeader(null);
          return { user: null, token: null, isAuthenticated: false };
        }
        throw verifyError;
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      localStorage.removeItem('authToken');
      setAxiosAuthHeader(null);
      return rejectWithValue(error.message || 'Token validation failed');
    }
  }
);

// ✅ FIXED: Login user with proper header setup
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const data = await userApi.login(email, password);
      console.log('✅ Login API response:', data);
      
      if (!data || !data.token) {
        console.error('❌ No token in login response');
        return rejectWithValue('No authentication token received');
      }

      // Store token
      localStorage.setItem('authToken', data.token);
      console.log('✅ Token stored in localStorage');

      // ✅ FIXED: Set axios header immediately
      setAxiosAuthHeader(data.token);

      // Decode token to get user data
      let decoded;
      try {
        decoded = jwtDecode(data.token);
        console.log('✅ Login token decoded:', decoded);
      } catch (decodeError) {
        console.error('❌ Failed to decode login token:', decodeError);
        return rejectWithValue('Invalid token received from server');
      }
      
      const userData = {
        id: decoded.id || data.user?.id,
        name: decoded.name || data.user?.name,
        email: decoded.email || data.user?.email,
        role: decoded.role || data.user?.role
      };
      
      console.log('✅ Login successful:', userData);
      
      return {
        user: userData,
        token: data.token
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Register user (unchanged)
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const data = await userApi.register(name, email, password);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Update user profile (unchanged)
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      const response = await userApi.updateProfile(profileData);
      
      if (!response || !response.data) {
        return rejectWithValue('Invalid response from server');
      }
      
      return response.data;
    } catch (error) {
      const message = error.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

// ✅ FIXED: Auth slice with better logging
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // ✅ FIXED: Logout user with proper cleanup
    logout: (state) => {
      console.log('🚪 Logging out user...');
      // Clear localStorage and axios headers
      localStorage.removeItem('authToken');
      setAxiosAuthHeader(null);
      
      // Reset state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.tokenValidated = false;
      
      console.log('✅ Logout complete');
    },
    
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Update user data (for real-time updates)
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // ✅ NEW: Force set auth state (for debugging)
    forceSetAuthState: (state, action) => {
      const { user, token, isAuthenticated } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = isAuthenticated;
      state.tokenValidated = true;
      if (token) {
        setAxiosAuthHeader(token);
      }
    }
  },
  extraReducers: (builder) => {
    // ✅ FIXED: Validate token with better state management
    builder
      .addCase(validateToken.pending, (state) => {
        console.log('🔄 Token validation pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        console.log('✅ Token validation fulfilled:', action.payload);
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.tokenValidated = true;
        state.error = null;
      })
      .addCase(validateToken.rejected, (state, action) => {
        console.log('❌ Token validation rejected:', action.payload);
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.tokenValidated = true;
        state.error = action.payload;
      });

    // ✅ FIXED: Login user with proper state updates
    builder
      .addCase(loginUser.pending, (state) => {
        console.log('🔄 Login pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('✅ Login fulfilled:', action.payload);
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.tokenValidated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('❌ Login rejected:', action.payload);
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // Register user (unchanged)
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update profile (unchanged)
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const { clearError, logout, setLoading, updateUser, forceSetAuthState } = authSlice.actions;

// ✅ FIXED: Safe selectors with better error handling
export const selectAuth = (state) => {
  try {
    return state?.auth || initialState;
  } catch (error) {
    console.warn('Auth selector error:', error);
    return initialState;
  }
};

export const selectUser = (state) => {
  try {
    return state?.auth?.user || null;
  } catch (error) {
    console.warn('User selector error:', error);
    return null;
  }
};

export const selectIsAuthenticated = (state) => {
  try {
    return state?.auth?.isAuthenticated || false;
  } catch (error) {
    console.warn('IsAuthenticated selector error:', error);
    return false;
  }
};

export const selectAuthLoading = (state) => {
  try {
    return state?.auth?.loading || false;
  } catch (error) {
    console.warn('Loading selector error:', error);
    return false;
  }
};

export const selectAuthError = (state) => {
  try {
    return state?.auth?.error || null;
  } catch (error) {
    console.warn('Error selector error:', error);
    return null;
  }
};

export const selectTokenValidated = (state) => {
  try {
    return state?.auth?.tokenValidated || false;
  } catch (error) {
    console.warn('TokenValidated selector error:', error);
    return false;
  }
};

// Additional utility selectors
export const selectAuthInitialized = (state) => {
  try {
    return state?.auth !== undefined;
  } catch (error) {
    console.warn('AuthInitialized selector error:', error);
    return false;
  }
};

export const selectAuthReady = (state) => {
  try {
    const auth = state?.auth;
    return auth && auth.tokenValidated !== undefined;
  } catch (error) {
    console.warn('AuthReady selector error:', error);
    return false;
  }
};

export default authSlice.reducer;