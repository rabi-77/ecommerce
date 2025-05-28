import Login from "../pages/user/Login";
import Register from "../pages/user/Register";
import Home from "../pages/user/Home";
import HomePage from "../pages/user/HomePage";
import CategoryPage from "../pages/user/CategoryPage";
import BrandPage from "../pages/user/BrandPage";
import NewArrivalsPage from "../pages/user/NewArrivalsPage";
import FeaturedProductsPage from "../pages/user/FeaturedProductsPage";
import { Routes, Route } from "react-router-dom";
import UserLayout from "../Layouts/UserLayout";
import ProductDetails from "../pages/user/ProductDetails";
import NotFound from "../pages/NotFound";
import GoogleAuthHandler from "../components/GoogleAuthHandler";
import VerifyEmailChange from "../pages/user/VerifyEmailChange";
import Wishlist from "../pages/user/Wishlist";
import Cart from '../pages/user/Cart';
import Orders from '../pages/user/Orders';
import OrderDetails from '../pages/user/OrderDetails';
import Checkout from '../pages/user/Checkout';
import OrderSuccess from '../pages/user/OrderSuccess';

// Profile components
import ProfileLayout from "../pages/user/profile/ProfileLayout";
import ProfileDetails from "../pages/user/profile/ProfileDetails";
import EditProfile from "../pages/user/profile/EditProfile";
import ChangePassword from "../pages/user/profile/ChangePassword";
import ChangeEmail from "../pages/user/profile/ChangeEmail";
import Addresses from "../pages/user/profile/Addresses";

const UserRoutes = () => {
  return (
    <Routes>
      {/* Special route to handle Google Auth redirect */}
      <Route path="" element={<GoogleAuthHandler />} />
      
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="verify-email" element={<VerifyEmailChange />} />
      <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<Home />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="category/:categoryId" element={<CategoryPage />} />
        <Route path="brand/:brandId" element={<BrandPage />} />
        <Route path="new-arrivals" element={<NewArrivalsPage />} />
        <Route path="featured" element={<FeaturedProductsPage />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<Orders />} />
        <Route path="order/:id" element={<OrderDetails />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/success/:id" element={<OrderSuccess />} />
      </Route>

      {/* Profile Routes */}
      <Route path="profile" element={<UserLayout />}>
        <Route element={<ProfileLayout />}>
          <Route index element={<ProfileDetails />} />
          <Route path="edit" element={<EditProfile />} />
          <Route path="password" element={<ChangePassword />} />
          <Route path="email" element={<ChangeEmail />} />
          <Route path="addresses" element={<Addresses />} />
        </Route>
      </Route>
      
      {/* Catch-all route for 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default UserRoutes;
