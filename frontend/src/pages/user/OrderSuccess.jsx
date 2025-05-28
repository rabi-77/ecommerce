import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  FileText, 
  ShoppingBag, 
  Home 
} from 'lucide-react';
import { getOrderDetails, downloadInvoice } from '../../features/order/orderSlice';
import { toast } from 'react-toastify';

const OrderSuccess = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { order, loading, fetchingOrderDetails, downloadingInvoice } = useSelector((state) => state.order);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (id) {
      dispatch(getOrderDetails(id));
    }
  }, [dispatch, navigate, user, id]);
  
  const handleDownloadInvoice = () => {
    dispatch(downloadInvoice(id))
      .unwrap()
      .then(() => {
        toast.success('Invoice downloaded successfully');
      })
      .catch((error) => {
        toast.error('Failed to download invoice');
      });
  };
  
  if (fetchingOrderDetails || !order) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16 max-w-3xl">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">
          Order Placed Successfully!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>
        
        <div className="inline-block bg-gray-50 px-4 py-2 rounded-md mb-8">
          <h2 className="text-xl font-semibold">
            Order #{order.orderNumber}
          </h2>
        </div>
        
        <div className="border-t border-gray-200 mb-8"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Order Date
            </h3>
            <p className="text-base">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Total Amount
            </h3>
            <p className="text-base">
              ${order.totalPrice.toFixed(2)}
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
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Status
            </h3>
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mb-8"></div>
        
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
          >
            {downloadingInvoice ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Download Invoice
              </>
            )}
          </button>
          
          <Link
            to="/orders"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            View All Orders
          </Link>
          
          <Link
            to="/"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
