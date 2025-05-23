/**
 * A simple utility to handle Google authentication redirect
 * This doesn't affect the existing login/logout functionality
 */

// Function to check if we're on a Google redirect
export const checkForGoogleRedirect = () => {
  // Only run this on the homepage with search parameters
  if (window.location.pathname === '/' && window.location.search.includes('tokenAccess')) {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenAccess = urlParams.get('tokenAccess');
    const tokenRefresh = urlParams.get('tokenRefresh');
    const userDataParam = urlParams.get('userData');
    
    if (tokenAccess && userDataParam) {
      try {
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userDataParam));
        
        // Store in localStorage (this is what your existing code expects)
        localStorage.setItem('tokenAccess', tokenAccess);
        if (tokenRefresh) {
          localStorage.setItem('tokenRefresh', tokenRefresh);
        }
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Google authentication successful');
        
        // Remove query parameters from URL to prevent re-processing
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Force a storage event to notify components that localStorage has changed
        window.dispatchEvent(new Event('storage'));
        
        return true;
      } catch (error) {
        console.error('Error processing Google redirect:', error);
      }
    }
  }
  
  return false;
};
