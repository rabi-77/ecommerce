import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Award } from 'lucide-react';

export const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <Link to={`/products/${product._id}`}>
          <img
            src={product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300?text=No+Image'}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300?text=No+Image';
            }}
          />
        </Link>
        {product.isFeatured && (
          <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-white px-3 py-1 rounded-br-lg shadow-md flex items-center">
            <Award className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">Featured</span>
          </div>
        )}
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
          <Heart className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/products/${product._id}`} className="hover:underline">
            <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
          </Link>
          <Link to={product.brand ? `/brand/${product.brand._id}` : '#'} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded hover:bg-blue-200">
            {product.brand?.name || 'Brand'}
          </Link>
        </div>
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-1">(0)</span>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
          <button 
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => console.log('Add to cart', product._id)}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm">Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
