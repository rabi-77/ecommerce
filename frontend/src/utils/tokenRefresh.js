import {store} from '../store/store';
import { refreshTokenThunk } from '../features/admin/adminAuth/adminAuthSlice';
import { refreshAccessTokenThunk } from '../features/authSlice';

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
    
    
    if (timeUntilRefresh <= 0) {
      // Token is already expired or about to expire, refresh immediately
      store.dispatch(refreshTokenThunk())
        .then(() => scheduleRefresh())
        .catch(error => console.error('Failed to refresh token:', error));
    } else {
      // Schedule refresh before token expires
      refreshTimer = setTimeout(() => {
        store.dispatch(refreshTokenThunk())
          .then(() => scheduleRefresh())
          .catch(error => console.error('Failed to refresh token:', error));
      }, timeUntilRefresh);
    }
  }
  
  // Initial scheduling
  scheduleRefresh();
  
  // Return function to cancel the timer if needed
  return () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
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
    const refreshToken = () => {
      // Abort if user has logged out and token is gone
      if (!localStorage.getItem('tokenAccess')) {
        return;
      }
      
      store.dispatch(refreshAccessTokenThunk())
        .then((result) => {
          if (result.payload) {
            // Schedule the next refresh
            scheduleRefresh();
          } else {
            console.warn('Token refresh returned undefined payload');
            // Try again after 30 seconds if there's still a token in localStorage
            if (localStorage.getItem('tokenAccess')) {
              refreshTimer = setTimeout(refreshToken, 30 * 1000);
            }
          }
        })
        .catch(error => {
          console.error('Failed to refresh user token:', error);
          // If token was removed meanwhile (logout), stop further retries
        });
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
  };
}

// Export a function to initialize the token refresh mechanism
export function initTokenRefresh() {
  // Set up listener for token changes in localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'accessToken' && event.newValue) {
      // Admin token was updated, reschedule refresh
      setupTokenRefresh();
    }
    if (event.key === 'tokenAccess' && event.newValue) {
      // User token was updated, reschedule refresh
      setupUserTokenRefresh();
    }
  });
  
  // Initial setup for admin token refresh
  const cancelAdminRefresh = setupTokenRefresh();
  
  // Initial setup for user token refresh
  const cancelUserRefresh = setupUserTokenRefresh();
  
  // Return function to cancel both timers if needed
  return () => {
    cancelAdminRefresh();
    cancelUserRefresh();
  };
}
