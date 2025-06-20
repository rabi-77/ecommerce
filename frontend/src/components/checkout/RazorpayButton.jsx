import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  razorpayOrderThunk, 
  verifyPaymentThunk, 
  getRazorPayKeyThunk, 
  clearPaymentState 
} from '../../features/razorpay/paymentSlice';
import { markPaymentFailed } from '../../features/order/orderSlice';

const RazorpayButton = ({ order, onSuccess, onError, buttonText = 'Pay Now', loading = false, autoLaunch = true }) => {
  const dispatch = useDispatch();
  const { razorpayloading, razorpayerror, verified } = useSelector((state) => state.payment);
  
  // Load Razorpay script
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const loadRazorpay = async () => {
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        if (onError) onError('Razorpay SDK failed to load');
        return false;
      }
      return true;
    };

    loadRazorpay();

    return () => {
      dispatch(clearPaymentState());
    };
  }, [dispatch, onError]);

  // Handle payment success
  useEffect(() => {
    if (verified && onSuccess) {
      onSuccess();
    }
  }, [verified, onSuccess]);

  // Handle payment errors
  useEffect(() => {
    if (razorpayerror) {
      toast.error(razorpayerror);
      if (onError) {
        onError(razorpayerror);
      }
    }
  }, [razorpayerror, onError]);

  const handlePayment = useCallback(async () => {
    if (!order || !order._id) {
      const errorMsg = 'Invalid order details';
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    try {
      // Get Razorpay key first
      const keyResult = await dispatch(getRazorPayKeyThunk()).unwrap();
      
      if (!keyResult || !keyResult.key) {
        throw new Error('Failed to get Razorpay key');
      }
      
      // Create Razorpay order
      const resultAction = await dispatch(razorpayOrderThunk({
        amount: Math.round(order.totalPrice), // Amount in INR; backend converts to paise
        orderId: order._id,
        currency: 'INR',
        receipt: `order_${order._id}`
      }));
      
      if (razorpayOrderThunk.fulfilled.match(resultAction)) {
        const { order: razorpayOrder } = resultAction.payload;
        
        if (!razorpayOrder || !razorpayOrder.id) {
          throw new Error('Failed to create Razorpay order');
        }
        
        // Initialize Razorpay payment
        const options = {
          key: keyResult.key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: 'vercetti',
          description: `Order #${order._id}`,
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              await dispatch(verifyPaymentThunk({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id,
              })).unwrap();
              
              // onSuccess will be called by the useEffect when verified is true
            } catch (error) {
              console.error('Payment verification failed:', error);
              const errorMsg = error.message || 'Payment verification failed. Please try again.';
              toast.error(errorMsg);
              // mark order as failed so user can retry later
              if (order?._id) {
                dispatch(markPaymentFailed(order._id));
              }
              if (onError) onError(errorMsg);
            } finally {
              cleanupRazorpayModal();
            }
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled');
              if (onError) onError('Payment cancelled by user');
              cleanupRazorpayModal();
            },
          },
          prefill: {
            name: order.shippingAddress?.name || '',
            email: order.user?.email || '',
            contact: order.shippingAddress?.phoneNumber || '',
          },
          notes: {
            order_id: order._id
          },
          theme: {
            color: '#3399cc'
          }
        };

        const rzp = new window.Razorpay(options);
        // Listen for payment failure explicitly
        rzp.on('payment.failed', function (response) {
          console.error('Razorpay payment failed:', response.error);
          const errorMsg = response.error?.description || 'Payment failed. Please try again.';
          // Mark order as failed in backend
          if (order?._id) {
            dispatch(markPaymentFailed(order._id));
          }
          toast.error(errorMsg);
          if (onError) onError(errorMsg);
          cleanupRazorpayModal();
        });

        rzp.open();
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      toast.error(error.message || 'Failed to initialize payment');
      if (onError) {
        onError(error.message || 'Payment initialization failed');
      }
      cleanupRazorpayModal();
    }
  }, [dispatch, order, onError]);

  // Helper to restore scrolling and remove leftover Razorpay DOM
  const cleanupRazorpayModal = () => {
    document.body.style.overflow = '';
    const existing = document.querySelector('.razorpay-container');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  };

  // Auto-trigger payment when component mounts if enabled (e.g., Checkout flow)
  useEffect(() => {
    if (autoLaunch && order?._id) {
      handlePayment();
    }
  }, [autoLaunch, order, handlePayment]);

  return (
    <button
      onClick={handlePayment}
      disabled={razorpayloading || !order?._id}
      className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${
        razorpayloading || !order?._id ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {razorpayloading ? 'Processing...' : buttonText}
    </button>
  );
};

export default RazorpayButton;
