import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  fetchProductsThunk, 
  fetchCategoriesThunk, 
  fetchBrandsThunk 
} from "../../features/userHomeSlice";
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal
} from "lucide-react";
import ProductCard from "../../components/ProductCard";
import FilterSidebar from "../../components/FilterSidebar";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    products = [], 
    categories = [], 
    brands = [], 
    totalPages = 1, 
    currentPage = 1, 
    loading = false, 
    error = null 
  } = useSelector((state) => state.userProduct || {});

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    priceMin: "",
    priceMax: "",
    sort: "newest",
  });
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
    dispatch(fetchBrandsThunk());
    dispatch(fetchProductsThunk({ page, ...filters }));
  }, [dispatch, page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === filters[name] ? "" : value
    }));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      brand: "",
      priceMin: "",
      priceMax: "",
      sort: "newest",
    });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className={`w-10 h-10 rounded-full ${1 === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`w-10 h-10 rounded-full ${
              number === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
            }`}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`w-10 h-10 rounded-full ${
                totalPages === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
              }`}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // Mobile filter button
  const MobileFilterButton = () => (
    <button
      onClick={() => setShowMobileFilters(true)}
      className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span>Filters</span>
    </button>
  );

  // Mobile filter sidebar
  const MobileFilterSidebar = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 transition-opacity">
      <div className="relative w-4/5 max-w-md h-full bg-white shadow-xl">
        <FilterSidebar
          filters={filters}
          categories={categories}
          brands={brands}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          isMobile={true}
          onClose={() => setShowMobileFilters(false)}
        />
      </div>
    </div>
  );

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Filter Sidebar */}
      {showMobileFilters && <MobileFilterSidebar />}
      
      <div className="container mx-auto px-4 py-6">
        {/* Header with search and filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Our Products</h1>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/* <Search className="h-5 w-5 text-gray-400" /> */}
                </div>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Search products..."
                  className="block w-full pl-12 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                  </button>
                )}
              </div>
              <MobileFilterButton />
              <div className="hidden lg:block">
                <select
                  name="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="newest">Newest</option>
                  <option value="featured">Featured</option>
                  <option value="price-low-to-high">Price: Low to High</option>
                  <option value="price-high-to-low">Price: High to Low</option>
                  <option value="a-z">Name: A to Z</option>
                  <option value="z-a">Name: Z to A</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Active filters */}
          {(filters.category || filters.brand || filters.priceMin || filters.priceMax) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Filters:</span>
              {filters.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {categories.find(c => c._id === filters.category)?.name}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, category: '' }))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                  >
                    <span className="sr-only">Remove filter</span>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {filters.brand && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {brands.find(b => b._id === filters.brand)?.name}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, brand: '' }))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-green-200 text-green-600 hover:bg-green-300"
                  >
                    <span className="sr-only">Remove filter</span>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {(filters.priceMin || filters.priceMax) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ₹{filters.priceMin || '0'} - ₹{filters.priceMax || '∞'}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, priceMin: '', priceMax: '' }))}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-200 text-yellow-600 hover:bg-yellow-300"
                  >
                    <span className="sr-only">Remove filter</span>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filters */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              categories={categories}
              brands={brands}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
