import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ChevronRight, AlertTriangle } from 'lucide-react';
import { fetchCart, updateCartItem, removeFromCart, clearCart, clearCartError } from '../../features/cart/cartSlice';
import CouponForm from '../../components/checkout/CouponForm';
import Loader from '../../components/common/Loader';

// Maximum quantity allowed per product (across all variants)
const MAX_QUANTITY_PER_PRODUCT = 10;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get auth state from Redux
  const { user } = useSelector((state) => state.auth);
  
  // Get cart state from Redux
  const { 
    items, 
    summary, 
    loading, 
    error, 
    updatingCart, 
    removingFromCart, 
    clearingCart, 
    coupon 
  } = useSelector((state) => state.cart);

  // Track which items are valid for checkout
  const [validItems, setValidItems] = useState([]);
  const [hasInvalidItems, setHasInvalidItems] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error(
        <div>
          Please login to view your cart.
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
      navigate('/');
      return;
    }
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Fetch cart items when component mounts
    dispatch(fetchCart());
  }, [user, navigate, dispatch]);
  
  useEffect(() => {
    if (location.key !== 'default') {
      window.scrollTo(0, 0);
    }
  }, [location.key]);
  
  // Handle error state
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCartError());
    }
  }, [error, dispatch]);

  // Validate cart items for checkout
  useEffect(() => {
    if (items && items.length > 0) {
      const valid = items.filter(item => {
        const product = item.product;
        const variant = product.variants.find(v => v.size === item.variant.size);
        
        // Check if product is available and has stock
        return product.isListed && 
               !product.isDeleted && 
               product.category && 
               product.category.isListed && 
               !product.category.isDeleted &&
               product.brand &&
               product.brand.isListed &&
               !product.brand.isDeleted &&
               variant && 
               variant.stock >= item.quantity;
      });
      
      setValidItems(valid);
      setHasInvalidItems(valid.length < items.length);
    } else {
      setValidItems([]);
      setHasInvalidItems(false);
    }
  }, [items]);

  const handleUpdateQuantity = (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    
    // Validate quantity
    if (newQuantity < 1) return;
    
    // Find the item to check stock
    const item = items.find(item => item._id === cartItemId);
    if (!item) return;
    
    const variant = item.product.variants.find(v => v.size === item.variant.size);
    if (!variant) return;
    
    // Check if new quantity exceeds stock for this variant
    if (newQuantity > variant.stock) {
      toast.error(`Only ${variant.stock} items available in this size`);
      return;
    }
    
    // Calculate total quantity for this product across all variants
    const productId = item.product._id;
    const otherVariantsOfSameProduct = items.filter(i => 
      i.product._id === productId && i._id !== cartItemId
    );
    
    const totalProductQuantity = otherVariantsOfSameProduct.reduce(
      (total, i) => total + i.quantity, 0
    );
    
    // Check if new total quantity exceeds maximum allowed per product
    if (totalProductQuantity + newQuantity > MAX_QUANTITY_PER_PRODUCT) {
      toast.error(`You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes)`);
      return;
    }
    
    dispatch(updateCartItem({ cartItemId, quantity: newQuantity }))
      .unwrap()
      .then(() => {
        dispatch(fetchCart());
      })
      .catch((error) => {
        // Error is already handled in the error useEffect
      });
  };

  const handleRemoveFromCart = (cartItemId) => {
    dispatch(removeFromCart(cartItemId))
      .unwrap()
      .then(() => {
        toast.success('Item removed from cart');
        dispatch(fetchCart());
      })
      .catch((error) => {
        // Error is already handled in the error useEffect
      });
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart())
        .unwrap()
        .then(() => {
          toast.success('Cart cleared');
        })
        .catch((error) => {
          // Error is already handled in the error useEffect
        });
    }
  };

  const handleCheckout = () => {
    // Check if there are valid items for checkout
    if (validItems.length === 0) {
      toast.error('No valid items in cart for checkout');
      return;
    }
    
    // Navigate to checkout page
    navigate('/checkout');
  };

  // Return price considering offer
  const getEffectivePrice = (product) => {
    
    return product.effectivePrice ?? product.price;
  };

  // Check if an item is valid for checkout
  const isItemValid = (item) => {
    const product = item.product;
    const variant = product.variants.find(v => v.size === item.variant.size);
    
    return product.isListed && 
           !product.isDeleted && 
           product.category && 
           product.category.isListed && 
           !product.category.isDeleted &&
           variant && 
           variant.stock >= item.quantity;
  };

  // Derive applied coupon object for CouponForm success banner
  const appliedCouponObj = coupon ? {
    code: coupon.code,
    discountAmount: summary?.couponDiscount || 0,
    type: coupon.discountType
  } : null;

  const handleCouponApplied = () => {/* nothing extra here, redux already holds summary */};
  const handleCouponRemoved = () => {/* nothing extra here */};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-gray-800 font-medium">Shopping Cart</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <ShoppingCart size={64} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              to="/products" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Cart Items ({items.length})
                    </h2>
                    <button 
                      onClick={handleClearCart}
                      disabled={clearingCart}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Clear Cart
                    </button>
                  </div>
                </div>
                
                {hasInvalidItems && (
                  <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex items-start">
                    <AlertTriangle size={20} className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-700">
                      Some items in your cart are unavailable or out of stock. These items will be excluded from checkout.
                    </p>
                  </div>
                )}
                
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const isValid = isItemValid(item);
                    const variant = item.product.variants.find(v => v.size === item.variant.size);
                    const isOutOfStock = !variant || variant.stock === 0;
                    const hasLimitedStock = variant && variant.stock < item.quantity;
                    
                    return (
                      <li 
                        key={item._id} 
                        className={`p-6 transition duration-150 ${isValid ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-75'}`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center">
                          {/* Product Image */}
                          <div className="w-full sm:w-20 h-20 mb-4 sm:mb-0 sm:mr-6 relative">
                            <img 
                              src={item.product.images[0]} 
                              alt={item.product.name} 
                              className={`w-full h-full object-cover rounded-md ${!isValid ? 'opacity-50' : ''}`}
                            />
                            {!isValid && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
                                <span className="text-white text-xs font-medium px-2 py-1 bg-red-500 rounded">
                                  {isOutOfStock ? 'Out of Stock' : 'Unavailable'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className={`text-lg font-medium ${isValid ? 'text-gray-900' : 'text-gray-500'} mb-1`}>
                                {item.product.name}
                              </h3>
                              {!isValid && (
                                <span className="text-xs font-medium text-red-500">
                                  {isOutOfStock ? 'Out of Stock' : hasLimitedStock ? 'Limited Stock' : 'Unavailable'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                              <span>Size: {item.variant.size}</span>
                              {item.product.brand && (
                                <span className="ml-4">Brand: {item.product.brand.name}</span>
                              )}
                              <Link 
                                to={`/products/${item.product._id}`}
                                className="ml-4 text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                View Details
                              </Link>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
                              <div className="flex items-center mb-4 sm:mb-0">
                                <button 
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                                  disabled={updatingCart || item.quantity <= 1 || !isValid}
                                  className={`w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md ${isValid ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100'} disabled:opacity-50`}
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300 bg-white">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                                  disabled={
                                    updatingCart || 
                                    !isValid || 
                                    (variant && item.quantity >= variant.stock)
                                  }
                                  className={`w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md ${isValid ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100'} disabled:opacity-50`}
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                                <div className="text-right">
                                  {item.product.effectivePrice && item.product.effectivePrice < item.product.price && (
                                    <span className="text-sm text-gray-500 line-through mr-2">
                                      ₹{item.product.price}
                                    </span>
                                  )}
                                  <span className={`text-lg font-semibold ${isValid ? 'text-gray-900' : 'text-gray-500'}`}>
                                    ₹{getEffectivePrice(item.product)}
                                  </span>
                                </div>
                                
                                <button 
                                  onClick={() => handleRemoveFromCart(item._id)}
                                  disabled={removingFromCart}
                                  className="ml-6 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            
                            {hasLimitedStock && (
                              <div className="mt-2 text-sm text-red-500">
                                Only {variant.stock} items available in stock
                              </div>
                            )}
                            
                            {!item.product.isListed && (
                              <div className="mt-2 text-sm text-red-500 flex items-center">
                                <AlertTriangle size={16} className="mr-1" />
                                This product is currently unavailable
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
                
                {/* Coupon form */}
                <CouponForm 
                  onApplyCoupon={handleCouponApplied}
                  onRemoveCoupon={handleCouponRemoved}
                  appliedCoupon={appliedCouponObj}
                />
                
                {/* Price summary */}
                <div className="space-y-4 mb-6 mt-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₹{summary?.subtotal ? summary.subtotal.toFixed(2) : '0.00'}</span>
                  </div>
                  
                  {((summary?.productDiscount || 0) > 0 || (summary?.couponDiscount || 0) > 0) && (
                    <>
                      {summary?.productDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Offer Discount</span>
                          <span className="text-green-600">-₹{summary.productDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {summary?.couponDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coupon Discount</span>
                          <span className="text-green-600">-₹{summary.couponDiscount.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Tax */}
                  {summary?.tax !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">₹{summary.tax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Shipping */}
                  {summary?.shipping !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">{summary.shipping === 0 ? 'Free' : `₹${summary.shipping.toFixed(2)}`}</span>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">₹{summary?.total ? summary.total.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                </div>
                
                {validItems.length > 0 ? (
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                  >
                    Proceed to Checkout
                    <ArrowRight size={18} className="ml-2" />
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full bg-gray-400 text-white py-3 px-4 rounded-md font-medium cursor-not-allowed flex items-center justify-center"
                  >
                    No Items Available for Checkout
                  </button>
                )}
                
                {hasInvalidItems && validItems.length > 0 && (
                  <p className="mt-3 text-sm text-yellow-600">
                    Only {validItems.length} of {items.length} items will be included in checkout.
                  </p>
                )}
                
                <div className="mt-6 text-center">
                  <Link 
                    to="/products" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
