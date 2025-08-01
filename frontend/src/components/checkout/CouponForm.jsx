import React, { useState, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { FaTimes, FaCheck } from 'react-icons/fa';
import { applyCoupon, removeCoupon, fetchAvailableCoupons } from '../../features/cart/cartSlice';
import { toast } from 'react-toastify';
import api from '../../apis/user/api';
import Loader from '../common/Loader';

const CouponForm = ({ onApplyCoupon, onRemoveCoupon, appliedCoupon }) => {
  const [couponCode, setCouponCode] = useState('');
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  
  const { couponValidation, loading } = useSelector((state) => ({
    couponValidation: state.cart.couponValidation,
    loading: state.cart.loading,
  }));

  const { availableCoupons, loading: loadingAvailableCoupons, summary } = useSelector(state => state.cart);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await dispatch(applyCoupon(couponCode.trim().toUpperCase()));
      
      if (applyCoupon.fulfilled.match(result)) {
        const { coupon, discount } = result.payload;
        onApplyCoupon({
          code: coupon.code,
          discountAmount: discount,
          type: coupon.discountType,
        });
        setCouponCode('');
        toast.success('Coupon applied successfully!');
      } else {
        const errorMessage=result.payload 
        toast.error(errorMessage||'invalid coupon');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while applying the coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon())
      .unwrap()
      .then(() => {
        onRemoveCoupon();
        toast.success('Coupon removed successfully');
      })
      .catch(error => {
        toast.error(error || 'Failed to remove coupon');
      });
  };

  const handleChange = (e) => {
    setCouponCode(e.target.value);
  };

  const handleCouponClick = (coupon) => {
    if (!coupon.eligible) {
      toast.info(`Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon`);
      return;
    }
    setCouponCode(coupon.code);
  };

  useEffect(() => {
    if (!loadingAvailableCoupons) {
      dispatch(fetchAvailableCoupons());
    }
  }, [dispatch, summary.subtotal]);

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
              -₹{appliedCoupon.discountAmount.toFixed(2)}
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
      
      {/* Active coupon list */}
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Available Coupons:</p>
        {loadingAvailableCoupons || loadingCoupons ? (
          // <p className="text-xs text-gray-500">Loading...</p>
          <Loader/>
        ) : availableCoupons.length === 0 ? (
          <p className="text-xs text-gray-500">No coupons available</p>
        ) : (
          <div className="space-y-2">
            {availableCoupons.map((c) => (
              <div
                key={c.code}
                className={`p-3 rounded-lg border ${
                  c.eligible
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold text-sm ${
                        c.eligible ? 'text-blue-800' : 'text-gray-600'
                      }`}>
                        {c.code}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        c.discountType === 'percentage'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}% OFF`
                          : `₹${c.discountValue} OFF`
                        }
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {c.description || 'No description available'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Min. purchase: ₹{c.minPurchaseAmount}
                      {c.discountType === 'percentage' && c.maxDiscountAmount && 
                        ` • Max discount: ₹${c.maxDiscountAmount}`
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCouponClick(c)}
                    disabled={!c.eligible}
                    className={`ml-3 px-3 py-1 text-xs font-medium rounded ${
                      c.eligible
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {c.eligible ? 'Apply' : 'Not Eligible'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">Enter your coupon code or click one of the available coupons above</p>
    </div>
  );
};

export default CouponForm;
