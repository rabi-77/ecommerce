import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Award } from 'lucide-react';
import WishlistButton from './user/WishlistButton';

export const ProductCard = ({ product }) => {
  return (
    <div className="product-card hover-lift">
      <div className="relative">
        <Link to={`/products/${product._id}`}>
          <img
            src={product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300?text=No+Image'}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300?text=No+Image';
            }}
          />
        </Link>
        {product.isFeatured && (
          <div className="absolute top-0 left-0 bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-light)] text-[var(--text-dark)] px-3 py-1 rounded-br-lg shadow-md flex items-center">
            <Award className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">Featured</span>
          </div>
        )}
        <WishlistButton 
          productId={product._id} 
          className="absolute top-2 right-2"
          product={product}
        />
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/products/${product._id}`} className="hover:text-[var(--primary)] transition-colors">
            <h3 className="font-heading text-lg text-[var(--text-dark)] line-clamp-1">{product.name}</h3>
          </Link>
          <Link 
            to={product.brand ? `/brand/${product.brand._id}` : '#'} 
            className="bg-[var(--background-cream)] text-[var(--primary)] text-xs font-medium px-2.5 py-0.5 rounded hover:bg-[var(--primary-light)] hover:text-white transition-colors"
          >
            {product.brand?.name || 'Brand'}
          </Link>
        </div>
        {/* <div className="flex items-center mb-3">
          <div className="flex text-[var(--secondary)]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="text-xs text-[var(--text-light)] ml-1">(0)</span>
        </div> */}
        {/* <div className="mt-auto pt-4 border-t border-[var(--border-light)] flex justify-between items-center">
          {product.effectivePrice && product.effectivePrice < product.price ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 line-through">₹{product.price}</span>
              <span className="text-lg font-bold text-[var(--primary)]">₹{product.effectivePrice}</span>
              {product.appliedOffer && (
                <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded">
                  {product.appliedOffer.percentage ? `${product.appliedOffer.percentage}% OFF` : `₹${product.appliedOffer.amount} OFF`}
                </span>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-[var(--primary)]">₹{product.price}</span>
          )}
          <Link 
            to={`/products/${product._id}`} 
            className="px-3 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-md hover:bg-[var(--primary-dark)] transition-colors"
          >
            View Details
          </Link>
        </div> */}
        <div className="mt-auto pt-4 border-t border-[var(--border-light)]">
  {/* Always render price row with consistent spacing */}
  <div className="flex justify-between items-end mb-1 min-h-[24px]"> {/* Fixed min-height */}
    <div className="flex items-baseline gap-2">
      {product.effectivePrice && product.effectivePrice < product.price ? (
        <>
          <span className="text-lg font-bold text-[var(--primary)] font-sans">₹{product.effectivePrice}</span>
          <span className="text-sm text-gray-500 line-through">₹{product.price}</span>
        </>
      ) : (
        <span className="text-lg font-bold text-[var(--primary)] font-sans">₹{product.price}</span>
      )}
    </div>
    <Link 
      to={`/products/${product._id}`} 
      className="px-3 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-md hover:bg-[var(--primary-dark)] transition-colors whitespace-nowrap"
    >
      View Details
    </Link>
  </div>

  {/* Offer badge - always takes space but only visible when needed */}
  <div className="min-h-[24px] mt-1"> {/* Fixed min-height */}
    {product.effectivePrice && product.effectivePrice < product.price && product.appliedOffer && (
      <span className="inline-block text-xs font-medium text-white bg-[var(--primary)] px-2 py-1 rounded-md font-sans">
        {product.appliedOffer.percentage ? `${product.appliedOffer.percentage}% OFF` : `₹${product.appliedOffer.amount} OFF`}
      </span>
    )}
  </div>
</div>
      </div>
    </div>
  );
};

export default ProductCard;
