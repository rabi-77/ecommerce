import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getMyOrders, 
  cancelOrder, 
  returnOrder,
  downloadInvoice,
  resetOrderState
} from '../../features/order/orderSlice';
import { toast } from 'react-toastify';
import { 
  Search, 
  Filter, 
  FileText, 
  X, 
  RotateCcw, 
  Eye 
} from 'lucide-react';

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { 
    orders, 
    loading, 
    fetchingOrders, 
    cancellingOrder, 
    returningOrder,
    downloadingInvoice,
    error 
  } = useSelector((state) => state.order);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      dispatch(getMyOrders({ keyword: '', status: 'all' }));
    }
  }, [dispatch, navigate, user]);

  // Separate useEffect for error handling to prevent infinite loop
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetOrderState());
    }
  }, [error, dispatch]);

  const handleSearch = () => {
    dispatch(getMyOrders({ keyword: searchKeyword, status: statusFilter }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    dispatch(getMyOrders({ keyword: searchKeyword, status: e.target.value }));
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setOpenCancelDialog(true);
  };

  const handleReturnOrder = (order) => {
    setSelectedOrder(order);
    setOpenReturnDialog(true);
  };

  const confirmCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    dispatch(cancelOrder({ 
      orderId: selectedOrder._id, 
      reason: cancelReason 
    }))
      .unwrap()
      .then(() => {
        toast.success('Order cancelled successfully');
        setOpenCancelDialog(false);
        setCancelReason('');
        setSelectedOrder(null);
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const confirmReturnOrder = () => {
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }

    dispatch(returnOrder({ 
      orderId: selectedOrder._id, 
      reason: returnReason 
    }))
      .unwrap()
      .then(() => {
        toast.success('Return request submitted successfully');
        setOpenReturnDialog(false);
        setReturnReason('');
        setSelectedOrder(null);
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handleDownloadInvoice = (orderId) => {
    dispatch(downloadInvoice(orderId))
      .unwrap()
      .then(() => {
        toast.success('Invoice downloaded successfully');
      })
      .catch((error) => {
        toast.error('Failed to download invoice');
      });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Order Number or Address Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                <Filter size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {fetchingOrders ? (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 font-sans">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-sans">
                    <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap ">
                    <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-sans">
                    <div className="text-sm font-medium text-gray-900">₹{order.totalPrice.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/order/${order._id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      
                      <button 
                        onClick={() => handleDownloadInvoice(order._id)}
                        disabled={downloadingInvoice}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download Invoice"
                      >
                        <FileText size={18} />
                      </button>
                      
                      {['pending', 'processing', 'shipped', 'out for delivery'].includes(order.status) && (
                        <button 
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingOrder}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Cancel Order"
                        >
                          <X size={18} />
                        </button>
                      )}
                      
                      {order.status === 'delivered' && (
                        <button 
                          onClick={() => handleReturnOrder(order)}
                          disabled={returningOrder}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Return Order"
                        >
                          <RotateCcw size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Orders Found</h2>
          <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
          <Link 
            to="/products"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition duration-200"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {/* Cancel Order Dialog */}
      {openCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this order? Please provide a reason for cancellation.
            </p>
            <textarea
              autoFocus
              placeholder="Reason for Cancellation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setOpenCancelDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCancelOrder} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={cancellingOrder}
              >
                {cancellingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Order Dialog */}
      {openReturnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Return Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to return this order? Please provide a reason for the return.
            </p>
            <textarea
              autoFocus
              placeholder="Reason for Return"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              required
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setOpenReturnDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReturnOrder} 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={returningOrder}
              >
                {returningOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
