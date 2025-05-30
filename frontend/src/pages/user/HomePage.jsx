import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategoriesThunk, fetchBrandsThunk, fetchProductsThunk } from '../../features/userHomeSlice';
import { ChevronRight, ArrowRight, ChevronLeft } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const HomePage = () => {
  const dispatch = useDispatch();
  const { 
    products = [], 
    categories = [], 
    brands = [],
    loading = false
  } = useSelector((state) => state.userProduct || {});
  
  const [featuredProducts, setFeaturedProducts] = useState([]);

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

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      {/* Hero Section */}
      <section className="relative bg-[var(--primary)] text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          {/* <img 
            src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80" 
            alt="Shoes Collection" 
            className="w-full h-full object-cover object-center"
          /> */}
        </div>
        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-heading mb-4">Step into Style and Comfort</h1>
            <p className="text-xl mb-8 opacity-90 font-light">Discover our premium collection of shoes designed for every occasion. From casual to formal, we've got you covered.</p>
            <Link 
              to="/products" 
              className="inline-flex items-center bg-[var(--secondary)] text-[var(--text-dark)] px-8 py-3 rounded-md font-medium hover:bg-[var(--secondary-dark)] transition-colors"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/*new arrival*/}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="section-title text-[var(--text-dark)]">New Arrivals</h2>
            <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center">
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          {products && products.length>0  ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">New Products Coming Soon</h3>
              <p className="text-gray-500 text-center max-w-md">
                We're adding new products to our collection. Check back soon for our latest offerings.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-[var(--background-cream)]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="section-title text-[var(--text-dark)]">Shop by Category</h2>
            <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center">
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length > 0 ? (
              categories.slice(0, 6).map((category) => (
                <Link 
                  key={category._id} 
                  to={`/category/${category._id}`}
                  className="group relative overflow-hidden rounded-lg shadow-lg h-64 transition-transform hover:scale-[1.02] hover-lift"
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
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              // Show "Coming Soon" message when no categories are available
              <div className="col-span-3 flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow">
                <h3 className="text-2xl font-bold text-gray-800 mb-2"> Coming Soon</h3>
                <p className="text-gray-500 text-center max-w-md">
                  We're working on adding exciting new categories for you to explore. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="section-title text-[var(--text-dark)]">Featured Products</h2>
            <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center">
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Featured Products Coming Soon</h3>
              <p className="text-gray-500 text-center max-w-md">
                We're curating a selection of featured products for you. Check back soon to see our recommendations.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Brands */}
      <section className="py-16 bg-[var(--background-cream)]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="section-title text-[var(--text-dark)]">Popular Brands</h2>
            <Link to="/products" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center">
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          {brands.length > 0 ? (
            <div className="relative">
              {/* Add custom CSS to hide scrollbar but keep functionality */}
              <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              
              <div className="overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex space-x-6">
                  {brands.map((brand) => (
                    <Link 
                      key={brand._id} 
                      to={`/brand/${brand._id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover-lift min-w-[180px] h-[180px] flex-shrink-0 relative group"
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
                      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm py-2 px-3 transition-all">
                        <h3 className="text-sm font-semibold text-gray-800 text-center truncate">{brand.name}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Scroll indicators */}
              <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 z-10">
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 z-10">
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          ) : (
            // Show "Coming Soon" message when no brands are available
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Brands Coming Soon</h3>
              <p className="text-gray-500 text-center max-w-md">
                We're partnering with top brands to bring you the best products. Stay tuned!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Pair?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Browse our extensive collection of premium footwear and step into comfort and style.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center bg-white text-blue-900 px-8 py-3 rounded-full font-medium hover:bg-blue-50 transition-colors"
          >
            Shop All Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Newsletter</h2>
            <p className="text-gray-600 mb-6">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
