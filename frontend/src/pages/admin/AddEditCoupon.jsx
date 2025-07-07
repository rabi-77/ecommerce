import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  createCoupon, 
  updateCoupon, 
  getSingleCoupon, 
  resetCouponState 
} from '../../features/admin/adminCoupons/couponSlice';

const AddEditCoupon = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { currentCoupon, loading, error, success } = useSelector((state) => ({
    currentCoupon: state.coupons.currentCoupon,
    loading: state.coupons.loading,
    error: state.coupons.error,
    success: state.coupons.success,
  }));

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 0,
    maxDiscountAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load coupon data in edit mode
  useEffect(() => {
    if (isEditMode) {
      dispatch(getSingleCoupon(id));
    }
    
    return () => {
      dispatch(resetCouponState());
    };
  }, [id, isEditMode, dispatch]);

  // Update form data when currentCoupon changes (edit mode)
  useEffect(() => {
    if (isEditMode && currentCoupon) {
      setFormData({
        code: currentCoupon.code,
        description: currentCoupon.description || '',
        discountType: currentCoupon.discountType,
        discountValue: currentCoupon.discountValue,
        minPurchaseAmount: currentCoupon.minPurchaseAmount,
        maxDiscountAmount: currentCoupon.maxDiscountAmount || '',
        startDate: new Date(currentCoupon.startDate).toISOString().split('T')[0],
        expiryDate: new Date(currentCoupon.expiryDate).toISOString().split('T')[0],
        maxUses: currentCoupon.maxUses || '',
        isActive: currentCoupon.isActive,
      });
    }
  }, [currentCoupon, isEditMode]);

  // Handle success/error messages
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    
    if (success) {
      toast.success(
        isEditMode ? 'Coupon updated successfully' : 'Coupon created successfully'
      );
      navigate('/adm/coupons');
    }
  }, [error, success, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Only uppercase letters and numbers are allowed';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }
    
    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    } else if (
      formData.discountType === 'percentage' && 
      (formData.discountValue > 100 || formData.discountValue < 0)
    ) {
      newErrors.discountValue = 'Percentage must be between 0 and 100';
    }
    
    if (formData.minPurchaseAmount < 0) {
      newErrors.minPurchaseAmount = 'Minimum purchase amount cannot be negative';
    }
    
    if (
      formData.discountType === 'percentage' && 
      (!formData.maxDiscountAmount || formData.maxDiscountAmount <= 0)
    ) {
      newErrors.maxDiscountAmount = 'Maximum discount amount is required for percentage discounts';
    }
    
    const startDate = new Date(formData.startDate);
    const expiryDate = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only enforce "start date cannot be in the past" for NEW coupons.
    if (!isEditMode && startDate < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }
    
    if (expiryDate <= startDate) {
      newErrors.expiryDate = 'Expiry date must be after start date';
    }
    
    if (formData.maxUses && formData.maxUses < 1) {
      newErrors.maxUses = 'Maximum uses must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const couponData = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      discountValue: parseFloat(formData.discountValue),
      minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
      maxDiscountAmount: formData.discountType === 'percentage' ? parseFloat(formData.maxDiscountAmount) : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : null,
    };
    
    if (isEditMode) {
      await dispatch(updateCoupon({ id, ...couponData }));
    } else {
      await dispatch(createCoupon(couponData));
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          to="/adm/coupons"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back to Coupons
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Coupon' : 'Add New Coupon'}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coupon Code */}
            <div className="col-span-1">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="e.g., SUMMER20"
                autoComplete="off"
                disabled={isEditMode}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className={`block w-full px-3 py-2 border ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Optional description for internal use"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Discount Type */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center">
                  <input
                    id="percentage"
                    name="discountType"
                    type="radio"
                    value="percentage"
                    checked={formData.discountType === 'percentage'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="percentage" className="ml-2 block text-sm text-gray-700">
                    Percentage
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="fixed"
                    name="discountType"
                    type="radio"
                    value="fixed"
                    checked={formData.discountType === 'fixed'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="fixed" className="ml-2 block text-sm text-gray-700">
                    Fixed Amount
                  </label>
                </div>
              </div>
            </div>

            {/* Discount Value */}
            <div className="col-span-1">
              <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                {formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'} <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {formData.discountType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
                <input
                  type="number"
                  name="discountValue"
                  id="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  min="0"
                  step={formData.discountType === 'percentage' ? '0.01' : '1'}
                  max={formData.discountType === 'percentage' ? '100' : ''}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.discountValue ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
              </div>
              {errors.discountValue && (
                <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>
              )}
            </div>

            {/* Max Discount Amount (for percentage only) */}
            {formData.discountType === 'percentage' && (
              <div className="col-span-1">
                <label htmlFor="maxDiscountAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Discount Amount <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    id="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.maxDiscountAmount ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                </div>
                {errors.maxDiscountAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxDiscountAmount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Maximum amount that can be discounted (applies to percentage discounts only)
                </p>
              </div>
            )}

            {/* Minimum Purchase Amount */}
            <div className="col-span-1">
              <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Purchase Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="minPurchaseAmount"
                  id="minPurchaseAmount"
                  value={formData.minPurchaseAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.minPurchaseAmount ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
              </div>
              {errors.minPurchaseAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.minPurchaseAmount}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Minimum cart total required to apply this coupon (0 for no minimum)
              </p>
            </div>

            {/* Start Date */}
            <div className="col-span-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={!isEditMode ? new Date().toISOString().split('T')[0] : undefined}
                className={`block w-full px-3 py-2 border ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="col-span-1">
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expiryDate"
                id="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                min={formData.startDate}
                className={`block w-full px-3 py-2 border ${
                  errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
              )}
            </div>

            {/* Maximum Uses */}
            <div className="col-span-1">
              <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Number of Uses
              </label>
              <input
                type="number"
                name="maxUses"
                id="maxUses"
                value={formData.maxUses}
                onChange={handleChange}
                min="1"
                step="1"
                className={`block w-full px-3 py-2 border ${
                  errors.maxUses ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder=""
              />
              {errors.maxUses && (
                <p className="mt-1 text-sm text-red-600">{errors.maxUses}</p>
              )}
              {isEditMode && formData.usedCount > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {formData.usedCount} {formData.usedCount === 1 ? 'use' : 'uses'} so far
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="col-span-1 flex items-end">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <Link
                to="/adm/coupons"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FaSave className="-ml-1 mr-2 h-4 w-4" />
                    {isEditMode ? 'Update Coupon' : 'Create Coupon'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCoupon;
