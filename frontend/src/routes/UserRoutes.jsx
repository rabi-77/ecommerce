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

const UserRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<Home />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="category/:categoryId" element={<CategoryPage />} />
        <Route path="brand/:brandId" element={<BrandPage />} />
        <Route path="new-arrivals" element={<NewArrivalsPage />} />
        <Route path="featured" element={<FeaturedProductsPage />} />
      </Route>
      
      {/* Catch-all route for 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default UserRoutes;
