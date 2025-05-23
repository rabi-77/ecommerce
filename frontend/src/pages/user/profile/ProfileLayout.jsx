import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaUser, FaEdit, FaKey, FaMapMarkerAlt, FaShoppingBag, FaEnvelope } from 'react-icons/fa';

const ProfileLayout = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">My Account</h2>
            <nav className="flex flex-col gap-2">
              <NavLink 
                to="/profile" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                }
                end
              >
                <FaUser className="mr-2" />
                Profile Details
              </NavLink>
              <NavLink 
                to="/profile/edit" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                }
              >
                <FaEdit className="mr-2" />
                Edit Profile
              </NavLink>
              <NavLink 
                to="/profile/password" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                }
              >
                <FaKey className="mr-2" />
                Change Password
              </NavLink>
              <NavLink 
                to="/profile/email" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                }
              >
                <FaEnvelope className="mr-2" />
                Change Email
              </NavLink>
              <NavLink 
                to="/profile/addresses" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                }
              >
                <FaMapMarkerAlt className="mr-2" />
                Addresses
              </NavLink>
              <NavLink 
                to="/profile/orders" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
                }
              >
                <FaShoppingBag className="mr-2" />
                My Orders
              </NavLink>
            </nav>
          </div>
        </div>
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-lg shadow p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
