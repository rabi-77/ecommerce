// import "./App.css";
// import Login from "./pages/user/Login";
// import Register from "./pages/user/Register";
// import ReactCrop from 'react-image-crop'
import "react-image-crop/dist/ReactCrop.css"; 

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { store, persistor } from "./store/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
// import Home from "./pages/user/Home";
import UserRoutes from "./routes/UserRoutes";
import AdminRoutes from "./routes/AdminRoutes";
// import { persistor } from './store/store';
import { ToastContainer } from "react-toastify";
function App() {
  // persistor.purge(); // Wipes persisted state


  return (
    <>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <Router>
          <UserRoutes />

            <AdminRoutes />
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
