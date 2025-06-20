import React, { useState, useEffect } from 'react';
import {  useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  createNewOffer,
  updateExistingOffer,
  getSingleOffer,
  resetOfferState,
} from '../../features/admin/adminOffers/offerSlice';
import { useDispatch as useAppDispatch } from 'react-redux';
import { getProductsThunk, categoryThunk } from '../../features/admin/adminProducts/productSlice';

const AddEditOffer = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentOffer, loading, error, success } = useSelector((state) => state.offers);
    const productOptions = useSelector((state) => state.product.products);
    const categoryOptions = useSelector((state) => state.product.categories);

  const [formData, setFormData] = useState({
    type: 'PRODUCT',
    product: '',
    category: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      dispatch(getSingleOffer(id));
    }
    return () => {
      dispatch(resetOfferState());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentOffer) {
      setFormData({
        type: currentOffer.type,
        product: currentOffer.product?._id || '',
        category: currentOffer.category?._id || '',
        discountType: currentOffer.percentage ? 'percentage' : 'amount',
        discountValue: currentOffer.percentage || currentOffer.amount || '',
        startDate: currentOffer.startDate.split('T')[0],
        endDate: currentOffer.endDate.split('T')[0],
        isActive: currentOffer.isActive,
      });
    }
  }, [currentOffer, isEditMode]);

  useEffect(() => {
    if (error) toast.error(error);
    dispatch(resetOfferState());
    if (success) {
      toast.success(isEditMode ? 'Offer updated' : 'Offer created');
      navigate('/admin/offers');
    }
  }, [error, success, isEditMode, navigate]);

  useEffect(() => {
    dispatch(getProductsThunk({ page: 1, size: 1000, search: '' }));
    dispatch(categoryThunk());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.discountValue) {
      newErrors.discountValue = 'Discount value is required';
    } else if (
      formData.discountType === 'percentage' &&
      (formData.discountValue <= 0 || formData.discountValue > 100)
    ) {
      newErrors.discountValue = 'Percentage must be between 1 and 100';
    } else if (
      formData.discountType === 'amount' && formData.discountValue <= 0
    ) {
      newErrors.discountValue = 'Amount must be positive';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { discountType, discountValue, ...rest } = formData;
    // build payload and strip out irrelevant/empty fields to avoid Cast to ObjectId errors
    const payload = { ...rest };

    // include only one of product / category depending on selected type
    if (payload.type === 'PRODUCT') {
      if (!payload.product) {
        toast.error('Please select a product');
        return;
      }
      delete payload.category;
    } else {
      if (!payload.category) {
        toast.error('Please select a category');
        return;
      }
      delete payload.product;
    }

    // map discount value into correct field and drop the other
    if (discountType === 'percentage') {
      payload.percentage = Number(discountValue);
    } else {
      payload.amount = Number(discountValue);
    }

    if (isEditMode) {
      await dispatch(updateExistingOffer({ id, ...payload }));
    } else {
      await dispatch(createNewOffer(payload));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/admin/offers" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <FaArrowLeft className="mr-2" /> Back to Offers
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Offer' : 'Add New Offer'}</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Offer Target Type */}
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">Target<span className="text-red-500">*</span></label>
            <div className="flex items-center space-x-6 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="PRODUCT"
                  checked={formData.type === 'PRODUCT'}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData((prev) => ({ ...prev, category: '' }));
                  }}
                  className="mr-2"
                />
                Product
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="CATEGORY"
                  checked={formData.type === 'CATEGORY'}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData((prev) => ({ ...prev, product: '' }));
                  }}
                  className="mr-2"
                />
                Category
              </label>
            </div>
          </div>

          {/* Discount Type */}
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">Discount Type<span className="text-red-500">*</span></label>
            <div className="flex items-center space-x-6 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={formData.discountType === 'percentage'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Percentage
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="discountType"
                  value="amount"
                  checked={formData.discountType === 'amount'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Fixed Amount
              </label>
            </div>
          </div>

          {/* Discount Value */}
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">
              {formData.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="discountValue"
              value={formData.discountValue}
              onChange={handleChange}
              className="w-full border py-2 px-3 rounded"
            />
            {errors.discountValue && <p className="text-red-600 text-sm">{errors.discountValue}</p>}
          </div>

          {/* Target dropdown (conditional) */}
          {formData.type === 'PRODUCT' && (
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Product<span className="text-red-500">*</span></label>
              <select
                name="product"
                value={formData.product}
                onChange={handleChange}
                className="w-full border py-2 px-3 rounded"
              >
                <option value="">Select Product</option>
                {productOptions.map((product) => (
                  <option key={product._id} value={product._id}>{product.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'CATEGORY' && (
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Category<span className="text-red-500">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border py-2 px-3 rounded"
              >
                <option value="">Select Category</option>
                {categoryOptions.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="w-full border py-2 px-3 rounded" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="w-full border py-2 px-3 rounded" />
          </div>

          {/* Active */}
          <div className="col-span-1">
            <label className="inline-flex items-center text-sm">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2">Active</span>
            </label>
          </div>

          <div className="col-span-full">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditOffer;
