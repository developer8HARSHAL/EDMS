import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import jwtDecode from 'jwt-decode';
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



// Async thunks for API calls

// ✅ FIXED: Validate token on app initialization
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Starting token validation...');
      const token = localStorage.getItem('authToken');

      if (!token) {
        return { user: null, token: null, isAuthenticated: false };
      }

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (decodeError) {
        localStorage.removeItem('authToken');
        return { user: null, token: null, isAuthenticated: false };
      }

      const now = Date.now();
      const expiry = decoded.exp * 1000;

      if (expiry < now) {
        localStorage.removeItem('authToken');
        return { user: null, token: null, isAuthenticated: false };
      }

      // Verify with backend
      try {
        const profileResponse = await userApi.getProfile();
        const profile = profileResponse?.data || profileResponse;

        const userData = {
          id: decoded.id,
          name: decoded.name || profile.name,
          email: decoded.email || profile.email,
          role: decoded.role || profile.role,
          avatar: profile.avatar || 'avatar-01',
          createdAt: profile.createdAt,
          // Without this, isGuest silently disappears on every refresh —
          // it's set correctly right after guest-login, but validateToken
          // (which runs on every page load) rebuilds the user object from
          // scratch and was never copying this field across.
          isGuest: profile.isGuest || false
        };

        return {
          user: userData,
          token,
          isAuthenticated: true
        };
      } catch (verifyError) {
        if (verifyError.response?.status === 401) {
          localStorage.removeItem('authToken');
          return { user: null, token: null, isAuthenticated: false };
        }
        throw verifyError;
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      return rejectWithValue(error.message || 'Token validation failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await userApi.login(email, password);

      if (!data || !data.token) {
        return rejectWithValue('No authentication token received');
      }

      // Store token (apiService interceptor reads from localStorage)
      localStorage.setItem('authToken', data.token);

      // Decode token to get user data
      let decoded;
      try {
        decoded = jwtDecode(data.token);
      } catch (decodeError) {
        return rejectWithValue('Invalid token received from server');
      }

      const userData = {
        id: decoded.id || data.user?.id,
        name: decoded.name || data.user?.name,
        email: decoded.email || data.user?.email,
        role: decoded.role || data.user?.role,
        avatar: data.user?.avatar || 'avatar-01',
        createdAt: data.user?.createdAt
      };

      return {
        user: userData,
        token: data.token
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Guest login — starts a session on the shared demo account, no credentials needed
export const guestLoginUser = createAsyncThunk(
  'auth/guestLoginUser',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userApi.guestLogin();

      if (!data || !data.token) {
        return rejectWithValue('No authentication token received');
      }

      localStorage.setItem('authToken', data.token);

      let decoded;
      try {
        decoded = jwtDecode(data.token);
      } catch (decodeError) {
        return rejectWithValue('Invalid token received from server');
      }

      const userData = {
        id: decoded.id || data.user?.id,
        name: decoded.name || data.user?.name,
        email: decoded.email || data.user?.email,
        role: decoded.role || data.user?.role,
        avatar: data.user?.avatar || 'avatar-01',
        createdAt: data.user?.createdAt,
        isGuest: true
      };

      return {
        user: userData,
        token: data.token
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Guest login failed';
      return rejectWithValue(message);
    }
  }
);

// Register user — now stores token for auto-login
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const data = await userApi.register(name, email, password);

      // Store token if returned (enables auto-login after registration)
      if (data && data.token) {
        localStorage.setItem('authToken', data.token);

        let decoded;
        try {
          decoded = jwtDecode(data.token);
        } catch (e) {
          // Token decode failed — still return success, user can login manually
        }

        return {
          user: data.user || (decoded ? {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
          } : null),
          token: data.token
        };
      }

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

    logout: (state) => {
      // Clear localStorage
      localStorage.removeItem('authToken');

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
    },

    forceSetAuthState: (state, action) => {
      const { user, token, isAuthenticated } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = isAuthenticated;
      state.tokenValidated = true;
    }
  },
  extraReducers: (builder) => {
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
        state.tokenValidated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    builder
      .addCase(guestLoginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(guestLoginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.tokenValidated = true;
        state.error = null;
      })
      .addCase(guestLoginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Auto-login: if token was returned, set auth state
        if (action.payload?.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.tokenValidated = true;
        }
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