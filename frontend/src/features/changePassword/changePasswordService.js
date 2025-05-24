import api from '../../apis/user/api';

// Change password service
export const changePasswordRequest = async (passwordData) => {
  try {
    const response = await api.put('/change-password', passwordData);
    return response.data;
  } catch (error) {
    // If there's a field-specific error, include it in the thrown error
    if (error.response?.data?.field) {
      throw {
        message: error.response.data.message || 'Failed to change password',
        field: error.response.data.field
      };
    }
    
    throw new Error(
      error.response?.data?.message || 'Failed to change password'
    );
  }
};
