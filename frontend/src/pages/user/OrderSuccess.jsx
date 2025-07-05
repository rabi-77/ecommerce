import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  FileText, 
  ShoppingBag, 
  Home 
} from 'lucide-react';
import { 
  getOrderDetails,
  downloadInvoice 
} from '../../features/order/orderSlice';
import { toast } from 'react-toastify';

const OrderSuccess = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { order, fetchingOrderDetails, downloadingInvoice } = useSelector((state) => state.order);
  
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
    if (id) {
      dispatch(downloadInvoice(id))
        .unwrap()
        .then(() => {
          toast.success('Invoice downloaded successfully');
        })
        .catch((error) => {
          toast.error('Failed to download invoice');
        });
    }
  };

  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-red-500">Invalid order ID</p>
          <Link to="/my-orders" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            View Orders
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Order Confirmed!</h2>
          <p className="mt-2 text-base text-gray-500">Your order has been successfully placed.</p>
        </div>

        {fetchingOrderDetails ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{order?.orderNumber || id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(order?.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm text-gray-900">₹{order?.totalPrice || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900">{order?.paymentMethod || 'Loading...'}</dd>
              </div>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleDownloadInvoice}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={downloadingInvoice}
              >
                {downloadingInvoice ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  'Download Invoice'
                )}
              </button>
              <Link
                to="/my-orders"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                View Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;
