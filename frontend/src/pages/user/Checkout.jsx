import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check, ChevronRight, X, Loader2 } from 'lucide-react';
import { createOrder, resetOrderCreated, clearOrderDetails, markPaymentFailed, cancelUnpaidPending } from '../../features/order/orderSlice';
import { 
  fetchCart, 
  applyCoupon, 
  removeCoupon, 
  clearCartError 
} from '../../features/cart/cartSlice';
import { addAddressThunk, getAllAddressesThunk } from '../../features/userAddress/addressSlice';
import { fetchUserProfile } from '../../features/userprofile/profileSlice';
import RazorpayButton from '../../components/checkout/RazorpayButton';
import CouponForm from '../../components/checkout/CouponForm';
import { clearPaymentState } from '../../features/razorpay/paymentSlice';
import api from '../../apis/user/api';

const steps = [
  { id: 'cart', name: 'Cart' },
  { id: 'shipping', name: 'Shipping' },
  { id: 'payment', name: 'Payment' },
  { id: 'review', name: 'Review' }
];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(1); // Start at shipping step
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormLoading, setAddressFormLoading] = useState(false);
  const cartCoupon   = useSelector(state => state.cart.coupon);
  const cartSummary  = useSelector(state => state.cart.summary);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isCouponValidating, setIsCouponValidating] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const { profileData } = useSelector(state => state.profile);
  const { 
    items: cartItems, 
    loading: cartLoading, 
    count: cartCount, 
    summary, 
    couponValidation,
    discountAmount
  } = useSelector((state) => state.cart);
  const { creatingOrder, orderCreated, order, error } = useSelector((state) => state.order);
  const { addresses, addressLoading, addressError } = useSelector(state => state.address);
  const { balance: walletBalance } = useSelector(state => state.wallet);
  
  const [addressForm, setAddressForm] = useState({
    name: '',
    phoneNumber: '',
    alternativePhoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });
  
  // Keep local appliedCoupon in sync with redux cart
  useEffect(() => {
    if (cartCoupon) {
      setAppliedCoupon({
        code: cartCoupon.code,
        discountAmount: cartSummary?.couponDiscount || 0,
        type: cartCoupon.discountType
      });
    } else {
      setAppliedCoupon(null);
    }
  }, [cartCoupon, cartSummary]);

  // Handle coupon application
  const handleApplyCoupon = async (couponCode) => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsCouponValidating(true);
    
    try {
      const result = await dispatch(applyCoupon(couponCode.trim().toUpperCase()));
      
      if (applyCoupon.fulfilled.match(result)) {
        const { coupon, summary } = result.payload;
        // redux state will trigger useEffect sync, but set local for immediate UI
        setAppliedCoupon({
          code: coupon.code,
          discountAmount: summary.couponDiscount,
          type: coupon.discountType
        });
        toast.success('Coupon applied successfully!');
      } else {
        const errorMessage = result.payload || 'Invalid or expired coupon code';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error(error.message || 'Failed to apply coupon');
    } finally {
      setIsCouponValidating(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    dispatch(removeCoupon())
      .unwrap()
      .then(() => {
        // redux state sync will clear it but clear local immediately
        setAppliedCoupon(null);
        toast.success('Coupon removed successfully');
      })
      .catch(error => {
        toast.error(error || 'Failed to remove coupon');
      });
  };

  // Get total price from summary
  const totalPrice = summary?.total || 0;
  
  // Initial data loading effect - runs only once on component mount
  useEffect(() => {
    console.log(cartItems,'nononono');
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchCart());
    dispatch(getAllAddressesThunk());
    
    // Fetch user profile if not already loaded
    if (!profileData && user._id) {
      dispatch(fetchUserProfile(user._id));
    }
  }, [dispatch, user, navigate, profileData]);
  
  // Clear any stale order when Checkout mounts
  useEffect(() => {
    dispatch(clearOrderDetails());
    dispatch(resetOrderCreated());
  }, [dispatch]);
  
  // Handle order creation success - separate effect
  useEffect(() => {
    if (orderCreated && order) {
      if (paymentMethod === 'RAZORPAY') {
        // Don't navigate yet, let the Razorpay button handle the payment
        return;
      } else if (paymentMethod === 'COD' || paymentMethod === 'WALLET') {
        const orderId = order?._id || order._id;
        navigate(`/order/success/${orderId}`);
        dispatch(resetOrderCreated());
      }
    }
  }, [orderCreated, order, navigate, dispatch, paymentMethod]);

  // Handle payment success callback from RazorpayButton
  const handlePaymentSuccess = useCallback(() => {
    if (order) {
      const orderId = order?._id || order._id;
      navigate(`/order/success/${orderId}`);
      dispatch(resetOrderCreated());
    }
  }, [order, navigate, dispatch]);

  // Handle payment error callback from RazorpayButton
  const handlePaymentError = useCallback((errorMsg) => {
    // If user simply dismissed the Razorpay modal, treat it as a cancellation – not a failure
    const isCancelledByUser = errorMsg && errorMsg.toLowerCase().includes('cancelled');

    toast.error(isCancelledByUser ? 'Payment cancelled' : (errorMsg || 'Payment failed. Please try again.'));
    setProcessingPayment(false);

    // Only mark failure / redirect when it's an actual payment failure
    if (!isCancelledByUser) {
      if (order?._id) {
        dispatch(markPaymentFailed(order._id)).finally(() => {
          navigate(`/order/failure/${order._id}`);
        });
      } else {
        dispatch(resetOrderCreated());
        dispatch(clearOrderDetails());
      }
    }
  }, [dispatch, navigate, order]);

  // Handle errors - separate effect
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  useEffect(() => {
    // Set the first address as selected by default if available
    if (addresses && addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0]._id);
    }
  }, [addresses, selectedAddress]);
  
  // Update form with profile data when it loads
  useEffect(() => {
    if (profileData) {
      resetAddressForm();
    }
  }, [profileData]);
  
  // Show toast messages for address operations
  useEffect(() => {
    if (addressError) {
      toast.error(addressError);
    }
  }, [addressError]);
  
  const resetAddressForm = () => {
    setAddressForm({
      name: profileData?.username || '',
      phoneNumber: profileData?.phone || '',
      alternativePhoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false
    });
  };
  
  const handleSubmitOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }
    
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    
    try {
      setProcessingPayment(true);
      
      // Get the selected address details
      const address = addresses.find(addr => addr._id === selectedAddress);
      
      // Prepare order data
      const orderData = {
        shippingAddress: address,
        paymentMethod,
        items: cartItems.map(item => ({
          product: item.product._id,
          variant: item.variant._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        itemsPrice: summary.subtotal,
        taxPrice: 0, // Add tax calculation if needed
        shippingPrice: 0, // Add shipping calculation if needed
        totalPrice: summary.total,
        coupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discount: appliedCoupon.discountAmount
        } : null
      };
      
      // Create the order
      const result = await dispatch(createOrder(orderData)).unwrap();
      
      // backend returns { success:true, order:{ _id: .. } }
      const orderId = result.order?._id || result._id;

      // If payment method is COD or WALLET, redirect to success page
      if (paymentMethod === 'COD' || paymentMethod === 'WALLET') {
        navigate(`/order/success/${orderId}`);
      }
      // For Razorpay, the payment will be handled by the RazorpayButton component
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
      setProcessingPayment(false);
    }
  };

  // Track unpaid Razorpay order for potential cleanup
  const pendingOrderIdRef = useRef(null);

  const handleNext = () => {
    if (activeStep === 1 && !selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleAddressChange = (event) => {
    setSelectedAddress(event.target.value);
  };
  
  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Auto-fill city and state when pincode is entered
    if (name === 'postalCode' && value.length === 6) {
      fetchPincodeDetails(value);
    }
  };
  
  // Function to fetch pincode details from India Post API
  const fetchPincodeDetails = async (pincode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setAddressForm(prev => ({
          ...prev,
          city: postOffice.Block || postOffice.District || '',
          state: postOffice.State || ''
        }));
        
        toast.success('Address details auto-filled based on pincode');
      } else {
        toast.error('Invalid pincode or no data available');
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error);
      toast.error('Failed to fetch pincode details');
    }
  };
  
  const handleAddressFormSubmit = async (e) => {
    e.preventDefault();
    setAddressFormLoading(true);
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'phoneNumber', 'addressLine1', 'city', 'state', 'postalCode'];
      for (const field of requiredFields) {
        if (!addressForm[field]) {
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          setAddressFormLoading(false);
          return;
        }
      }
      
      // Add new address
      await dispatch(addAddressThunk(addressForm)).unwrap();
      toast.success('Address added successfully');
      
      // Refresh addresses
      await dispatch(getAllAddressesThunk());
      
      // Reset form and state
      setShowAddressForm(false);
      resetAddressForm();
      
    } catch (err) {
      // Error is already handled in the thunk and displayed via useEffect
    } finally {
      setAddressFormLoading(false);
      setProcessingPayment(false);
    }
  };
  
  const handleRazorpaySuccess = async (paymentResponse) => {
    try {
      setProcessingPayment(true);
      // Create order with Razorpay payment details
      await dispatch(createOrder({
        addressId: selectedAddress,
        paymentMethod: 'RAZORPAY',
        paymentDetails: {
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature
        }
      })).unwrap();
    } catch (error) {
      console.error('Order submission after payment failed:', error);
      toast.error('Order creation failed after payment');
      setProcessingPayment(false);
    }
  };
  
  const handleRazorpayError = (error) => {
    console.error('Razorpay payment failed:', error);
    toast.error('Payment failed. Please try again.');
    setProcessingPayment(false);
  };
  
  const getStepContent = (step) => {
    switch (step) {
      case 1: // Shipping
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Shipping Address
            </h2>
            
            {!showAddressForm ? (
              <>
                {addresses && addresses.length > 0 ? (
                  <div>
                    <div className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                          <div key={address._id} className="relative">
                            <div 
                              className={`p-4 rounded-lg border-2 ${selectedAddress === address._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} cursor-pointer`}
                              onClick={() => setSelectedAddress(address._id)}
                            >
                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id={`address-${address._id}`}
                                    name="shipping-address"
                                    type="radio"
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    checked={selectedAddress === address._id}
                                    onChange={() => setSelectedAddress(address._id)}
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor={`address-${address._id}`} className="font-medium text-gray-900 block">
                                    {address.name}
                                  </label>
                                  <div className="text-gray-600 mt-1">
                                    <p>{address.addressLine1}</p>
                                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                                    <p>{address.city}, {address.state}, {address.postalCode}</p>
                                    <p>{address.country}</p>
                                    <p className="mt-1">Phone: {address.phoneNumber}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button 
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => setShowAddressForm(true)}
                      >
                        Add New Address
                      </button>
                    </div>
                  </div>
                ) : addressLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      You don't have any saved addresses.
                    </p>
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={() => setShowAddressForm(true)}
                    >
                      Add New Address
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Add New Address</h3>
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAddressForm(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleAddressFormSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.name}
                        onChange={handleAddressFormChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.phoneNumber}
                        onChange={handleAddressFormChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="alternativePhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Alternative Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        id="alternativePhoneNumber"
                        name="alternativePhoneNumber"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.alternativePhoneNumber}
                        onChange={handleAddressFormChange}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <textarea
                        id="addressLine1"
                        name="addressLine1"
                        rows="2"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.addressLine1}
                        onChange={handleAddressFormChange}
                        required
                      ></textarea>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2 (Optional)
                      </label>
                      <textarea
                        id="addressLine2"
                        name="addressLine2"
                        rows="2"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.addressLine2}
                        onChange={handleAddressFormChange}
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.postalCode}
                        onChange={handleAddressFormChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.city}
                        onChange={handleAddressFormChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.state}
                        onChange={handleAddressFormChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={addressForm.country}
                        onChange={handleAddressFormChange}
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          id="isDefault"
                          name="isDefault"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={addressForm.isDefault}
                          onChange={handleAddressFormChange}
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                          Set as default address
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={addressFormLoading}
                    >
                      {addressFormLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : 'Save Address'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        );
        
      case 2: // Payment
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Payment Method
            </h2>
            
            <div className="mt-4">
              <div className="space-y-4">
                <div 
                  className={`p-4 rounded-lg border-2 ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} cursor-pointer mb-3`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="payment-cod"
                        name="payment-method"
                        type="radio"
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="payment-cod" className="font-medium text-gray-900 block">
                        Cash on Delivery
                      </label>
                      <p className="text-gray-500 mt-1">
                        Pay when your order is delivered
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 ${paymentMethod === 'WALLET' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} cursor-pointer mb-3`}
                  onClick={() => setPaymentMethod('WALLET')}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="payment-wallet"
                        name="payment-method"
                        type="radio"
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        checked={paymentMethod === 'WALLET'}
                        onChange={() => setPaymentMethod('WALLET')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="payment-wallet" className="font-medium text-gray-900 block">
                        Pay with Wallet (Balance: ₹{walletBalance.toFixed(2)})
                      </label>
                      <p className="text-gray-500 mt-1">
                        Instant payment using your store wallet balance
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 ${paymentMethod === 'RAZORPAY' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} cursor-pointer mb-3`}
                  onClick={() => setPaymentMethod('RAZORPAY')}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="payment-razorpay"
                        name="payment-method"
                        type="radio"
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        checked={paymentMethod === 'RAZORPAY'}
                        onChange={() => setPaymentMethod('RAZORPAY')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="payment-razorpay" className="font-medium text-gray-900 block">
                        Pay with Razorpay
                      </label>
                      <p className="text-gray-500 mt-1">
                        Secure payment via credit/debit card, UPI, net banking
                      </p>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'RAZORPAY' && orderCreated && order && (
                  <div className="mt-4">
                    <RazorpayButton
                      order={order}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      buttonText="Pay with Razorpay"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
        case 3: // Review
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Order Summary
              </h2>
              <div className="space-y-4">
                {cartItems && cartItems.length > 0 ? cartItems.map((item) => (
                  <div key={item._id} className="py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded">
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-base font-medium text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Size: {item.variant.size} | Qty: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">
                            ₹{parseFloat(item.product.price || 0).toFixed(2)}
                          </span> for each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-medium text-gray-900">
                          ₹{(parseFloat(item.product.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-4 text-center text-gray-500">
                    No items in cart
                  </div>
                )}
              
                <div className="border-t border-gray-200 my-4"></div>
              
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{summary?.subtotal ? parseFloat(summary.subtotal).toFixed(2) : '0.00'}</span>
                </div>
              
                {/* Coupon Form */}
                {appliedCoupon ? (
                  <div className="flex justify-between py-2">
                    <div className="flex items-center">
                      <span className="text-gray-600">Discount</span>
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                        {appliedCoupon.code}
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-red-600 hover:text-red-800 ml-1"
                          title="Remove coupon"
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                    <span className="font-medium text-green-600">
                      -₹{parseFloat(appliedCoupon.discountAmount).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4">
                    <CouponForm 
                      onApplyCoupon={handleApplyCoupon}
                      onRemoveCoupon={handleRemoveCoupon}
                      appliedCoupon={appliedCoupon}
                      isLoading={isCouponValidating}
                    />
                  </div>
                )}
              
                <div className="border-t border-gray-200 my-4"></div>
              
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">$0.00</span>
                </div>
              
                <div className="flex justify-between py-2 font-semibold text-lg border-t border-gray-200 pt-3 mt-1">
                  <span>Total</span>
                  <span>
                    ₹{summary?.total ? parseFloat(summary.total).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-2">
                Shipping
              </h3>
              
              {addresses && selectedAddress && (
                <div className="mb-6">
                  {addresses.filter(addr => addr._id === selectedAddress).map((address) => (
                    <div key={address._id} className="text-gray-700">
                      <p className="font-medium">
                        {address.name}
                      </p>
                      <p>
                        {address.addressLine1}
                        {address.addressLine2 && <>, {address.addressLine2}</>}
                      </p>
                      <p>
                        {address.city}, {address.state}, {address.postalCode}
                      </p>
                      <p>
                        {address.country}
                      </p>
                      <p>
                        Phone: {address.phoneNumber}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">
                  Payment
                </h3>
                
                <div className="space-y-2">
                  <p className="text-gray-700">
                    {paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod === 'WALLET' ? 'Wallet Payment' : 'Online Payment (Razorpay)'}
                  </p>
                  
                  {paymentMethod === 'RAZORPAY' && order && (
                    <div className="mt-4">
                      <RazorpayButton
                        order={order}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        loading={processingPayment}
                        buttonText={processingPayment ? 'Processing Payment...' : 'Pay Now'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Unknown step</div>;
    }
  };

  // Cleanup: cancel unpaid pending order when user leaves checkout page
  useEffect(() => {
    return () => {
      const orderId = pendingOrderIdRef.current;
      if (orderId) {
        api.delete(`/orders/${orderId}/unpaid`).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!orderCreated || paymentMethod !== 'RAZORPAY' || !order?._id) return;

    const handleBeforeUnload = () => {
      // Fire the thunk – browser may ignore the async call but this is the clean, single source of truth
      dispatch(cancelUnpaidPending(order._id));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup listener and run thunk on route change (component unmount)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      dispatch(cancelUnpaidPending(order._id));
    };
  }, [orderCreated, paymentMethod, order, dispatch]);

  // ... (rest of the component remains the same)


  if (cartLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show empty cart message if cart is empty
  if (!cartLoading && (!cartItems || cartItems.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16 max-w-6xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before proceeding to checkout.</p>
          <Link to="/products" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  
  const payable = summary?.total || 0;
  const walletShort   = paymentMethod==='WALLET' && walletBalance < payable;
  const canPlaceOrder = !walletShort && selectedAddress && paymentMethod && !creatingOrder;

  return (
    <div className="container mx-auto px-4 py-8 mt-16 max-w-6xl">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Stepper */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                {activeStep > stepIdx ? (
                  <div className="group">
                    <span className="flex items-center">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 group-hover:bg-blue-800">
                        <Check className="h-5 w-5 text-white" aria-hidden="true" />
                      </span>
                      <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                    </span>
                  </div>
                ) : activeStep === stepIdx ? (
                  <div className="flex items-center" aria-current="step">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </span>
                    <span className="ml-4 text-sm font-medium text-blue-600">{step.name}</span>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-center">
                      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                      </div>
                      <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                    </div>
                  </div>
                )}
                
                {stepIdx !== steps.length - 1 && (
                  <div 
                    className="absolute top-4 right-0 hidden h-0.5 w-5 bg-gray-200 lg:block" 
                    aria-hidden="true" 
                    style={{ width: '100%', right: '-50%' }} 
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            {getStepContent(activeStep)}
            
            <div className="flex justify-between mt-8">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={activeStep === 1 ? () => navigate('/cart') : handleBack}
              >
                {activeStep === 1 ? 'Back to Cart' : 'Back'}
              </button>
              
              {activeStep === steps.length - 1 ? (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  onClick={handleSubmitOrder}
                  disabled={!canPlaceOrder}
                >
                  {creatingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Placing Order...
                    </>
                  ) : 'Place Order'}
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleNext}
                >
                  Next
                </button>
              )}
            </div>
          </div>
          
          <div className="md:col-span-4">
            <div className="bg-gray-50 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Items ({cartCount || 0})</p>
                  <p>₹{summary?.subtotal ? parseFloat(summary.subtotal).toFixed(2) : '0.00'}</p>
                </div>
                
                {summary?.productDiscount > 0 && (
                  <div className="flex justify-between text-base font-medium text-green-600 mt-2">
                    <p>Offer Discount</p>
                    <p>-₹{parseFloat(summary.productDiscount).toFixed(2)}</p>
                  </div>
                )}
                {summary?.couponDiscount > 0 && (
                  <div className="flex justify-between text-base font-medium text-green-600 mt-2">
                    <p>Coupon Discount</p>
                    <p>-₹{parseFloat(summary.couponDiscount).toFixed(2)}</p>
                  </div>
                )}
                
                <div className="flex justify-between text-base font-medium text-gray-900 mt-2">
                  <p>Shipping</p>
                  <p>$0.00</p>
                </div>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <div className="flex justify-between text-base font-medium text-gray-900 mt-2">
                  <p>Total</p>
                  <p className="text-lg font-bold">₹{summary?.total ? parseFloat(summary.total).toFixed(2) : '0.00'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {walletShort && (
        <p className="text-red-500 text-sm">Wallet balance is insufficient for this total. Apply coupon or choose another payment method.</p>
      )}
    </div>
  );

};

export default Checkout;
