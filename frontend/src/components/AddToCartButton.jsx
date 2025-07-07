import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { addToCart, fetchCart } from '../features/cart/cartSlice';
import { fetchWishlist, setProductInWishlist } from '../features/wishlist/wishlistSlice';

// Maximum quantity allowed per product (across all variants)
const MAX_QUANTITY_PER_PRODUCT = 10;

const AddToCartButton = ({ 
  productId, 
  size,
  quantity = 1,
  showIcon = true,
  fullWidth = false,
  className = '',
  buttonText = 'Add to Cart',
  product = null,
  onSizeRequired = null,
  onSuccess = null
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  const { user } = useSelector(state => state.auth);
  const { addingToCart } = useSelector(state => state.cart);
  const { items: cartItems } = useSelector(state => state.cart);

  // Check if adding this quantity would exceed the maximum per product
  const checkQuantityLimit = () => {
    if (!cartItems || cartItems.length === 0) return true;
    
    // Find items of the same product in cart
    const sameProductItems = cartItems.filter(item => item.product._id === productId);
    
    const totalQuantity = sameProductItems.reduce((total, item) => total + item.quantity, 0);
    
    return (totalQuantity + quantity) <= MAX_QUANTITY_PER_PRODUCT;
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error(
        <div>
          Please login to add items to your cart.
          <button 
            onClick={() => navigate('/login')} 
            className="ml-2 underline text-blue-500"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="ml-2 underline text-blue-500"
          >
            Register
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

    if (!size) {
      if (product && product.variants && product.variants.length > 0) {
        const availableVariants = product.variants.filter(v => v.stock > 0);
        if (availableVariants.length === 1) {
          const availableSize = availableVariants[0].size;
          addToCartWithSize(availableSize);
          return;
        } else if (availableVariants.length > 1) {
          if (onSizeRequired) {
            onSizeRequired(product);
            return;
          } else {
            navigate(`/products/${productId}`);
            toast.info('Please select a size for this product');
            return;
          }
        } else {
          toast.error('This product is out of stock');
          return;
        }
      } else {
        toast.error('Please select a size');
        return;
      }
    }

    if (!checkQuantityLimit()) {
      toast.error(`You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes)`);
      return;
    }

    setIsAdding(true);
    
    addToCartWithSize(size);
  };

  const addToCartWithSize = (selectedSize) => {
    if(quantity > MAX_QUANTITY_PER_PRODUCT){
      toast.error(`You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes)`);
      setIsAdding(false);
      return;
    }
    dispatch(addToCart({ productId, size: selectedSize, quantity }))
      .unwrap()
      .then(() => {
        setIsAdded(true);
        toast.success('Item added to cart');
        
        dispatch(setProductInWishlist({ productId, inWishlist: false }));
        
        dispatch(fetchCart());
        
        dispatch(fetchWishlist());
        
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
        
        setTimeout(() => {
          setIsAdded(false);
        }, 2000);
      })
      .catch((error) => {
        if (error && error.message) {
          toast.error(error.message, {
            autoClose: 5000,
            position: "top-center",
          });
        } else {
          toast.error('Failed to add item to cart,product not available', {
            autoClose: 5000,
            position: "top-center",
          });
        }
      })
      .finally(() => {
        setIsAdding(false);
      });
  };

  const buttonClasses = `
    ${fullWidth ? 'w-full' : ''}
    ${isAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} 
    text-white py-2 px-4 rounded-md font-medium transition duration-200
    flex items-center justify-center
    ${isAdding || addingToCart ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding || addingToCart}
      className={buttonClasses}
    >
      {isAdded ? (
        <>
          <Check size={18} className="mr-2" />
          Added to Cart
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart size={18} className="mr-2" />}
          {isAdding || addingToCart ? 'Adding...' : buttonText}
        </>
      )}
    </button>
  );
};

export default AddToCartButton;
