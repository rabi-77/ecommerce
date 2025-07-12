import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist, checkWishlistItem } from '../../features/wishlist/wishlistSlice';

const WishlistButton = ({ productId, size = 'normal', className = '', product = null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { productStatuses } = useSelector((state) => state.wishlist);
  
  const isInWishlist = productStatuses[productId] || false;
  
  useEffect(() => {
    if (user && productId) {
      dispatch(checkWishlistItem(productId));
    }
  }, [productId, user, dispatch]);

  const toggleWishlist = async () => {
    if (!user) {
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
    
    if (product && !product.isListed) {
      toast.error("This product is currently unavailable", {
        autoClose: 5000,
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        toast.success('Removed from wishlist');
      } else {
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

  const effectivelyInWishlist = isInWishlist;
  
  return (
    <button
      onClick={toggleWishlist}
      disabled={isLoading}
      className={`p-1.5 rounded-full bg-white shadow hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      aria-label={effectivelyInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={effectivelyInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={size === 'large' ? 24 : size === 'normal' ? 20 : size}
        className={effectivelyInWishlist ? 'text-red-500' : 'text-gray-400'}
        fill={effectivelyInWishlist ? 'currentColor' : 'none'}
      />
    </button>
  );
};

export default WishlistButton;
