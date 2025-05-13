import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategoriesThunk, fetchBrandsThunk, fetchProductsThunk } from '../../features/userHomeSlice';
import { ChevronRight, ArrowRight } from 'lucide-react';
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
      setFeaturedProducts(products.slice(0, 4));
    }
  }, [products]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-indigo-800 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <img 
            src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80" 
            alt="Shoes Collection" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Step into Style and Comfort</h1>
            <p className="text-xl mb-8 opacity-90">Discover our premium collection of shoes designed for every occasion. From casual to formal, we've got you covered.</p>
            <Link 
              to="/products" 
              className="inline-flex items-center bg-white text-blue-900 px-8 py-3 rounded-full font-medium hover:bg-blue-50 transition-colors"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.slice(0, 6).map((category) => (
              <Link 
                key={category._id} 
                to={`/category/${category._id}`}
                className="group relative overflow-hidden rounded-lg shadow-lg h-64 transition-transform hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <img 
                  src={category.imageUrl || `https://source.unsplash.com/random/600x400/?shoes,${category.name}`} 
                  alt={category.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                  <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                  <p className="text-white/80 mb-3">Explore Collection</p>
                  <span className="inline-flex items-center text-sm text-white font-medium">
                    Shop Now
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Brands */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Popular Brands</h2>
            <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {brands.slice(0, 6).map((brand) => (
              <Link 
                key={brand._id} 
                to={`/brand/${brand._id}`}
                className="bg-white rounded-lg shadow p-6 flex items-center justify-center hover:shadow-md transition-shadow"
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-12 object-contain" />
                ) : (
                  <h3 className="text-xl font-bold text-gray-800">{brand.name}</h3>
                )}
              </Link>
            ))}
          </div>
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
