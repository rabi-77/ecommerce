import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getOffers, deleteOffer, toggleStatus } from '../../features/admin/adminOffers/offerSlice';

const Offers = () => {
  const dispatch = useDispatch();
  const { offers, loading, error, pagination } = useSelector((state) => state.offers);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(getOffers({ page: currentPage, limit }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (error) toast.error(error);
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Offers</h2>
        <Link
          to="/admin/offers/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Add New Offer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : offers.length === 0 ? (
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
              {offers.map((offer) => (
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
                    <Link to={`/admin/offers/edit/${offer._id}`} className="text-blue-600 hover:text-blue-900 mr-3 inline-block">
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
      </div>
    </div>
  );
};

export default Offers;
