import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800">
      <div className="text-center p-10 bg-white rounded-lg shadow-lg max-w-lg border-l-4 border-gray-600">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-gray-200 mb-2">404</h1>
          <div className="relative -mt-20 mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
            <div className="w-24 h-1 bg-gray-600 mx-auto mt-2"></div>
          </div>
          <div className="bg-gray-100 p-4 rounded-md mb-6">
            <p className="text-gray-700">
              We're sorry, the page you requested could not be found.<br />
              Please check the URL or try navigating to another page.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
          <Link 
            to="/" 
            className="px-6 py-3 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Back to Homepage
          </Link>
          <Link 
            to="/products" 
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors shadow-sm flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Browse Products
          </Link>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          Need help? Contact our customer support team.
        </div>
      </div>
    </div>
  );
};

export default NotFound;
