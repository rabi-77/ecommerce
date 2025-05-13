import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../Layouts/AdminLayout";
import AdminLogin from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import Products from "../pages/admin/Products";
import Orders from "../pages/admin/Orders";
import Users from "../pages/admin/Users";
import Brand from "../pages/admin/Brand";
import Offers from "../pages/admin/Offers";
import Settings from "../pages/admin/Settings";
import Banner from "../pages/admin/Banner";
import Coupons from "../pages/admin/Coupons";
import Category from "../pages/admin/Category";
import ProtectedRoute from "./ProtectedRoutes";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />


      <Route element={<ProtectedRoute/>} >
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="product" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<Users />} />
        <Route path="brands" element={<Brand />} />
        <Route path="offers" element={<Offers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="banner" element={<Banner />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="category" element={<Category />} />
      </Route>
      </Route >
    </Routes>
  );
};

export default AdminRoutes;
