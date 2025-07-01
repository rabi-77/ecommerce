import userModel from "../models/userModel.js";
import { uploadImagesToCloudinary } from "../utils/imageUpload.js";

export const getUserinfo = async (req, res) => {
  const { id } = req.query;
  //const {id}= req.user
  try {
    const user = await userModel.findById(id).select("-password -otp");
    if (!user) {
      return res
        .status(404)
        .json({ message: "user not found, this user doesnt exist" });
    }
    
    let defaultAddress = null;
    if (user.defaultAddressId && user.addresses && user.addresses.length > 0) {
      defaultAddress = user.addresses.find(
        addr => addr._id.toString() === user.defaultAddressId.toString()
      );
      
      if (defaultAddress) {
        defaultAddress = defaultAddress.toObject();
        defaultAddress.isDefault = true;
      }
    }
    
    const userResponse = user.toObject();
    userResponse.defaultAddress = defaultAddress;
    
    res.json({ user: userResponse });
  } catch (err) {
    res.status(500).json({ message: "internal server error" + err.message });
  }
};

export const editUserDetails = async (req, res) => {
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
    
    if (file) {
      const imageUrl = await uploadImagesToCloudinary([file], "userprofile");
      user.image = imageUrl[0];
    } else if (existingImage) {
      user.image = existingImage;
    }
    
    user.username = name;
    if (phone) {
      user.phone = phone;
    }

    await user.save();
    res.json({user})
  } catch (err) {
    res.status(500).json({ message: "internal server error" + err.message });
  }
};
