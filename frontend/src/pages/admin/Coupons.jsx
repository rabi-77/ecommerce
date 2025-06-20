import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getCoupons, deleteCoupon, toggleStatus, resetCouponState } from '../../features/admin/adminCoupons/couponSlice';
import ReactPaginate from 'react-paginate';

const Coupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error, success, pagination } = useSelector((state) => state.coupons);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(getCoupons({ page: currentPage, limit, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    dispatch(getCoupons({ page: 1, limit, search: searchTerm }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      const resultAction = await dispatch(deleteCoupon(id));
      if (deleteCoupon.fulfilled.match(resultAction)) {
        toast.success('Coupon deleted successfully');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    await dispatch(toggleStatus(id));
    if (!error) {
      toast.success(`Coupon ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    }
  };

  const handlePageChange = ({ selected }) => {
    const newPage = selected + 1;
    setCurrentPage(newPage);
    dispatch(getCoupons({ page: newPage, limit, search: searchTerm }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  // Helper to derive status string
  const deriveStatus = (coupon) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(coupon.startDate);
    const expiryDate = new Date(coupon.expiryDate);
    startDate.setHours(0,0,0,0);
    expiryDate.setHours(23,59,59,999);

    if (!coupon.isActive) return 'INACTIVE';
    if (now < startDate) return 'SCHEDULED';
    if (now > expiryDate) return 'EXPIRED';
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return 'USEDUP';
    return 'ACTIVE';
  };

  const filteredCoupons = coupons.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return deriveStatus(c) === statusFilter;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Coupons</h2>
        <Link
          to="/admin/coupons/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FaPlus className="mr-2" />
          Add New Coupon
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="EXPIRED">Expired</option>
            <option value="USEDUP">Used Up</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No coupons found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {coupon.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue || 0}%`
                          : `$${(coupon.discountValue || 0).toFixed(2)}`}
                        {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && (
                          <span className="text-xs text-gray-500 ml-1">(max ${coupon.maxDiscountAmount})</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min. ${coupon.minPurchaseAmount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(coupon.startDate)} - {formatDate(coupon.expiryDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {coupon.maxUses ? `${coupon.usedCount || 0}/${coupon.maxUses} uses` : 'Unlimited uses'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(coupon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                          className="text-gray-500 hover:text-gray-700"
                          title={coupon.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {coupon.isActive ? (
                            <FaToggleOn className="h-5 w-5 text-green-500" />
                          ) : (
                            <FaToggleOff className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <Link
                          to={`/admin/coupons/edit/${coupon._id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <FaEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center mt-6">
            <ReactPaginate
              previousLabel="Previous"
              nextLabel="Next"
              breakLabel="..."
              pageCount={pagination.pages}
              marginPagesDisplayed={2}
              pageRangeDisplayed={3}
              onPageChange={handlePageChange}
              forcePage={currentPage - 1}
              containerClassName="flex items-center gap-2"
              pageClassName="px-3 py-2 border rounded hover:bg-gray-100"
              activeClassName="bg-blue-600 text-white"
              previousClassName="px-3 py-2 border rounded hover:bg-gray-100"
              nextClassName="px-3 py-2 border rounded hover:bg-gray-100"
              disabledClassName="opacity-50 cursor-not-allowed"
            />
          </div>
        )}
      </div>

      {/* <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      /> */}
    </div>
  );
};

export default Coupons;
