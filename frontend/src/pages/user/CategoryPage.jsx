import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { fetchProductsThunk, fetchCategoriesThunk } from '../../features/userHomeSlice';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const CategoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  
  const { products = [], categories = [], totalPages = 1, currentPage = 1, loading = false } = 
    useSelector((state) => state.userProduct || {});
  
  const [page, setPage] = useState(1);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [isNavigating, setIsNavigating] = useState(true);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
  }, [dispatch]);

  useEffect(() => {
    // Set navigating state to true when categoryId changes
    setIsNavigating(true);
    
    // Scroll to top when navigating to a new category
    window.scrollTo(0, 0);
    
    if (categoryId && categories.length > 0) {
      const foundCategory = categories.find(cat => cat._id === categoryId);
      if (foundCategory) {
        setCategory(foundCategory);
        dispatch(fetchProductsThunk({ page, category: categoryId }))
          .finally(() => {
            setIsNavigating(false);
          });
      } else {
        navigate('/products');
      }
    }
  }, [categoryId, categories, dispatch, navigate, page]);

  useEffect(() => {
    // Only set category products if we're actually fetching for this category
    if (category) {
      setCategoryProducts(products);
    }
  }, [products, category]);

  useEffect(() => {
    // Reset navigating state when loading completes
    if (!loading && isNavigating) {
      setIsNavigating(false);
    }
  }, [loading]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-4 py-2 rounded-md ${
              pageNum === currentPage 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>
    );
  };

  if (loading || isNavigating) {
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
          <Link to="/products" className="hover:text-blue-600">Products</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-gray-800 font-medium">{category?.name || 'Category'}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.name || 'Category'}</h1>
          <p className="text-gray-600">{category?.description || 'Browse our collection of products in this category.'}</p>
        </div>

        {/* Products Grid */}
        {categoryProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found in this category</h3>
            <p className="text-gray-500 mb-4">Try browsing our other categories or return to the product listing.</p>
            <Link 
              to="/products" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
