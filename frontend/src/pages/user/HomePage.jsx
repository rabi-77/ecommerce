import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategoriesThunk, fetchBrandsThunk, fetchProductsThunk } from '../../features/userHomeSlice';
import { ChevronRight, ArrowRight, ChevronLeft, ShoppingBag, Star, TrendingUp, Newspaper, Plane, NewspaperIcon, GuitarIcon } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import HeroBanner from '../../components/HeroBanner';
import { fetchUserProfile } from '../../features/userprofile/profileSlice';
import { motion } from 'framer-motion';
import ProductDetailsBanner from '../../components/ProductDetailsBanner';

const HomePage = () => {
  const dispatch = useDispatch();
  const { 
    products = [], 
    categories = [], 
    brands = [],
    loading = false
  } = useSelector((state) => state.userProduct || {});
  const {user} = useSelector((state)=>state.auth)
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const brandsScrollRef = useRef(null);
  
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Modified staggerContainer to ensure children are always visible
  const staggerContainer = {
    hidden: { opacity: 1 },  // Changed from 0 to 1 to ensure container is always visible
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());
    dispatch(fetchBrandsThunk());
    dispatch(fetchProductsThunk({ page: 1, limit: 8 }));
  }, [dispatch]);

  useEffect(() => {
    if (products.length > 0) {
      const featuredProducts = products.filter(product => product.isFeatured);
      setFeaturedProducts(featuredProducts.slice(0, 4));
    }
  }, [products]);
  
  // Handle brand scroll
  const scrollBrands = (direction) => {
    if (brandsScrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = brandsScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      brandsScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      {/* Announcement Banner */}
      <ProductDetailsBanner />
      
      {/* Hero Section */}
      <HeroBanner />
      
      {/* New Arrivals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-10"
          >
            <h2 className="text-3xl font-bold text-[var(--text-dark)] flex items-center">
              <ShoppingBag className="mr-2 text-blue-600" size={28} />
              New Arrivals
            </h2>
            <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
                View All
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
          
          {products && products.length>0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product, index) => (
                <motion.div 
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="transform transition-all duration-300 hover:shadow-lg"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-lg"
            >
              <div className="text-blue-500 mb-4 text-5xl">🛍️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">New Products Coming Soon</h3>
              <p className="text-gray-500 text-center max-w-md">
                We're adding new products to our collection. Check back soon for our latest offerings.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-[var(--background-cream)]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-10"
          >
            <h2 className="text-3xl font-bold text-[var(--text-dark)] flex items-center">
              <ShoppingBag className="mr-2 text-blue-600" size={28} />
              Shop by Category
            </h2>
            <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
                View All
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length > 0 ? (
              categories.slice(0, 6).map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                  style={{ zIndex: 10 }}
                >
                  <Link 
                    to={`/category/${category._id}`}
                    className="group relative overflow-hidden h-64 transition-transform hover:scale-[1.02] block"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary-dark)]/80 to-transparent z-10"></div>
                    <img 
                      src={category.imageUrl || `https://source.unsplash.com/random/600x400/?shoes,${category.name}`} 
                      alt={category.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <h3 className="text-xl font-heading text-white mb-1">{category.name}</h3>
                      <p className="text-white/80 mb-3 font-light">Explore Collection</p>
                      <span className="inline-flex items-center text-sm text-[var(--secondary)] font-medium">
                        Shop Now
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              // Show "Coming Soon" message when no categories are available
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-3 flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-lg"
              >
                <div className="text-blue-500 mb-4 text-5xl">📦</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Categories Coming Soon</h3>
                <p className="text-gray-500 text-center max-w-md">
                  We're working on adding exciting new categories for you to explore. Check back soon!
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-10"
          >
            <h2 className="text-3xl font-bold text-[var(--text-dark)] flex items-center">
              <Star className="mr-2 text-blue-600" size={28} />
              Featured Products
            </h2>
            <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
                View All
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div 
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="transform transition-all duration-300 hover:shadow-lg"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-lg"
            >
              <div className="text-yellow-500 mb-4 text-5xl">⭐</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Featured Products Coming Soon</h3>
              <p className="text-gray-500 text-center max-w-md">
                We're curating a selection of featured products for you. Check back soon to see our recommendations.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Popular Brands */}
      <section className="py-16 bg-[var(--background-cream)]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-10"
          >
            <h2 className="text-3xl font-bold text-[var(--text-dark)] flex items-center">
              <Star className="mr-2 text-blue-600" size={28} />
              Popular Brands
            </h2>
            <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
                View All
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
          
          {brands.length > 0 ? (
            <div className="relative" style={{ zIndex: 5 }}>
              {/* Add custom CSS to hide scrollbar but keep functionality */}
              <style >{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                @keyframes float {
                  0% { transform: translateY(0px); }
                  50% { transform: translateY(-5px); }
                  100% { transform: translateY(0px); }
                }
                .float-animation {
                  animation: float 3s ease-in-out infinite;
                }
              `}</style>
              
              <div className="overflow-x-auto pb-4 hide-scrollbar" ref={brandsScrollRef}>
                <div className="flex space-x-6">
                  {brands.map((brand, index) => (
                    <motion.div
                      key={brand._id}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="float-animation"
                      style={{ animationDelay: `${index * 0.2}s`, zIndex: 20 }}
                    >
                      <Link 
                        to={`/brand/${brand._id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col min-w-[180px] h-[180px] flex-shrink-0 relative group hover:shadow-xl transition-all duration-300"
                        style={{ position: 'relative', zIndex: 10 }}
                      >
                        <div className="h-full w-full overflow-hidden">
                          {brand.imageUrl ? (
                            <img 
                              src={brand.imageUrl} 
                              alt={brand.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400 text-5xl">📦</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm py-2 px-3 transition-all group-hover:bg-blue-50">
                          <h3 className="text-sm font-semibold text-gray-800 text-center truncate">{brand.name}</h3>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Scroll indicators */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scrollBrands('left')}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-3 z-10"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scrollBrands('right')}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-3 z-10"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </motion.button>
            </div>
          ) : (
            // Show "Coming Soon" message when no brands are available
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-lg"
            >
              <div className="text-blue-500 mb-4 text-5xl">🎁</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Brands Coming Soon</h3>
              <p className="text-gray-500 text-center max-w-md">
                We're partnering with top brands to bring you the best products. Stay tuned!
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <img 
            src="https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80" 
            alt="Shoes background" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Find Your Perfect Pair?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Browse our extensive collection of premium footwear and step into comfort and style.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to="/products" 
                className="inline-flex items-center bg-white text-blue-900 px-8 py-4 rounded-full font-medium hover:bg-blue-50 transition-colors shadow-lg group"
              >
                Shop All Products
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
