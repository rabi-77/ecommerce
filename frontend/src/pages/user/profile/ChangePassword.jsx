import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { changePassword, resetChangePassword, clearChangePasswordErrors } from '../../../features/changePassword/changePasswordSlice';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isSuccess, isError, message, fieldError } = useSelector(
    (state) => state.changePassword
  );
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const isGoogleUserWithoutPassword = user?.authProvider === 'google' && !user?.hasPassword;
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
      
      if (fieldError) {
        setErrors(prev => ({
          ...prev,
          [fieldError]: message
        }));
      }
    }
    
    if (isSuccess) {
      toast.success(message);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      dispatch(resetChangePassword());
    }
    
  }, [isError, isSuccess, message]);
  
  useEffect(() => {
    return () => {
      dispatch(resetChangePassword());
    };
  }, []);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
    
    if (isError) {
      dispatch(clearChangePasswordErrors());
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      if (formData.newPassword.length < 8 || formData.newPassword.length > 16) {
        newErrors.newPassword = 'Password must be between 8 and 16 characters';
      }
      
      // Regex validation - same as registration form
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[^\s]+$/;
      if (!passwordRegex.test(formData.newPassword)) {
        newErrors.newPassword = 'Password must include 1 uppercase, 1 lowercase, 1 number, 1 special character, and no spaces';
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    dispatch(changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    }));
  };
  
  if (isGoogleUserWithoutPassword) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
        <div className="bg-blue-50 text-blue-800 p-4 rounded-md max-w-md mx-auto">
          <p>You signed up with Google, so you don't need to set a password here.</p>
          <p className="mt-2">To change your password, please visit your Google account settings.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Change Password</h2>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.currentPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Password must be 8-16 characters with at least 1 uppercase, 1 lowercase, 1 number, 1 special character, and no spaces</p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Changing Password...
                </div>
              ) : 'Change Password'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
