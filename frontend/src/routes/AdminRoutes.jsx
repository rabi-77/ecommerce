import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../Layouts/AdminLayout";
import AdminLogin from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import Products from "../pages/admin/Products";
import Orders from "../pages/admin/Orders";
import OrderList from "../pages/admin/OrderList";
import OrderDetails from "../pages/admin/OrderDetails";
import Inventory from "../pages/admin/Inventory";
import Users from "../pages/admin/Users";
import Brand from "../pages/admin/Brand";
import Offers from "../pages/admin/Offers";
import Settings from "../pages/admin/Settings";
import Banner from "../pages/admin/Banner";
import Coupons from "../pages/admin/Coupons";
import Category from "../pages/admin/Category";
import AdminNotFound from "../pages/admin/NotFound";
import ProtectedRoute from "./ProtectedRoutes";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route element={<ProtectedRoute/>} >
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="product" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="users" element={<Users />} />
          <Route path="brands" element={<Brand />} />
          <Route path="offers" element={<Offers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="banner" element={<Banner />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="category" element={<Category />} />
        </Route>
      </Route>
      
      {/* Catch-all route for admin 404 Not Found */}
      <Route path="*" element={<AdminNotFound />} />
    </Routes>
  );
};

export default AdminRoutes;
