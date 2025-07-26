import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getCoupons, deleteCoupon, toggleStatus, resetCouponState } from '../../features/admin/adminCoupons/couponSlice';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loader from '../../components/common/Loader';

const Coupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error, success, pagination, deletingCoupon } = useSelector((state) => state.coupons);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [deleteId, setDeleteId] = useState(null);

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

  const handleDelete = (couponId) => {
    setDeleteId(couponId);
  };

  const confirmDelete = () => {
    if (deleteId) {
      dispatch(deleteCoupon(deleteId));
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    await dispatch(toggleStatus(id));
    if (!error) {
      toast.success(`Coupon ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    }
  };

  const handlePageChange = (newPage) => {
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

  const columns = [
    { header: 'Code', accessor: 'code' },
    { header: 'Description', accessor: (c) => c.description || 'No description' },
    { header: 'Min Purchase', accessor: (c) => `₹${(c.minPurchaseAmount || 0).toFixed(2)}` },
    { header: 'Coupon Amount', accessor: (c) => (
        c.discountType === 'percentage'
          ? `${c.discountValue || 0}%`
          : `₹${(c.discountValue || 0).toFixed(2)}`
      )
    },
    { header: 'Max Discount', accessor: (c) => (
        c.discountType === 'percentage' && c.maxDiscountAmount
          ? `₹${c.maxDiscountAmount.toFixed(2)}`
          : c.discountType === 'fixed' ? 'N/A' : 'No Limit'
      )
    },
    { header: 'Validity', accessor: (c) => `${formatDate(c.startDate)} - ${formatDate(c.expiryDate)}` },
    { header: 'Status', accessor: (c) => getStatusBadge(c) },
    { header: 'Actions', accessor: (c) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => handleToggleStatus(c._id, c.isActive)}
            className="text-gray-500 hover:text-gray-700"
            title={c.isActive ? 'Deactivate' : 'Activate'}
          >
            {c.isActive ? (
              <FaToggleOn className="h-5 w-5 text-green-500" />
            ) : (
              <FaToggleOff className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <Link to={`/adm/coupons/edit/${c._id}`} className="text-blue-600 hover:text-blue-900" title="Edit">
            <FaEdit className="h-5 w-5" />
          </Link>
          <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:text-red-900" title="Delete">
            <FaTrash className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Coupons</h2>
        <Link
          to="/adm/coupons/add"
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
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search coupons..."
                className="w-full sm:w-64"
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
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="EXPIRED">Expired</option>
            <option value="USEDUP">Used Up</option>
          </Select>
        </div>

        {loading ? (
          <Loader/>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No coupons found</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredCoupons} />
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
            className="mt-6"
          />
        )}
      </div>

      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmLabel="Delete"
        loading={deletingCoupon} 
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Coupons;
