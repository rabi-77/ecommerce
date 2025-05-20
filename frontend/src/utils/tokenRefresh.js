import {store} from '../store/store';
import { refreshTokenThunk } from '../features/admin/adminAuth/adminAuthSlice';

/**
 * Decodes a JWT token to extract its payload without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function decodeToken(token) {
  try {
    // Split the token and get the payload part (second part)
    const base64Url = token.split('.')[1];
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
    
    // Refresh 30 seconds before token expires
    const refreshTimeBeforeExpiry = 30 * 1000; // 30 seconds
    const timeUntilRefresh = timeUntilExpiry - refreshTimeBeforeExpiry;
    
    console.log(`Token expires in ${timeUntilExpiry / 1000} seconds. Will refresh in ${timeUntilRefresh / 1000} seconds.`);
    
    if (timeUntilRefresh <= 0) {
      // Token is already expired or about to expire, refresh immediately
      console.log('Token is about to expire, refreshing immediately...');
      store.dispatch(refreshTokenThunk())
        .then(() => scheduleRefresh())
        .catch(error => console.error('Failed to refresh token:', error));
    } else {
      // Schedule refresh before token expires
      console.log(`Scheduling token refresh in ${timeUntilRefresh / 1000} seconds`);
      refreshTimer = setTimeout(() => {
        console.log('Refreshing token proactively...');
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

// Export a function to initialize the token refresh mechanism
export function initTokenRefresh() {
  // Set up listener for token changes in localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'accessToken' && event.newValue) {
      // Token was updated, reschedule refresh
      setupTokenRefresh();
    }
  });
  
  // Initial setup
  return setupTokenRefresh();
}
