import "react-image-crop/dist/ReactCrop.css"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { store, persistor } from "./store/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";
import { useEffect } from "react";
import { initTokenRefresh } from "./utils/tokenRefresh";

// Import route components
import UserRoutes from "./routes/UserRoutes";
import AdminRoutes from "./routes/AdminRoutes";
function App() {
  // persistor.purge(); // Wipes persisted state

  // Initialize token refresh mechanism for admin authentication
  useEffect(() => {
    // Only initialize if there's an access token
    if (localStorage.getItem('accessToken')) {
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
