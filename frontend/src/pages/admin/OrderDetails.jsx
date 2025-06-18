import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllOrders, updateOrderStatus, verifyReturnRequest, resetAdminOrderState } from '../../features/admin/adminOrders/adminOrderSlice';

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { 
    orders, 
    loading, 
    error, 
    updatingStatus,
    statusUpdateSuccess,
    verifyingReturn,
    verifyReturnSuccess
  } = useSelector(state => state.adminOrders);

  const [order, setOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [returnItemId, setReturnItemId] = useState('');
  const [returnApproved, setReturnApproved] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Valid status transitions
  const statusTransitions = {
    pending: ['processing', 'shipped', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['out for delivery', 'cancelled'],
    'out for delivery': ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
    returned: []
  };

  useEffect(() => {
    dispatch(getAllOrders({}));
  }, [dispatch]);

  useEffect(() => {
    if (orders.length > 0) {
      const foundOrder = orders.find(o => o._id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setNewStatus(foundOrder.status);
      } else {
        toast.error('Order not found');
        navigate('/admin/orders');
      }
    }
  }, [orders, id, navigate]);

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
      setShowReturnModal(false);
      dispatch(resetAdminOrderState());
      // Refresh orders to get updated data
      dispatch(getAllOrders({}));
    }
  }, [error, statusUpdateSuccess, verifyReturnSuccess, dispatch]);

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const updateStatus = () => {
    if (newStatus && newStatus !== order.status) {
      dispatch(updateOrderStatus({ orderId: order._id, status: newStatus }));
    }
  };

  const openReturnModal = (itemId) => {
    setReturnItemId(itemId);
    setReturnApproved(false);
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
  };

  const handleVerifyReturn = () => {
    dispatch(verifyReturnRequest({
      orderId: order._id,
      itemId: returnItemId,
      approved: returnApproved,
      notes: returnNotes
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
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

  if (loading || !order) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
        <button
          onClick={() => navigate('/admin/orders')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded"
        >
          Back to Orders
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between flex-wrap">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Order Information</h2>
            <p><span className="font-medium">Date:</span> {formatDate(order.createdAt)}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
            </p>
            <p><span className="font-medium">Payment Method:</span> {order.paymentMethod}</p>
            <p><span className="font-medium">Total:</span> ₹{order.totalPrice?.toFixed(2)}</p>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
            <p>{order.shippingAddress?.name}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
            <p>{order.shippingAddress?.country}</p>
            <p>Phone: {order.shippingAddress?.phoneNumber}</p>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Update Status</h2>
            <div className="flex items-center">
              <select
                value={newStatus}
                onChange={handleStatusChange}
                className="border rounded p-2 mr-2"
                disabled={statusTransitions[order.status]?.length === 0}
              >
                <option value={order.status}>{order.status}</option>
                {statusTransitions[order.status]?.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button
                onClick={updateStatus}
                disabled={updatingStatus || newStatus === order.status || statusTransitions[order.status]?.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
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
              {order.items.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.product?.images && item.product.images[0] && (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product?.name} 
                          className="h-10 w-10 object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product?.name || 'Product Unavailable'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.variant?.size || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{item.price?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{item.totalPrice?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.isCancelled && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Cancelled
                      </span>
                    )}
                    {item.returnRequestStatus === 'pending' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Return Requested
                      </span>
                    )}
                    {item.returnRequestStatus === 'approved' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Return Approved
                      </span>
                    )}
                    {item.returnRequestStatus === 'rejected' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Return Rejected
                      </span>
                    )}
                    {!item.isCancelled && !item.returnRequestStatus && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.returnRequestStatus === 'pending' && (
                      <button
                        onClick={() => openReturnModal(item._id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Verify Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="flex justify-between border-b pb-2 mb-2">
          <span>Subtotal</span>
          <span>₹{order.itemsPrice?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-b pb-2 mb-2">
          <span>Shipping</span>
          <span>₹{order.shippingPrice?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-b pb-2 mb-2">
          <span>Tax</span>
          <span>₹{order.taxPrice?.toFixed(2)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between border-b pb-2 mb-2 text-green-600">
            <span>Discount</span>
            <span>-₹{order.discountAmount?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>₹{order.totalPrice?.toFixed(2)}</span>
        </div>
      </div>

      {/* Return Verification Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Verify Return Request</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Decision</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="returnDecision"
                    value="approve"
                    checked={returnApproved}
                    onChange={() => setReturnApproved(true)}
                  />
                  <span className="ml-2">Approve</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="returnDecision"
                    value="reject"
                    checked={!returnApproved}
                    onChange={() => setReturnApproved(false)}
                  />
                  <span className="ml-2">Reject</span>
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                className="w-full border rounded p-2"
                rows="3"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Add notes about this return verification"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeReturnModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyReturn}
                disabled={verifyingReturn}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {verifyingReturn ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
