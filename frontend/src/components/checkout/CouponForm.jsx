import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaTimes, FaCheck } from 'react-icons/fa';
import { validateCoupon, resetCouponValidation } from '../../features/cart/cartSlice';
import { toast } from 'react-toastify';

const CouponForm = ({ onApplyCoupon, onRemoveCoupon, appliedCoupon }) => {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  
  const { couponValidation, loading } = useSelector((state) => ({
    couponValidation: state.cart.couponValidation,
    loading: state.cart.loading,
  }));

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setIsLoading(true);
    try {
      const resultAction = await dispatch(validateCoupon(couponCode.trim().toUpperCase()));
      
      if (validateCoupon.fulfilled.match(resultAction)) {
        const { valid, discountAmount, message } = resultAction.payload;
        
        if (valid) {
          toast.success(message || 'Coupon applied successfully!');
          onApplyCoupon({
            code: couponCode.trim().toUpperCase(),
            discountAmount,
            type: couponValidation?.discountType,
          });
          setCouponCode('');
        } else {
          toast.error(message || 'Invalid coupon code');
        }
      } else {
        toast.error('Failed to validate coupon');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while applying the coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    dispatch(resetCouponValidation());
  };

  const handleChange = (e) => {
    setCouponCode(e.target.value);
  };

  if (appliedCoupon) {
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FaCheck className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Coupon <span className="font-bold">{appliedCoupon.code}</span> applied successfully!
            </span>
            <span className="ml-2 text-sm text-green-700">
              -${appliedCoupon.discountAmount.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex">
        <div className="flex-1">
          <label htmlFor="coupon-code" className="sr-only">
            Coupon code
          </label>
          <input
            type="text"
            id="coupon-code"
            value={couponCode}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-l-md"
            placeholder="Enter coupon code"
            disabled={isLoading || loading}
          />
        </div>
        <button
          type="button"
          onClick={handleApplyCoupon}
          disabled={!couponCode.trim() || isLoading || loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white ${
            !couponCode.trim() || isLoading || loading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isLoading || loading ? 'Applying...' : 'Apply'}
        </button>
      </div>
      
      {couponValidation?.error && !couponValidation?.valid && (
        <p className="mt-2 text-sm text-red-600">{couponValidation.message}</p>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        Enter your coupon code if you have one
      </p>
    </div>
  );
};

export default CouponForm;
