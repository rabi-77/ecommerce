import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { getOrderDetails } from '../../features/order/orderSlice';
import RazorpayButton from '../../components/checkout/RazorpayButton';

const OrderFailure = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { order, fetchingOrderDetails } = useSelector((state) => state.order);

  useEffect(() => {
    if (id) {
      dispatch(getOrderDetails(id));
    }
  }, [id, dispatch]);

  if (fetchingOrderDetails || !order) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <XCircle size={64} className="text-red-600" />
      <h2 className="mt-4 text-2xl font-bold">Payment Failed</h2>
      <p className="text-gray-600 mt-2">Your transaction could not be completed.</p>

      <div className="mt-6 w-full max-w-sm space-y-3">
        <RazorpayButton
          order={order}
          buttonText="Retry Payment"
          autoLaunch={false}
          onSuccess={() => window.location.replace(`/order/success/${order._id}`)}
          onError={() => {}}
        />
        <Link
          to={`/order/${order._id}`}
          className="block text-center w-full bg-gray-200 py-2 rounded-md hover:bg-gray-300"
        >
          View Order Details
        </Link>
      </div>
    </div>
  );
};

export default OrderFailure;
