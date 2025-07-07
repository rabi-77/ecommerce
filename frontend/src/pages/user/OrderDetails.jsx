import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getOrderDetails, 
  cancelOrderItem, 
  returnOrderItem,
  downloadInvoice,
  resetOrderState,
  resetOrderCreated
} from '../../features/order/orderSlice';
import { toast } from 'react-toastify';
import { 
  FileText, 
  X, 
  RotateCcw, 
  ArrowLeft,
  Check
} from 'lucide-react';
import RazorpayButton from '../../components/checkout/RazorpayButton';

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { 
    order, 
    loading, 
    fetchingOrderDetails, 
    cancellingItem, 
    returningItem,
    downloadingInvoice,
    error 
  } = useSelector((state) => state.order);

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      // If no order ID, redirect to orders list
      navigate('/my-orders');
      return;
    }

    dispatch(getOrderDetails(id));

    if (error) {
      toast.error(error);
      dispatch(resetOrderState());
    }

    return () => {
      // Clean up
    };
  }, [dispatch, navigate, user, id, error]);

  const handleCancelItem = (item) => {
    setSelectedItem(item);
    setOpenCancelDialog(true);
  };

  const handleReturnItem = (item) => {
    setSelectedItem(item);
    setOpenReturnDialog(true);
  };

  const confirmCancelItem = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    dispatch(cancelOrderItem({ 
      orderId: order._id, 
      itemId: selectedItem._id, 
      reason: cancelReason 
    }))
      .unwrap()
      .then(() => {
        toast.success('Item cancelled successfully');
        setOpenCancelDialog(false);
        setCancelReason('');
        setSelectedItem(null);
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const confirmReturnItem = () => {
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }

    dispatch(returnOrderItem({ 
      orderId: order._id, 
      itemId: selectedItem._id, 
      reason: returnReason 
    }))
      .unwrap()
      .then(() => {
        toast.success('Return request submitted successfully');
        setOpenReturnDialog(false);
        setReturnReason('');
        setSelectedItem(null);
      })
      .catch((error) => {
        toast.error(error);
      });
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful');
    // Refresh order details in background
    dispatch(getOrderDetails(id));
    // Navigate to success page so user sees confirmation
    navigate(`/order/success/${id}`);
    // Clear orderCreated so another checkout doesn't auto-redirect
    dispatch(resetOrderCreated());
  };

  const handlePaymentError = (err) => {
    console.error(err);
    toast.error(err || 'Payment failed');
  };

  const handleDownloadInvoice = () => {
    dispatch(downloadInvoice(order._id))
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
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getProgressPercentage = () => {
    const steps = getOrderSteps();
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const getOrderSteps = () => {
    const steps = [
      { label: 'Order Placed', completed: true },
      { label: 'Processing', completed: ['processing', 'shipped', 'out for delivery', 'delivered'].includes(order?.status) },
      { label: 'Shipped', completed: ['shipped', 'out for delivery', 'delivered'].includes(order?.status) },
      { label: 'Out for Delivery', completed: ['out for delivery', 'delivered'].includes(order?.status) },
      { label: 'Delivered', completed: order?.status === 'delivered' }
    ];

    // If order is cancelled or returned, modify the steps
    if (order?.status === 'cancelled') {
      return [
        { label: 'Order Placed', completed: true },
        { label: 'Cancelled', completed: true }
      ];
    } else if (order?.status === 'returned') {
      return [
        { label: 'Order Placed', completed: true },
        { label: 'Processing', completed: true },
        { label: 'Shipped', completed: true },
        { label: 'Out for Delivery', completed: true },
        { label: 'Delivered', completed: true },
        { label: 'Returned', completed: true }
      ];
    } else if (order?.returnRequestStatus === 'pending') {
      return [
        { label: 'Order Placed', completed: true },
        { label: 'Processing', completed: true },
        { label: 'Shipped', completed: true },
        { label: 'Out for Delivery', completed: true },
        { label: 'Delivered', completed: true },
        { label: 'Return Requested', completed: true, status: 'pending' }
      ];
    } else if (order?.returnRequestStatus === 'rejected') {
      return [
        { label: 'Order Placed', completed: true },
        { label: 'Processing', completed: true },
        { label: 'Shipped', completed: true },
        { label: 'Out for Delivery', completed: true },
        { label: 'Delivered', completed: true },
        { label: 'Return Rejected', completed: true, status: 'rejected' }
      ];
    }

    return steps;
  };

  // ---- Summary calculations derived from backend fields ----
  const offerDiscount = (order?.discountAmount ?? 0) - (order?.couponDiscount ?? 0);
  const itemsPriceBeforeDiscount = order?.itemsPrice ?? 0; // original prices sum
  const subtotalAfterOffer = itemsPriceBeforeDiscount - offerDiscount;
  const couponDiscount = order?.couponDiscount ?? 0;

  if (fetchingOrderDetails || !order) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/my-orders')} 
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Order #{order.orderNumber}
          </h2>
          <div className="flex items-center">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
            <button 
              className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              title="Download Invoice"
            >
              <FileText size={20} />
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 my-4"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Order Date
            </h3>
            <p className="text-base">
              {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Payment Method
            </h3>
            <p className="text-base">
              {order.paymentMethod}
            </p>
          </div>
        </div>
      </div>

      {/* Order Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Progress</h2>
        <div className="relative">
          {/* Progress bar */}
          <div className="overflow-hidden h-2 mb-6 text-xs flex rounded bg-gray-200">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          
          {/* Steps */}
          <div className="flex justify-between">
            {getOrderSteps().map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`rounded-full h-8 w-8 flex items-center justify-center mb-1 ${step.completed ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step.completed ? <Check size={16} /> : index + 1}
                </div>
                <div className="text-xs text-center">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item._id} className="relative">
              <div className={(item.isCancelled || item.isReturned || ['pending','rejected','approved'].includes(item.returnRequestStatus)) ? 'opacity-60' : ''}>
                {(item.isCancelled || item.isReturned || ['pending','rejected','approved'].includes(item.returnRequestStatus)) && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span 
                      className={`px-3 py-1 text-sm font-bold rounded-full transform -rotate-12 ${item.isCancelled ? 'bg-red-100 text-red-800' : item.returnRequestStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : item.returnRequestStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}
                    >
                      {item.isCancelled ? 'CANCELLED' : item.returnRequestStatus === 'pending' ? 'RETURN REQUESTED' : item.returnRequestStatus === 'rejected' ? 'RETURN REJECTED' : 'RETURNED'}
                    </span>
                  </div>
                )}
                <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={item.product?.images?.[0] || 'https://via.placeholder.com/100'}
                      alt={item.product?.name || 'Product Image'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex flex-col h-full">
                      <h3 className="text-lg font-semibold mb-1">
                        {item.product?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Size: {item.variant.size} | Quantity: {item.quantity}
                      </p>
                      <div className="flex items-center mb-2">
                        {(() => {
                          const original = item.price;
                          const effective = (
                            item.effectivePrice ??
                            (item.totalPrice && item.totalPrice < original ? item.totalPrice : null) ??
                            (item.discount > 0 ? original * (1 - item.discount / 100) : original)
                          );
                          return (
                            <>
                              {effective < original && (
                                <span className="text-sm text-gray-500 line-through mr-2">₹{original.toFixed(2)}</span>
                              )}
                              <span className="text-blue-600 font-medium">₹{effective.toFixed(2)}</span>
                              {effective < original && (
                                <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                  {item.discount ? `${item.discount}% OFF` : 'OFFER'}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-bold">
                          {(() => {
                            const effective = (
                              item.effectivePrice ??
                              (item.totalPrice && item.totalPrice < item.price ? item.totalPrice : null) ??
                              (item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price)
                            );
                            return `Total: ₹${(effective * item.quantity).toFixed(2)}`;
                          })()}
                        </span>
                        <div className="flex space-x-2">
                          {!item.isCancelled && !item.isReturned && ['pending', 'processing', 'shipped', 'out for delivery'].includes(order.status) && (
                            <button 
                              className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleCancelItem(item)}
                              disabled={cancellingItem}
                            >
                              <X size={16} className="mr-1" />
                              Cancel
                            </button>
                          )}
                          {!item.isCancelled && !item.isReturned && !['pending','approved','rejected'].includes(item.returnRequestStatus) && order.status === 'delivered' && (
                            <button 
                              className="inline-flex items-center px-3 py-1 text-sm font-medium text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleReturnItem(item)}
                              disabled={returningItem}
                            >
                              <RotateCcw size={16} className="mr-1" />
                              Return
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="my-4 border-b border-gray-200"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address and Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="bg-white rounded-lg shadow p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <p className="mb-1">{order.shippingAddress.name}</p>
            <p className="mb-1">{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p className="mb-1">{order.shippingAddress.addressLine2}</p>
            )}
            <p className="mb-1">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="mb-1">{order.shippingAddress.country}</p>
            <p className="mb-1">Phone: {order.shippingAddress.phoneNumber}</p>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Items Price</span>
                <span className="font-medium">₹{itemsPriceBeforeDiscount.toFixed(2)}</span>
              </div>
              {offerDiscount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Offer Discount</span>
                  <span className="text-red-600">-₹{offerDiscount.toFixed(2)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Coupon Discount</span>
                  <span className="text-red-600">-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">₹{order.shippingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">₹{order.taxPrice.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between py-2">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-blue-600">₹{order.totalPrice.toFixed(2)}</span>
              </div>

              {/* Pay Now button for unpaid Razorpay orders */}
              {order.paymentMethod === 'RAZORPAY' && !order.isPaid && (
                <div className="mt-4">
                  <RazorpayButton
                    order={order}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    autoLaunch={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Item Dialog */}
      {openCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Cancel Item</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this item? Please provide a reason for cancellation.
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
                onClick={confirmCancelItem} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={cancellingItem}
              >
                {cancellingItem ? (
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

      {/* Return Item Dialog */}
      {openReturnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Return Item</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to return this item? Please provide a reason for the return.
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
                onClick={confirmReturnItem} 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={returningItem}
              >
                {returningItem ? (
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

export default OrderDetails;
