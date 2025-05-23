import "react-image-crop/dist/ReactCrop.css"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { store, persistor } from "./store/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";
import { useEffect } from "react";
import { initTokenRefresh } from "./utils/tokenRefresh";
import { checkForGoogleRedirect } from "./utils/handleGoogleRedirect";

// Import route components
import UserRoutes from "./routes/UserRoutes";
import AdminRoutes from "./routes/AdminRoutes";
function App() {
  // persistor.purge(); // Wipes persisted state

  // Check for Google authentication on mount
  useEffect(() => {
    // Try to handle Google auth if we're on the homepage with auth parameters
    checkForGoogleRedirect();
  }, []);

  // Initialize token refresh mechanism for both admin and user authentication
  useEffect(() => {
    // Initialize if there's either an admin token or a user token
    if (localStorage.getItem('accessToken') || localStorage.getItem('tokenAccess')) {
      const cancelRefresh = initTokenRefresh();
      
      // Clean up function to cancel the refresh timer when component unmounts
      return () => cancelRefresh();
    }
  }, []);

  return (
    <>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <Router>
            <Routes>
              {/* User Routes */}
              <Route path="/*" element={<UserRoutes />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminRoutes />} />
            </Routes>
            
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </Router>
        </PersistGate>
      </Provider>
    </>
  );
}

export default App;
