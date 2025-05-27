import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist, checkWishlistItem, setProductInWishlist } from '../../features/wishlist/wishlistSlice';

const WishlistButton = ({ productId, size = 'normal', className = '', product = null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get auth state, wishlist state, and cart state from Redux
  const { user } = useSelector((state) => state.auth);
  const { productStatuses } = useSelector((state) => state.wishlist);
  const { items: cartItems } = useSelector((state) => state.cart);
  
  // Check if product is in wishlist
  const isInWishlist = productStatuses[productId] || false;
  
  // Check if product is already in cart
  const isInCart = cartItems && cartItems.some(item => item.product._id === productId);
  
  useEffect(() => {
    if (user && productId) {
      dispatch(checkWishlistItem(productId));
    }
  }, [productId, user, dispatch]);
  
  // Effect to update wishlist status when cart changes
  useEffect(() => {
    // If product is in cart, it should not be in wishlist
    if (isInCart && isInWishlist) {
      // Update the local Redux state immediately
      dispatch(setProductInWishlist({ productId, inWishlist: false }));
    }
  }, [isInCart, productId, isInWishlist, dispatch]);

  const toggleWishlist = async () => {
    if (!user) {
      // Show toast notification for guest users
      toast.error(
        <div>
          Please login to add items to your wishlist.
          <button 
            onClick={() => navigate('/login')} 
            className="ml-2 underline text-blue-500"
          >
            Login
          </button>
        </div>,
        { duration: 5000 }
      );
      return;
    }
    
    // Check if product is unlisted (if product object is provided)
    if (product && !product.isListed) {
      toast.error("This product is currently unavailable", {
        autoClose: 5000,
        position: "top-center",
      });
      return;
    }
    
    // Check if trying to add to wishlist and product is already in cart
    if (!isInWishlist && isInCart) {
      toast.error('This product is already in your cart. Items cannot be in both cart and wishlist simultaneously.');
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await dispatch(removeFromWishlist(productId)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        // Add to wishlist
        await dispatch(addToWishlist(productId)).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error(error?.message || 'Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the actual state to display
  // This ensures we show the correct state even before the backend confirms
  const effectivelyInWishlist = isInWishlist && !isInCart;
  
  return (
    <button
      onClick={toggleWishlist}
      disabled={isLoading || (!effectivelyInWishlist && isInCart)}
      className={`p-1.5 rounded-full bg-white shadow hover:bg-gray-50 transition-colors ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      } ${(!effectivelyInWishlist && isInCart) ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      aria-label={effectivelyInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={(!effectivelyInWishlist && isInCart) ? 'Product is in cart' : (effectivelyInWishlist ? 'Remove from wishlist' : 'Add to wishlist')}
    >
      <Heart
        size={size === 'large' ? 24 : size === 'normal' ? 20 : size}
        className={effectivelyInWishlist ? 'text-red-500' : (isInCart ? 'text-gray-300' : 'text-gray-400')}
        fill={effectivelyInWishlist ? 'currentColor' : 'none'}
      />
    </button>
  );
};

export default WishlistButton;
