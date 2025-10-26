import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, Heart } from 'lucide-react';
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import AnnouncementBanner from "../components/AnnouncementBanner";
import { checkUserStatus } from '../services/authServices';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { setupUserTokenRefresh } from '../utils/tokenRefresh';

const UserLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize token refresh for user
    const cancelTokenRefresh = setupUserTokenRefresh();
    
    // Cleanup function to cancel the refresh timer when component unmounts
    return () => {
      cancelTokenRefresh();
    };
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('tokenAccess');
    
    if (user && token) {
      // Periodically check if user is blocked
      const checkStatus = async () => {
        try {
          
          const response = await checkUserStatus();
          
          if (response.isBlocked) {
            console.warn('User is blocked, logging out');
            // Clear localStorage first to ensure immediate UI update
            localStorage.removeItem('user');
            localStorage.removeItem('tokenAccess');
            localStorage.removeItem('tokenRefresh');
            
            // Dispatch logout action to update Redux state
            dispatch(logout());
            
            // Show notification
            toast.error('Your account has been blocked. Please contact support.');
            
            // Trigger a storage event for other components to detect
            window.dispatchEvent(new Event('storage'));
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          
          // If there's an authentication error, it might mean the token is invalid
          if (error.message.includes('token') || 
              error.message.includes('unauthorized') || 
              error.message.includes('No access token')) {
            console.warn('Authentication error, redirecting to login');
            dispatch(logout());
            navigate('/login');
            toast.error('Your session has expired. Please log in again.');
          }
        }
      };
      
      // Check immediately on page load
      checkStatus();
      
      // Set up interval to check periodically (every 5 minutes)
      const intervalId = setInterval(checkStatus, 5 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [dispatch, navigate]);

  const isActive = (path) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600';
  };

  return (
    <div className="flex flex-col font-serif min-h-screen">
      <div className="pt-16"> {/* This div creates space for the fixed navbar */}
        <AnnouncementBanner />
      </div>
      <Navbar />
      <main className="flex-grow"> 
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
