import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProductsThunk, fetchBrandsThunk } from '../../features/userHomeSlice';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const BrandPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { brandId } = useParams();
  
  const { products = [], brands = [], totalPages = 1, currentPage = 1, loading = false } = 
    useSelector((state) => state.userProduct || {});
  
  const [page, setPage] = useState(1);
  const [brandProducts, setBrandProducts] = useState([]);
  const [brand, setBrand] = useState(null);

  useEffect(() => {
    dispatch(fetchBrandsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (brandId && brands.length > 0) {
      const foundBrand = brands.find(b => b._id === brandId);
      if (foundBrand) {
        setBrand(foundBrand);
        dispatch(fetchProductsThunk({ page, brand: brandId }));
      } else {
        navigate('/products');
      }
    }
  }, [brandId, brands, dispatch, navigate, page]);

  useEffect(() => {
    // Only set brand products if we're actually fetching for this brand
    if (brand) {
      setBrandProducts(products);
    }
  }, [products, brand]);

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

  if (loading && brandProducts.length === 0) {
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
          <span className="text-gray-800 font-medium">{brand?.name || 'Brand'}</span>
        </nav>

        {/* Brand Header */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-6">
            {brand?.logo && (
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{brand?.name || 'Brand'}</h1>
              <p className="text-gray-600">{brand?.description || 'Browse our collection of products from this brand.'}</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {brandProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found for this brand</h3>
            <p className="text-gray-500 mb-4">Try browsing our other brands or return to the product listing.</p>
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
              {brandProducts.map(product => (
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

export default BrandPage;
