import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getOffers, deleteOffer, toggleStatus, resetOfferState } from '../../features/admin/adminOffers/offerSlice';

const Offers = () => {
  const dispatch = useDispatch();
  const { offers, loading, error, pagination } = useSelector((state) => state.offers);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
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

  const handleDelete = async (id) => {
    if (window.confirm('Delete this offer?')) {
      await dispatch(deleteOffer(id));
      toast.success('Offer deleted');
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 w-full gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Offers</h2>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="ALL">All Types</option>
            <option value="PRODUCT">Product</option>
            <option value="CATEGORY">Category</option>
          </select>

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
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No offers found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOffers.map((offer) => (
                <tr key={offer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{offer.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {offer.type === 'PRODUCT' ? offer.product?.name : offer.category?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDiscount(offer)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(offer.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(offer.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleToggleStatus(offer._id)}>
                      {offer.isActive ? <FaToggleOn className="text-green-500" size={20} /> : <FaToggleOff className="text-gray-400" size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link to={`/adm/offers/edit/${offer._id}`} className="text-blue-600 hover:text-blue-900 mr-3 inline-block">
                      <FaEdit />
                    </Link>
                    <button onClick={() => handleDelete(offer._id)} className="text-red-600 hover:text-red-900">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
    </div>
  );
};

export default Offers;
