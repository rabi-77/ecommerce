import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEye, FaSpinner } from 'react-icons/fa';
import { getAllOrders, resetAdminOrderState } from '../../features/admin/adminOrders/adminOrderSlice';
import ReactPaginate from 'react-paginate';

const OrderList = () => {
  const dispatch = useDispatch();
  const { 
    orders, 
    loading, 
    error, 
    statusUpdateSuccess,
    verifyReturnSuccess,
    totalPages
  } = useSelector(state => state.adminOrders);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Load orders on component mount & when page/filter/search changes
  useEffect(() => {
    dispatch(getAllOrders({ page: currentPage, size: limit, keyword: searchKeyword, status: statusFilter, sort: sortOption }));
  }, [dispatch, currentPage, searchKeyword, statusFilter, sortOption]);

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetAdminOrderState());
    }

    if (statusUpdateSuccess) {
      toast.success('Order status updated successfully');
      dispatch(resetAdminOrderState());
    }

    if (verifyReturnSuccess) {
      toast.success('Return request processed successfully');
      dispatch(resetAdminOrderState());
    }
  }, [error, statusUpdateSuccess, verifyReturnSuccess, dispatch]);

  const handleSearch = () => {
    setCurrentPage(1);
    dispatch(getAllOrders({ page: 1, size: limit, keyword: searchKeyword, status: statusFilter, sort: sortOption }));
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setCurrentPage(1);
    dispatch(getAllOrders({ page: 1, size: limit, keyword: '', status: statusFilter, sort: sortOption }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
    dispatch(getAllOrders({ page: 1, size: limit, keyword: searchKeyword, status: e.target.value, sort: sortOption }));
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
    dispatch(getAllOrders({ page: 1, size: limit, keyword: searchKeyword, status: statusFilter, sort: e.target.value }));
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'out for delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-5 flex">
          <div className="relative w-full">
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 p-2.5"
              placeholder="Search by order #, customer name or phone"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            {searchKeyword && (
              <button
                type="button"
                className="absolute inset-y-0 right-12 flex items-center pr-3"
                onClick={clearSearch}
              >
                <svg className="w-4 h-4 text-gray-500 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            className="p-2.5 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
            onClick={handleSearch}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span className="sr-only">Search</span>
          </button>
        </div>
        
        {/* Status Filter */}
        <div className="md:col-span-4">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out for delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        
        {/* Sort Order */}
        <div className="md:col-span-3">
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high-to-low">Price: High to Low</option>
            <option value="price-low-to-high">Price: Low to High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {orders && orders.length > 0 ? (
                <>
                  Showing {orders.length} orders
                </>
              ) : (
                'No orders found'
              )}
            </p>
          </div>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.shippingAddress?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{order.totalPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          to={`/adm/orders/${order._id}`} 
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <ReactPaginate
                previousLabel="Previous"
                nextLabel="Next"
                breakLabel="..."
                pageCount={totalPages}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={({ selected }) => setCurrentPage(selected + 1)}
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
        </>
      )}
    </div>
  );
};

export default OrderList;
