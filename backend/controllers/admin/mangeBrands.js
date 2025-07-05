import brandModel from "../../models/brandModel.js";
import { uploadImagesToCloudinary } from "../../utils/imageUpload.js";



const getBrands = async (req, res) => {
  const { page = 1, search = "", size = 10 } = req.query;
  const query = {
    isDeleted: false,
    name: { $regex: search, $options: "i" },
  };

  try {
    const total = await brandModel.countDocuments(query);
    const brands = await brandModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(Number(size));
    res.json({ brands, total, page: Number(page), size: Number(size) });
  } catch (err) {
    res.status(500).json({ message: "something happened internally" });
  }
};


const addBrand = async (req, res) => {
  const { name, description } = req.body;
  const file = req.file;
  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Brand name cannot be empty or contain only whitespace" });
    }
    
    const trimmedName = name.trim();
    
    if (!file) {
      return res
        .status(400)
        .json({ message: "An image is required for the brand" });
    }

    const existingBrand = await brandModel.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    
    if (existingBrand) {
      return res.status(400).json({ message: "Brand already exists (case-insensitive match)" });
    }

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Only image files are allowed (JPEG, PNG, GIF)" });
    }

    const imageUrl = await uploadImagesToCloudinary([file], "brands");
    const newBrand = new brandModel({
      name: trimmedName,
      description: description ? description.trim() : '',
      imageUrl: imageUrl[0],
    });

    await newBrand.save();
    res
      .status(201)
      .json({
        message: "brand created successfully",
        brand: newBrand,
      });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};


const editBrand = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const file = req.file;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: "Brand name cannot be empty or contain only whitespace" });
  }
  
  const trimmedName = name.trim();
  
  try {
    const checking = await brandModel.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    if (checking && checking._id.toString() !== id) {
      return res
        .status(400)
        .json({ message: "Brand with this name already exists (case-insensitive match)" });
    }

let imageUrl;
    if (file) {
      const uploadImage = await uploadImagesToCloudinary([file], "brands");
      imageUrl = uploadImage[0]; 
    }

    const editBrand = await brandModel.findByIdAndUpdate(
      id,
      { 
        name: trimmedName, 
        description: description ? description.trim() : '',
        ...(imageUrl && { imageUrl })
      },
      { new: true }
    );
    
    if (!editBrand) {
      return res
        .status(500)
        .json({ message: "brand with this id doesnt exist" });
    }

    res.json({ message: "brand updated successfully" ,brand:editBrand});
  } catch (err) {
    
    res.status(500).json({ message: "some internal server error" });
  }
};


const softDeleteBrand = async (req, res) => {
  const { id } = req.params;
  
  try {
    const brand = await brandModel.findOne({_id:id});
    if (!brand) {
        
      return res
        .status(404)
        .json({ message: "this brand doesnt exist no more" });
    }
    const softDelete = await brandModel.findByIdAndDelete(
      id,
    );
    if (!softDelete) {
      return res.status(500).json({ message: "couldnt found this brand" });
    }
    res.json({ message: "brand deleted successfully",deletedId:softDelete._id });
    
  } catch (err) {
    
    res
      .status(500)
      .json({ message: "some internal error while deleting the brand" });
  }
};

const toggleBrandListing = async (req, res) => {
  const { brandId } = req.params;

  try {
    const brand = await brandModel.findById(brandId);
    
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    
    brand.isListed = !brand.isListed;
    await brand.save();
    
    res.json({ 
      message: `Brand ${brand.isListed ? 'listed' : 'unlisted'} successfully`, 
      brand 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export {getBrands,addBrand,editBrand,softDeleteBrand,toggleBrandListing}