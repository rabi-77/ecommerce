import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { fetchUserProfile } from '../../../features/userprofile/profileSlice';
import { addAddressThunk, deleteAddressThunk, getAllAddressesThunk, updateAddressThunk, setDefaultAddressThunk } from '../../../features/userAddress/addressSlice';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import Input from '../../../components/common/Input';
import Checkbox from '../../../components/common/Checkbox';

const Addresses = () => {
  const dispatch = useDispatch();
  const { profileData } = useSelector(state => state.profile);
  const { user } = useSelector(state => state.auth);
  const { addresses, addressSuccess, addressError, addressLoading } = useSelector(state => state.address);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [addressForm, setAddressForm] = useState({
    name: '',
    phoneNumber: '',
    alternativePhoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });
  
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    dispatch(getAllAddressesThunk());
    
    if (!profileData) {
      dispatch(fetchUserProfile(user._id));
    }
  }, [dispatch, profileData,user._id]);
  
  useEffect(() => {
    if (profileData) {
      resetForm();
    }
  }, [profileData]);
  
  useEffect(() => {
    if (addressError) {
      toast.error(addressError);
    }
  }, [addressError]);
  
  const resetForm = () => {
    setAddressForm({
      name: profileData?.username ||'',
      phoneNumber:profileData?.phone || '',
      alternativePhoneNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false
    });
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (name === 'postalCode' && value.length === 6) {
      fetchPincodeDetails(value);
    }
  };
  
  const fetchPincodeDetails = async (pincode) => {
    try {
      setPincodeLoading(true);
      setPincodeError(null);
      
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setAddressForm(prev => ({
          ...prev,
          city: postOffice.Block || postOffice.District || '',
          state: postOffice.State || ''
        }));
        
        toast.success('Address details auto-filled based on pincode');
      } else {
        setPincodeError('Invalid pincode or no data available');
        toast.error('Invalid pincode or no data available');
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error);
      setPincodeError('Failed to fetch pincode details');
      toast.error('Failed to fetch pincode details');
    } finally {
      setPincodeLoading(false);
    }
  };
  
  const handleAddAddress = () => {
    setIsAddingAddress(true);
    setEditingAddressId(null);
    resetForm();
  };
  
  const handleEditAddress = (address) => {
    setIsAddingAddress(true);
    setEditingAddressId(address._id);
    setAddressForm({
      name: address.name || '',
      phoneNumber: address.phoneNumber || '',
      alternativePhoneNumber: address.alternativePhoneNumber || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
      isDefault: address.isDefault || false
    });
  };
  
  const handleCancelEdit = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    resetForm();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const requiredFields = ['name', 'phoneNumber', 'addressLine1', 'city', 'state', 'postalCode'];
      for (const field of requiredFields) {
        if (!addressForm[field]) {
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          setFormLoading(false);
          return;
        }
      }

      const phonePattern = /^(?:\+91[-\s]?)?[6-9]\d{9}$/;
      if (!phonePattern.test(addressForm.phoneNumber)) {
        toast.error('Please enter a valid 10-digit Indian mobile number');
        setFormLoading(false);
        return;
      }
      if (addressForm.alternativePhoneNumber && !phonePattern.test(addressForm.alternativePhoneNumber)) {
        toast.error('Please enter a valid alternative Indian mobile number');
        setFormLoading(false);
        return;
      }
      
      if (editingAddressId) {
        await dispatch(updateAddressThunk({
          addressId: editingAddressId,
          address: addressForm
        })).unwrap();
        toast.success('Address updated successfully');
      } else {
        await dispatch(addAddressThunk(addressForm)).unwrap();
        toast.success('Address added successfully');
      }
      
      dispatch(getAllAddressesThunk());
      
      setIsAddingAddress(false);
      setEditingAddressId(null);
      resetForm();
      
    } catch (err) {
//handling in useefect
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteAddress = (addressId) => {
    setDeleteId(addressId);
  };

  const confirmDeleteAddress = async () => {
    if (deleteId) {
      try {
        await dispatch(deleteAddressThunk(deleteId)).unwrap();
        toast.success('Address deleted successfully');
        dispatch(getAllAddressesThunk());
      } catch (err) {}
      setDeleteId(null);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      
      await dispatch(setDefaultAddressThunk(addressId)).unwrap();
      
      toast.success('Default address updated');
      
      dispatch(getAllAddressesThunk());
    } catch (err) {
      toast.error('Default address updated');

    }
  };
  
  if (addressLoading && !addresses.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Addresses</h2>
        {!isAddingAddress && (
          <button
            onClick={handleAddAddress}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <FaPlus className="mr-2" />
            Add New Address
          </button>
        )}
      </div>
      
      {isAddingAddress ? (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingAddressId ? 'Edit Address' : 'Add New Address'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name*
                </label>
                <Input
                  name="name"
                  value={addressForm.name}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number*
                </label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={addressForm.phoneNumber}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="alternativePhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Alternative Phone Number
                </label>
                <Input
                  type="tel"
                  name="alternativePhoneNumber"
                  value={addressForm.alternativePhoneNumber}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
              
              <div className="md:col-span-1">
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1*
                </label>
                <Input
                  name="addressLine1"
                  value={addressForm.addressLine1}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="md:col-span-1">
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <Input
                  name="addressLine2"
                  value={addressForm.addressLine2}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
              
              <div className="md:col-span-2 grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City*
                  </label>
                  <Input
                    name="city"
                    value={addressForm.city}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled based on pincode</p>
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province*
                  </label>
                  <Input
                    name="state"
                    value={addressForm.state}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code*
                  </label>
                  <div className="relative">
                    <Input
                      name="postalCode"
                      value={addressForm.postalCode}
                      onChange={handleChange}
                      className="w-full"
                      required
                    />
                    {pincodeLoading && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  {pincodeError && (
                    <p className="text-red-500 text-sm mt-1">{pincodeError}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country*
                </label>
                <Input
                  name="country"
                  value={addressForm.country}
                  onChange={handleChange}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Checkbox
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleChange}
                  label="Set as default address"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                disabled={formLoading}
              >
                {formLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      ) : addresses && addresses.length > 0 ? (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div 
              key={address._id} 
              className={`border rounded-md p-4 ${address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">
                    {address.name}
                    {address.isDefault && (
                      <span className="ml-2 text-sm text-blue-600 font-medium">
                        (Default)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.phoneNumber}
                    {address.alternativePhoneNumber && ` / ${address.alternativePhoneNumber}`}
                  </p>
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>
                
                <div className="flex space-x-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefaultAddress(address._id)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition"
                      title="Set as default"
                    >
                      <FaCheck />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition"
                    title="Edit address"
                  >
                    <FaEdit />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteAddress(address._id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition"
                    title="Delete address"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500 mb-4">You don't have any saved addresses yet.</p>
          <button
            onClick={handleAddAddress}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Your First Address
          </button>
        </div>
      )}
      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        confirmLabel="Delete"
        onConfirm={confirmDeleteAddress}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Addresses;
