// src/store/slices/authSlice.js - Authentication Redux Slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import jwt_decode from 'jwt-decode';
import axios from 'axios';
import { userApi } from '../../services/apiService';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  tokenValidated: false,
};

// Async thunks for API calls

// Validate token on app initialization
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return { user: null, token: null, isAuthenticated: false };
      }

      // Decode and validate token
      const decoded = jwt_decode(token);
      
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        return { user: null, token: null, isAuthenticated: false };
      }

      // Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify with backend
      try {
        await userApi.getProfile();
        
        return {
          user: {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
          },
          token,
          isAuthenticated: true
        };
      } catch (verifyError) {
        if (verifyError.response?.status === 401) {
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          return { user: null, token: null, isAuthenticated: false };
        }
        throw verifyError;
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      return rejectWithValue(error.message || 'Token validation failed');
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await userApi.login(email, password);
      
      if (!data || !data.token) {
        return rejectWithValue('No authentication token received');
      }

      // Decode token to get user data
      const decoded = jwt_decode(data.token);
      
      return {
        user: {
          id: decoded.id || data.user?.id,
          name: decoded.name || data.user?.name,
          email: decoded.email || data.user?.email,
          role: decoded.role || data.user?.role
        },
        token: data.token
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Register user
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

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      const response = await userApi.updateProfile(profileData);
      
      if (!response || !response.data) {
        return rejectWithValue('Invalid response from server');
      }
      
      // Return updated user data
      return response.data;
    } catch (error) {
      const message = error.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Logout user
    logout: (state) => {
      // Clear localStorage and axios headers
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      
      // Reset state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.tokenValidated = false;
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
    }
  },
  extraReducers: (builder) => {
    // Validate token
    builder
      .addCase(validateToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.tokenValidated = true;
        state.error = null;
      })
      .addCase(validateToken.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.tokenValidated = true;
        state.error = action.payload;
      });

    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Don't auto-login after registration
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Update user data with new profile information
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
export const { clearError, logout, setLoading, updateUser } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectTokenValidated = (state) => state.auth.tokenValidated;

export default authSlice.reducer;