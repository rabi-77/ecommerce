import React, { useState, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { FaTimes, FaCheck } from 'react-icons/fa';
import { applyCoupon, removeCoupon } from '../../features/cart/cartSlice';
import { toast } from 'react-toastify';
import api from '../../apis/user/api';

const CouponForm = ({ onApplyCoupon, onRemoveCoupon, appliedCoupon }) => {
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
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

  const handleCouponClick = (code) => {
    setCouponCode(code);
  };

  // Fetch active coupons that user can still use
  useEffect(() => {
    const fetchActiveCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const res = await api.get('/coupons/active');
        console.log('is coupon coming here',res.data);
        
        setActiveCoupons(res.data.coupons || []);
      } catch (err) {
        console.error('Error fetching coupons', err);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchActiveCoupons();
  }, []);

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
      
      {/* Active coupon list */}
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Available Coupons:</p>
        {loadingCoupons ? (
          <p className="text-xs text-gray-500">Loading...</p>
        ) : activeCoupons.length === 0 ? (
          <p className="text-xs text-gray-500">No coupons available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeCoupons.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCouponClick(c.code)}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
              >
                {c.code}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">Enter your coupon code or click one of the available coupons above</p>
    </div>
  );
};

export default CouponForm;
