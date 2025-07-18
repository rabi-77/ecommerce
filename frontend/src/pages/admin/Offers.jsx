import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getOffers, deleteOffer, toggleStatus, resetOfferState } from '../../features/admin/adminOffers/offerSlice';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loader from '../../components/common/Loader';

const Offers = () => {
  const dispatch = useDispatch();
  const { offers, loading, error, pagination } = useSelector((state) => state.offers);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const limit = 10;

  useEffect(() => {
    dispatch(getOffers({ page: currentPage, limit, type: typeFilter !== 'ALL' ? typeFilter : '' }));
  }, [dispatch, currentPage, typeFilter]);

  useEffect(() => {
    if (error) toast.error(error);
    dispatch(resetOfferState());
  }, [error]);

  const handleToggleStatus = async (id) => {
    await dispatch(toggleStatus(id));
    toast.success('Status updated');
  };

  const handleDelete = (id) => setDeleteId(id);

  const confirmDelete = async () => {
    if (deleteId) {
      await dispatch(deleteOffer(deleteId));
      toast.success('Offer deleted');
      setDeleteId(null);
    }
  };

  const formatDiscount = (offer) => {
    if (offer.percentage) return `${offer.percentage}%`;
    return `₹${offer.amount}`;
  };

  // Local filtering by search term
  const filteredOffers = offers.filter((offer) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const targetName = offer.type === 'PRODUCT' ? offer.product?.name : offer.category?.name;
    return (
      offer.type.toLowerCase().includes(term) ||
      (targetName && targetName.toLowerCase().includes(term))
    );
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // DataTable columns
  const columns = [
    { header: 'Type', accessor: 'type' },
    { header: 'Target', accessor: (o) => (o.type === 'PRODUCT' ? o.product?.name : o.category?.name) },
    { header: 'Discount', accessor: (o) => formatDiscount(o) },
    { header: 'Start', accessor: (o) => new Date(o.startDate).toLocaleDateString() },
    { header: 'End', accessor: (o) => new Date(o.endDate).toLocaleDateString() },
    { header: 'Status', accessor: (o) => (
        <button onClick={() => handleToggleStatus(o._id)}>
          {o.isActive ? <FaToggleOn className="text-green-500" size={20} /> : <FaToggleOff className="text-gray-400" size={20} />}
        </button>
      )
    },
    { header: 'Actions', accessor: (o) => (
        <div className="flex space-x-2 justify-end">
          <Link to={`/adm/offers/edit/${o._id}`} className="text-blue-600 hover:text-blue-900" title="Edit"><FaEdit /></Link>
          <button onClick={() => handleDelete(o._id)} className="text-red-600 hover:text-red-900" title="Delete"><FaTrash /></button>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 w-full gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Offers</h2>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search offers..."
              className="w-full sm:w-64"
            />
          </div>

          {/* Type filter */}
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="ALL">All Types</option>
            <option value="PRODUCT">Product</option>
            <option value="CATEGORY">Category</option>
          </Select>

          {/* Add button */}
          <Link
            to="/adm/offers/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaPlus className="mr-2" />
            Add New Offer
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <Loader/>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No offers found</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredOffers} />
        )}
        {pagination && pagination.pages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={(page) => handlePageChange(page)}
            className="mt-6"
          />
        )}
      </div>
      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Offer"
        message="Are you sure you want to delete this offer?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
      
    </div>
  );
};

export default Offers;
