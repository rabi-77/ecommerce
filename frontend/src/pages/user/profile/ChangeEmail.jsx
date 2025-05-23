import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../../config';
import { FaEnvelope } from 'react-icons/fa';

const ChangeEmail = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    currentEmail: user?.email || '',
    newEmail: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Check if user logged in with Google
  const isGoogleUser = user?.googleId;
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newEmail) {
      newErrors.newEmail = 'New email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.newEmail)) {
      newErrors.newEmail = 'Please enter a valid email address';
    } else if (formData.newEmail === formData.currentEmail) {
      newErrors.newEmail = 'New email must be different from current email';
    }
    
    if (!isGoogleUser && !formData.password) {
      newErrors.password = 'Password is required to verify your identity';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('tokenAccess');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.post(
        `${API_URL}/user/change-email-request`,
        {
          newEmail: formData.newEmail,
          password: isGoogleUser ? null : formData.password
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setVerificationSent(true);
      toast.success('Verification email sent. Please check your new email inbox to complete the process.');
      
      // Reset form partially
      setFormData({
        ...formData,
        password: ''
      });
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to request email change';
      toast.error(errorMessage);
      
      // Set specific field error if returned from API
      if (err.response?.data?.field) {
        setErrors({
          ...errors,
          [err.response.data.field]: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (isGoogleUser) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">Change Email</h2>
        <div className="bg-blue-50 text-blue-800 p-4 rounded-md max-w-md mx-auto">
          <p>You signed up with Google, so your email is managed by your Google account.</p>
          <p className="mt-2">To change your email, please visit your Google account settings.</p>
        </div>
      </div>
    );
  }
  
  if (verificationSent) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">Verification Email Sent</h2>
        <div className="bg-green-50 text-green-800 p-4 rounded-md max-w-md mx-auto">
          <FaEnvelope className="mx-auto text-4xl mb-3" />
          <p>We've sent a verification email to <strong>{formData.newEmail}</strong>.</p>
          <p className="mt-2">Please check your inbox and click the verification link to complete the email change process.</p>
          <p className="mt-4 text-sm">Didn't receive the email? Check your spam folder or <button 
            onClick={handleSubmit} 
            className="text-blue-600 underline"
            disabled={loading}
          >
            resend the verification
          </button></p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Change Email</h2>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="space-y-4">
          <div>
            <label htmlFor="currentEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Current Email
            </label>
            <input
              type="email"
              id="currentEmail"
              name="currentEmail"
              value={formData.currentEmail}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
              New Email
            </label>
            <input
              type="email"
              id="newEmail"
              name="newEmail"
              value={formData.newEmail}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.newEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.newEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.newEmail}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password (to verify your identity)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Change Email'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangeEmail;
