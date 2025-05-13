import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CategoryListingToggle = ({ category, onToggleSuccess }) => {
  const handleToggleListing = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(
        `http://localhost:5000/admin/toggle-category-listing/${category._id}`,
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
          onToggleSuccess(response.data.category);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle category listing');
      console.error(error);
    }
  };

  return (
    <button
      onClick={handleToggleListing}
      className={`px-3 py-1 rounded text-sm font-medium ${
        category.isListed
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-red-100 text-red-800 hover:bg-red-200'
      }`}
    >
      {category.isListed ? 'Listed' : 'Unlisted'}
    </button>
  );
};

export default CategoryListingToggle;
