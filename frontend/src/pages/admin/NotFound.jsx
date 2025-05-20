import React from 'react';
import { Link } from 'react-router-dom';

const AdminNotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800">
      <div className="text-center p-10 bg-white rounded-lg shadow-lg max-w-lg border-l-4 border-gray-600">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-gray-200 mb-2">404</h1>
          <div className="relative -mt-20 mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-2">Admin Page Not Found</h2>
            <div className="w-24 h-1 bg-gray-600 mx-auto mt-2"></div>
          </div>
          <div className="bg-gray-100 p-4 rounded-md mb-6">
            <p className="text-gray-700">
              The admin page you're looking for doesn't exist or you may not have permission to access it.
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Link 
            to="/" 
            className="px-6 py-3 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Main Site
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          If you believe this is an error, please contact the system administrator.
        </div>
      </div>
    </div>
  );
};

export default AdminNotFound;
