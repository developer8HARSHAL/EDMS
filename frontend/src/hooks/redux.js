// src/hooks/redux.js - Type-safe Redux hooks and utilities
import { useDispatch, useSelector } from 'react-redux';

// Custom typed hooks for better TypeScript support (if needed later)
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Helper hook for async actions with loading states
export const useAsyncAction = () => {
  const dispatch = useAppDispatch();
  
  const executeAsync = async (asyncAction, onSuccess, onError) => {
    try {
      const result = await dispatch(asyncAction);
      
      if (asyncAction.fulfilled.match(result)) {
        onSuccess?.(result.payload);
        return { success: true, data: result.payload };
      } else {
        onError?.(result.payload);
        return { success: false, error: result.payload };
      }
    } catch (error) {
      onError?.(error.message);
      return { success: false, error: error.message };
    }
  };
  
  return { executeAsync };
};

// Hook for handling notifications with Redux
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.ui.notifications);
  
  const addNotification = (notification) => {
    dispatch({ 
      type: 'ui/addNotification', 
      payload: notification 
    });
  };
  
  const removeNotification = (id) => {
    dispatch({ 
      type: 'ui/removeNotification', 
      payload: id 
    });
  };
  
  const clearAll = () => {
    dispatch({ type: 'ui/clearAllNotifications' });
  };
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};

export default {
  useAppDispatch,
  useAppSelector,
  useAsyncAction,
  useNotifications
};