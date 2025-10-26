import {store} from '../store/store';
import { refreshTokenThunk } from '../features/admin/adminAuth/adminAuthSlice';
import { refreshAccessTokenThunk } from '../features/authSlice';

// Global flags to prevent redundant refresh attempts
let isAdminRefreshing = false;
let isUserRefreshing = false;


// Helper function to check if current path is admin path
function isAdminPath() {
  return window.location.pathname.startsWith('/adm');
}
/**
 * Decodes a JWT token to extract its payload without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function decodeToken(token) {
  try {
    // Check if token is valid
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.warn('Invalid token provided to decodeToken');
      return null;
    }
    
    // Split the token and get the payload part (second part)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Token is not in valid JWT format');
      return null;
    }
    
    const base64Url = parts[1];
    // Replace characters for proper base64 decoding
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Decode and parse the payload
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Sets up a proactive token refresh mechanism
 * @returns {Function} Function to cancel the refresh timer
 */
export function setupTokenRefresh() {
  let refreshTimer = null;
  
  // Function to schedule the next token refresh
  function scheduleRefresh() {
    // Clear any existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    
    // Decode token to get expiration time
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return;
    
    // Calculate time until token expires (in milliseconds)
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // Refresh 60 seconds before token expires
    const refreshTimeBeforeExpiry = 60 * 1000; // 60 seconds
    const timeUntilRefresh = timeUntilExpiry - refreshTimeBeforeExpiry;
    
    const performRefresh = async () => {
      // Prevent multiple simultaneous refresh attempts
      if (isAdminRefreshing) {
        console.log('Admin token refresh already in progress, skipping...');
        return;
      }
      
      isAdminRefreshing = true;
      
      try {
        await store.dispatch(refreshTokenThunk()).unwrap();
        scheduleRefresh(); // Schedule next refresh after successful refresh
      } catch (error) {
        console.error('Failed to refresh admin token:', error);
        // Retry after 30 seconds if token still exists
        if (localStorage.getItem('accessToken')) {
          refreshTimer = setTimeout(performRefresh, 30 * 1000);
        }
      } finally {
        isAdminRefreshing = false;
      }
    };
    
    if (timeUntilRefresh <= 0) {
      // Token is already expired or about to expire, refresh immediately
      performRefresh();
    } else {
      // Schedule refresh before token expires
      refreshTimer = setTimeout(performRefresh, timeUntilRefresh);
    }
  }
  
  // Initial scheduling
  scheduleRefresh();
  
  // Return function to cancel the timer if needed
  return () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    isAdminRefreshing = false;
  };
}

/**
 * Sets up a proactive token refresh mechanism for user tokens
 * @returns {Function} Function to cancel the refresh timer
 */
export function setupUserTokenRefresh() {
  let refreshTimer = null;
  
  // Function to schedule the next token refresh
  function scheduleRefresh() {
    // Clear any existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    
    const token = localStorage.getItem('tokenAccess');
    if (!token) {
      return;
    }
    
    // Decode token to get expiration time
    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
      console.warn('Invalid token payload, cannot determine expiration time');
      return;
    }
    
    // Calculate time until token expires (in milliseconds)
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // Refresh 60 seconds before token expires
    const refreshTimeBeforeExpiry = 60 * 1000; // 60 seconds
    const timeUntilRefresh = timeUntilExpiry - refreshTimeBeforeExpiry;
    
    // Function to handle token refresh
    const refreshToken = async () => {
      // Abort if user has logged out and token is gone
      if (!localStorage.getItem('tokenAccess')) {
        return;
      }
      
      // Prevent multiple simultaneous refresh attempts
      if (isUserRefreshing) {
        console.log('User token refresh already in progress, skipping...');
        return;
      }
      
      isUserRefreshing = true;
      
      try {
        const result = await store.dispatch(refreshAccessTokenThunk()).unwrap();
        if (result) {
          // Schedule the next refresh
          scheduleRefresh();
        } else {
          console.warn('Token refresh returned undefined payload');
          // Try again after 30 seconds if there's still a token in localStorage
          if (localStorage.getItem('tokenAccess')) {
            refreshTimer = setTimeout(refreshToken, 30 * 1000);
          }
        }
      } catch (error) {
        console.error('Failed to refresh user token:', error);
        // If token was removed meanwhile (logout), stop further retries
      } finally {
        isUserRefreshing = false;
      }
    };
    
    if (timeUntilRefresh <= 0) {
      // Token is already expired or about to expire, refresh immediately
      refreshToken();
    } else {
      // Schedule refresh before token expires
      refreshTimer = setTimeout(refreshToken, timeUntilRefresh);
    }
  }
  
  // Initial scheduling
  scheduleRefresh();
  
  // Return function to cancel the timer if needed
  return () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    isUserRefreshing = false;
  };
}

// Export a function to initialize the token refresh mechanism
export function initTokenRefresh() {
  let adminCancelFunction = null;
  let userCancelFunction = null;
  
  // Set up listener for token changes in localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'accessToken' && event.newValue) {
      // Admin token was updated, reschedule refresh
      if (adminCancelFunction) adminCancelFunction();
      adminCancelFunction = setupTokenRefresh();
    }
    if (event.key === 'tokenAccess' && event.newValue) {
      // User token was updated, reschedule refresh
      if (userCancelFunction) userCancelFunction();
      userCancelFunction = setupUserTokenRefresh();
    }
  });
  const isInAdminPath = isAdminPath();
  // Initial setup for admin token refresh
  if (isInAdminPath && localStorage.getItem('accessToken')) {
  adminCancelFunction = setupTokenRefresh();
}
  
  // Initial setup for user token refresh
  userCancelFunction = setupUserTokenRefresh();
  
  // Return function to cancel both timers if needed
  return () => {
    if (adminCancelFunction) adminCancelFunction();
    if (userCancelFunction) userCancelFunction();
  };
}
