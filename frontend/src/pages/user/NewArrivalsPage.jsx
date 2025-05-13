import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProductsThunk } from '../../features/userHomeSlice';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const NewArrivalsPage = () => {
  const dispatch = useDispatch();
  const { products = [], loading = false } = useSelector((state) => state.userProduct || {});
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    // Fetch latest products, limit to 6
    dispatch(fetchProductsThunk({ sort: 'newest', limit: 6 }));
  }, [dispatch]);

  useEffect(() => {
    if (products.length > 0) {
      setNewArrivals(products);
    }
  }, [products]);

  if (loading && newArrivals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-gray-800 font-medium">New Arrivals</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Arrivals</h1>
          <p className="text-gray-600">Check out our latest products, fresh off the shelves.</p>
        </div>

        {/* Products Grid */}
        {newArrivals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No new arrivals available</h3>
            <p className="text-gray-500 mb-4">Check back soon for new products or browse our other collections.</p>
            <Link 
              to="/products" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newArrivals.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewArrivalsPage;
