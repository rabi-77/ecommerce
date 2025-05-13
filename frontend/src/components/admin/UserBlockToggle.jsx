import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserBlockToggle = ({ user, onToggleSuccess }) => {
  const handleToggleBlock = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(
        `http://localhost:5000/admin/toggle-user-block/${user._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        toast.success(response.data.message);
        if (onToggleSuccess) {
          onToggleSuccess(response.data.user);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle user block status');
      console.error(error);
    }
  };

  return (
    <button
      onClick={handleToggleBlock}
      className={`px-3 py-1 rounded text-sm font-medium ${
        !user.isBlocked
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-red-100 text-red-800 hover:bg-red-200'
      }`}
    >
      {!user.isBlocked ? 'Active' : 'Blocked'}
    </button>
  );
};

export default UserBlockToggle;
