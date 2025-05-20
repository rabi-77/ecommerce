import React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { toggleUserBlockThunk } from '../../features/admin/adminUsers/userSlice';

const UserBlockToggle = ({ user, onToggleSuccess }) => {
  const dispatch = useDispatch();
  
  const handleToggleBlock = async () => {
    try {
      const resultAction = await dispatch(toggleUserBlockThunk(user._id));
      
      if (toggleUserBlockThunk.fulfilled.match(resultAction)) {
        toast.success(resultAction.payload.message);
        if (onToggleSuccess) {
          onToggleSuccess(resultAction.payload.user);
        }
      } else if (toggleUserBlockThunk.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to toggle user block status');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to toggle user block status');
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
