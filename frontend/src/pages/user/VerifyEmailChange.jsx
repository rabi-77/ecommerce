import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const VerifyEmailChange = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  
  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        toast.error('Invalid verification link');
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/user/verify-email-change?token=${token}`);
        setStatus('success');
        toast.success(response.data.message || 'Email updated successfully');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
      } catch (err) {
        setStatus('error');
        toast.error(err.response?.data?.message || 'Failed to verify email');
      }
    };
    
    verifyToken();
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-6">
              <FaSpinner className="animate-spin text-blue-600 text-4xl mb-4" />
              <p className="text-gray-700 text-lg">Verifying your email...</p>
              <p className="text-gray-500 mt-2">Please wait while we process your request.</p>
            </div>
          )}
          
          {status === 'success' && (
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
          
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-6">
              <FaTimesCircle className="text-red-500 text-5xl mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Verification Failed</h3>
              <p className="text-gray-700 text-center">
                We couldn't verify your email. The link may be invalid or expired.
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
