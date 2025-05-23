import userModel from "../models/userModel.js";
import { uploadImagesToCloudinary } from "../utils/imageUpload.js";

export const getUserinfo = async (req, res) => {
  const { id } = req.query;
  console.log(id, "back");

  //const {id}= req.user
  try {
    const user = await userModel.findById(id).select("-password -otp");
    if (!user) {
      return res
        .status(404)
        .json({ message: "user not found, this user doesnt exist" });
    }
    
    // Find the default address if defaultAddressId exists
    let defaultAddress = null;
    if (user.defaultAddressId && user.addresses && user.addresses.length > 0) {
      // Find the complete address object that matches the defaultAddressId
      defaultAddress = user.addresses.find(
        addr => addr._id.toString() === user.defaultAddressId.toString()
      );
      
      // Convert to plain object and add isDefault flag
      if (defaultAddress) {
        defaultAddress = defaultAddress.toObject();
        defaultAddress.isDefault = true;
      }
    }
    
    // Convert user to plain object and add defaultAddress
    const userResponse = user.toObject();
    userResponse.defaultAddress = defaultAddress;
    
    console.log("success");

    res.json({ user: userResponse });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "internal server error" + err.message });
  }
};

export const editUserDetails = async (req, res) => {
  console.log(req.body);
  try {
    const { name, phone, email, existingImage } = req.body;
    const file = req.file;
    if (!name) {
      return res.status(400).json({ message: "username is required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "this user doesnt exist" });
    }
    
    // Handle image upload or use existing image
    if (file) {
      // If a new file is uploaded, process it through Cloudinary
      const imageUrl = await uploadImagesToCloudinary([file], "userprofile");
      user.image = imageUrl[0];
    } else if (existingImage) {
      // If no new file but existingImage is provided, keep using the existing image
      user.image = existingImage;
    }
    
    // Update other user details
    user.username = name;
    if (phone) {
      user.phone = phone;
    }

    await user.save();
    res.json({user})
  } catch (err) {
    console.log(err.message,'profile error');
    res.status(500).json({ message: "internal server error" + err.message });
  }
};
