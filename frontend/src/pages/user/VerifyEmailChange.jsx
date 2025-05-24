import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmailChangeThunk } from '../../features/changeEmail/changeEmailSlice';
import { logoutThunk } from '../../features/authSlice';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const VerifyEmailChange = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const verificationAttempted = useRef(false);
  
  const { isLoading, verificationStatus, message } = useSelector(
    (state) => state.changeEmail
  );
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast.error('Invalid verification link');
      return;
    }
    
    // Prevent multiple verification attempts with the same token
    if (verificationAttempted.current) {
      console.log("Verification already attempted, skipping duplicate request");
      return;
    }
    
    console.log("Verifying email with token:", token);
    verificationAttempted.current = true;
    dispatch(verifyEmailChangeThunk(token));
  }, [searchParams, dispatch]);
  
  // Show toast messages based on Redux state changes
  useEffect(() => {
    if (verificationStatus === 'success' && message) {
      toast.success(message);
      
      // Properly log out the user and then redirect to login
      const timer = setTimeout(() => {
        dispatch(logoutThunk()).then(() => {
          navigate('/login');
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    if (verificationStatus === 'error' && message) {
      toast.error(message);
    }
  }, [verificationStatus, message, navigate, dispatch]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {(isLoading || verificationStatus === 'verifying') && (
            <div className="flex flex-col items-center justify-center py-6">
              <FaSpinner className="animate-spin text-blue-600 text-4xl mb-4" />
              <p className="text-gray-700 text-lg">Verifying your email...</p>
              <p className="text-gray-500 mt-2">Please wait while we process your request.</p>
            </div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-6">
              <FaCheckCircle className="text-green-500 text-5xl mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Email Verified Successfully!</h3>
              <p className="text-gray-700 text-center">
                Your email address has been successfully updated.
              </p>
              <p className="text-gray-500 mt-4">
                You will be redirected to the login page in a few seconds...
              </p>
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="flex flex-col items-center justify-center py-6">
              <FaTimesCircle className="text-red-500 text-5xl mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Verification Failed</h3>
              <p className="text-gray-700 text-center">
                {message || "We couldn't verify your email. The link may be invalid or expired."}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/profile/email')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailChange;
