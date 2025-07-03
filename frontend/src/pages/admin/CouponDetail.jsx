import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  getSingleCoupon, 
  deleteCoupon, 
  toggleStatus,
  resetCouponState 
} from '../features/admin/adminCoupons/couponSlice';
import Spinner from '../../components/Spinner';
import ConfirmModal from '../../components/modals/ConfirmModal';

const CouponDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { 
    currentCoupon, 
    loading, 
    error, 
    success,
    deleteLoading,
    toggleLoading
  } = useSelector((state) => ({
    currentCoupon: state.coupons.currentCoupon,
    loading: state.coupons.loading,
    error: state.coupons.error,
    success: state.coupons.success,
    deleteLoading: state.coupons.deleteLoading,
    toggleLoading: state.coupons.toggleLoading
  }));

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  useEffect(() => {
    dispatch(getSingleCoupon(id));
    
    return () => {
      dispatch(resetCouponState());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    
    if (success) {
      if (success === 'Coupon deleted successfully') {
        toast.success(success);
        navigate('/adm/coupons');
      } else if (success === 'Coupon status updated successfully') {
        toast.success(success);
      }
    }
  }, [error, success, navigate]);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await dispatch(deleteCoupon(id));
    setShowDeleteModal(false);
  };

  const handleToggleStatus = async () => {
    await dispatch(toggleStatus(id));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(coupon.startDate);
    const expiryDate = new Date(coupon.expiryDate);
    
    // Set time to midnight for accurate day comparison
    startDate.setHours(0, 0, 0, 0);
    expiryDate.setHours(23, 59, 59, 999); 

    if (!coupon.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">Inactive</span>;
    }

    if (now < startDate) {
      return <span className="px-2 py-1 text-xs font-semibold bg-blue-200 text-blue-700 rounded-full">Scheduled</span>;
    }

    if (now > expiryDate) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-200 text-red-700 rounded-full">Expired</span>;
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-200 text-red-700 rounded-full">Used Up</span>;
    }

    return <span className="px-2 py-1 text-xs font-semibold bg-green-200 text-green-700 rounded-full">Active</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!currentCoupon) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Coupon not found</p>
        <Link
          to="/admin/coupons"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Back to Coupons
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          to="/admin/coupons"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back to Coupons
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Coupon Details</h2>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-500">Code: {currentCoupon.code}</span>
              <span className="mx-2 text-gray-300">•</span>
              {getStatusBadge(currentCoupon)}
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={handleToggleStatus}
              disabled={toggleLoading}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white ${
                currentCoupon.isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                currentCoupon.isActive ? 'focus:ring-yellow-500' : 'focus:ring-green-500'
              }`}
            >
              {toggleLoading ? (
                <>
                  <Spinner />
                  <span className="ml-2">Updating...</span>
                </>
              ) : currentCoupon.isActive ? (
                <>
                  <FaToggleOff className="mr-1" />
                  Deactivate
                </>
              ) : (
                <>
                  <FaToggleOn className="mr-1" />
                  Activate
                </>
              )}
            </button>
            <Link
              to={`/admin/coupons/edit/${currentCoupon._id}`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaEdit className="mr-1" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {deleteLoading ? (
                <>
                  <Spinner />
                  <span className="ml-1">Deleting...</span>
                </>
              ) : (
                <>
                  <FaTrash className="mr-1" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Coupon Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details and usage information for this coupon.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Coupon Code</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono sm:mt-0 sm:col-span-2">
                {currentCoupon.code}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {currentCoupon.description || 'No description provided'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Discount Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize sm:mt-0 sm:col-span-2">
                {currentCoupon.discountType}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {currentCoupon.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {currentCoupon.discountType === 'percentage' 
                  ? `${currentCoupon.discountValue}%` 
                  : `$${currentCoupon.discountValue.toFixed(2)}`}
                {currentCoupon.discountType === 'percentage' && currentCoupon.maxDiscountAmount && (
                  <span className="ml-2 text-gray-500">(max ${currentCoupon.maxDiscountAmount})</span>
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Minimum Purchase Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                ${currentCoupon.minPurchaseAmount.toFixed(2)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Validity Period</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(currentCoupon.startDate)} to {formatDate(currentCoupon.expiryDate)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Usage Limit</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {currentCoupon.maxUses 
                  ? `${currentCoupon.usedCount || 0} of ${currentCoupon.maxUses} uses` 
                  : 'Unlimited uses'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {getStatusBadge(currentCoupon)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(currentCoupon.createdAt)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(currentCoupon.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default CouponDetail;
