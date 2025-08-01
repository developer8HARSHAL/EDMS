// src/store/slices/uiSlice.js - UI State Redux Slice
import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  // Theme and appearance
  theme: 'light',
  sidebarCollapsed: false,
  
  // Loading states
  globalLoading: false,
  
  // Notifications/Toasts
  notifications: [],
  
  // Modals and dialogs
  modals: {
    confirmDelete: {
      isOpen: false,
      data: null
    },
    documentPreview: {
      isOpen: false,
      documentId: null
    },
    shareDocument: {
      isOpen: false,
      documentId: null
    },
    userProfile: {
      isOpen: false
    }
  },
  
  // Layout and responsive
  isMobile: false,
  screenSize: 'desktop',
  
  // Search and filters UI state
  searchVisible: false,
  filtersVisible: false,
  
  // Document list view preferences
  viewMode: 'grid', // 'grid' or 'list'
  
  // Error handling
  globalError: null,
  
  // Network status
  isOnline: true,
  connectionStatus: 'connected'
};

// Helper function to generate notification ID
const generateNotificationId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Sidebar management
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Global loading
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    // Notifications management
    addNotification: (state, action) => {
      const notification = {
        id: generateNotificationId(),
        timestamp: Date.now(),
        autoRemove: true,
        duration: 5000,
        ...action.payload
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Modal management
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName].isOpen = true;
        if (data) {
          state.modals[modalName].data = data;
        }
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName].isOpen = false;
        state.modals[modalName].data = null;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName].isOpen = false;
        state.modals[modalName].data = null;
      });
    },
    
    // Responsive and layout
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    
    setScreenSize: (state, action) => {
      state.screenSize = action.payload;
    },
    
    // Search and filters
    setSearchVisible: (state, action) => {
      state.searchVisible = action.payload;
    },
    
    toggleSearch: (state) => {
      state.searchVisible = !state.searchVisible;
    },
    
    setFiltersVisible: (state, action) => {
      state.filtersVisible = action.payload;
    },
    
    toggleFilters: (state) => {
      state.filtersVisible = !state.filtersVisible;
    },
    
    // View mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    toggleViewMode: (state) => {
      state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
    },
    
    // Global error handling
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Network status
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
      state.connectionStatus = action.payload ? 'connected' : 'disconnected';
    },
    
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    
    // Reset UI state
    resetUIState: (state) => {
      return { ...initialState, theme: state.theme };
    }
  }
});

// Export actions
export const {
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  setGlobalLoading,
  addNotification,
  removeNotification,
  clearAllNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setIsMobile,
  setScreenSize,
  setSearchVisible,
  toggleSearch,
  setFiltersVisible,
  toggleFilters,
  setViewMode,
  toggleViewMode,
  setGlobalError,
  clearGlobalError,
  setOnlineStatus,
  setConnectionStatus,
  resetUIState
} = uiSlice.actions;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectNotifications = (state) => state.ui.notifications;
export const selectModals = (state) => state.ui.modals;
export const selectModal = (modalName) => (state) => state.ui.modals[modalName];
export const selectIsMobile = (state) => state.ui.isMobile;
export const selectScreenSize = (state) => state.ui.screenSize;
export const selectSearchVisible = (state) => state.ui.searchVisible;
export const selectFiltersVisible = (state) => state.ui.filtersVisible;
export const selectViewMode = (state) => state.ui.viewMode;
export const selectGlobalError = (state) => state.ui.globalError;
export const selectIsOnline = (state) => state.ui.isOnline;
export const selectConnectionStatus = (state) => state.ui.connectionStatus;

// Notification helper selectors
export const selectActiveNotifications = (state) => 
  state.ui.notifications.filter(notification => !notification.dismissed);

export const selectNotificationsByType = (type) => (state) =>
  state.ui.notifications.filter(notification => notification.type === type);

export default uiSlice.reducer;