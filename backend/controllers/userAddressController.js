import userModel from "../models/userModel.js";

export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const addresses = user.addresses.map(address => {
      const addressObj = address.toObject();
      addressObj.isDefault = user.defaultAddressId && 
        user.defaultAddressId.toString() === address._id.toString();
      return addressObj;
    });
    
    res.json({ addresses: addresses || [] });
  } catch (err) {
    console.error("Error fetching addresses:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addAddress = async (req, res) => {
  try {
    const userId = req.user;
    const addressData = req.body;
    
    const requiredFields = ['name', 'phoneNumber', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.addresses) {
      user.addresses = [];
    }
    
    const shouldBeDefault = user.addresses.length === 0 || addressData.isDefault;
    
    // Remove isDefault from addressData since we're using defaultAddressId
    delete addressData.isDefault;
    
    user.addresses.push(addressData);
    
    if (shouldBeDefault) {
      const newAddressId = user.addresses[user.addresses.length - 1]._id;
      user.defaultAddressId = newAddressId;
    }
    
    await user.save();
    
    // Get the newly added address with virtual isDefault property
    const newAddress = user.addresses[user.addresses.length - 1].toObject();
    newAddress.isDefault = user.defaultAddressId && 
      user.defaultAddressId.toString() === newAddress._id.toString();
    
    res.status(201).json({ 
      message: "Address added successfully",
      address: newAddress
    });
  } catch (err) {
    console.error("Error adding address:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user;
    const addressId = req.params.addressId;
    const addressData = req.body;
    
    const requiredFields = ['name', 'phoneNumber', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }
    
    // Check if we need to set this address as default
    const shouldBeDefault = addressData.isDefault;
    
    delete addressData.isDefault;
    
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      ...addressData
    };
    
    if (shouldBeDefault) {
      user.defaultAddressId = user.addresses[addressIndex]._id;
    }
    
    await user.save();
    
    // Get the updated address with virtual isDefault property
    const updatedAddress = user.addresses[addressIndex].toObject();
    updatedAddress.isDefault = user.defaultAddressId && 
      user.defaultAddressId.toString() === updatedAddress._id.toString();
    
    res.json({ 
      message: "Address updated successfully",
      address: updatedAddress
    });
  } catch (err) {
    console.error("Error updating address:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user;
    const addressId = req.params.addressId;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }
    
    const wasDefault = user.defaultAddressId && 
      user.defaultAddressId.toString() === addressId;
    
    user.addresses.splice(addressIndex, 1);
    
    if (wasDefault && user.addresses.length > 0) {
      user.defaultAddressId = user.addresses[0]._id;
    } else if (wasDefault && user.addresses.length === 0) {
      user.defaultAddressId = null;
    }
    
    await user.save();
    
    res.json({ message: "Address deleted successfully",addressId });
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user;
    
    const addressId = req.params.addressId;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }
    
    user.defaultAddressId = user.addresses[addressIndex]._id;
    
    await user.save();
    
    const addresses = user.addresses.map(address => {
      const addressObj = address.toObject();
      addressObj.isDefault = user.defaultAddressId && 
        user.defaultAddressId.toString() === address._id.toString();
      return addressObj;
    });
    
    res.json({ 
      message: "Default address set successfully",
      addresses: addresses
    });
  } catch (err) {
    console.error("Error setting default address:", err);
    res.status(500).json({ message: "Server error" });
  }
};
