import brandModel from "../../models/brandModel.js";
import { uploadImagesToCloudinary } from "../../utils/imageUpload.js";



const getBrands = async (req, res) => {
  console.log("hiiii");

  const { page = 1, search = "", size = 10 } = req.query;
  const query = {
    isDeleted: false,
    name: { $regex: search, $options: "i" },
  };

  try {
    console.log("koko");

    const total = await brandModel.countDocuments(query);
    console.log("here noo?");

    const brands = await brandModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(Number(size));
    console.log("here?");

    res.json({ brands, total, page: Number(page), size: Number(size) });
  } catch (err) {
    console.log(err.message);

    res.status(500).json({ message: "something happened internally" });
  }
};

//add brands

const addBrand = async (req, res) => {
  const { name, description } = req.body;
  console.log(req.body, "body is recieving");

  const file = req.file;
  console.log(file, "file has images");

  try {
    // Validate name is not empty and doesn't contain only whitespace
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Brand name cannot be empty or contain only whitespace" });
    }
    
    // Trim the name to remove any leading/trailing whitespace
    const trimmedName = name.trim();
    
    if (!file) {
      return res
        .status(400)
        .json({ message: "An image is required for the brand" });
    }

    // Check for existing brand with case-insensitive search
    const existingBrand = await brandModel.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    
    if (existingBrand) {
      console.log("existing???");
      return res.status(400).json({ message: "Brand already exists (case-insensitive match)" });
    }

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.mimetype)) {
      console.log("image existing???");

      return res
        .status(400)
        .json({ message: "Only image files are allowed (JPEG, PNG, GIF)" });
    }

    // Upload the image to Cloudinary
    console.log("huhuh");

    const imageUrl = await uploadImagesToCloudinary([file], "brands");
    console.log("huhuhffff");

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
    console.log(err.message, "hu?");

    res.status(500).json({ message: "server error" });
  }
};

//edit brand

const editBrand = async (req, res) => {
  console.log("koooi");

  const { id } = req.params;
  const { name, description } = req.body;
  const file = req.file;
  console.log(file, req.body, req.params);

  // Validate name is not empty and doesn't contain only whitespace
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: "Brand name cannot be empty or contain only whitespace" });
  }
  
  // Trim the name to remove any leading/trailing whitespace
  const trimmedName = name.trim();
  
  try {
    console.log("hi");

    // Check for existing brand with case-insensitive search
    const checking = await brandModel.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    console.log("hpi");

    if (checking && checking._id.toString() !== id) {
      return res
        .status(400)
        .json({ message: "Brand with this name already exists (case-insensitive match)" });
    }

    console.log("jop");
let imageUrl;
    if (file) {
      // Upload the new image to Cloudinary
      const uploadImage = await uploadImagesToCloudinary([file], "brands");
      imageUrl = uploadImage[0]; // Update the image URL
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
    console.log('ko');
    
    if (!editBrand) {
      return res
        .status(500)
        .json({ message: "brand with this id doesnt exist" });
    }

    res.json({ message: "brand updated successfully" ,brand:editBrand});
  } catch (err) {
    console.log(err.message);
    
    res.status(500).json({ message: "some internal server error" });
  }
};

//delete (soft delete )

const softDeleteBrand = async (req, res) => {
  const { id } = req.params;
  console.log(req.params);
  
  try {
    const brand = await brandModel.findOne({_id:id});
    if (!brand) {
        console.log('hey',brand);
        
      return res
        .status(404)
        .json({ message: "this brand doesnt exist no more" });
    }
    console.log('soft');
    const softDelete = await brandModel.findByIdAndDelete(
      id,
    );
    if (!softDelete) {
      return res.status(500).json({ message: "couldnt found this brand" });
    }
    res.json({ message: "brand deleted successfully",deletedId:softDelete._id });
    console.log('success',softDelete);
    
  } catch (err) {
    console.log(err.message);
    
    res
      .status(500)
      .json({ message: "some internal error while deleting the brand" });
  }
};

// Toggle brand listing status
const toggleBrandListing = async (req, res) => {
  const { brandId } = req.params;

  try {
    const brand = await brandModel.findById(brandId);
    
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    
    // Toggle the isListed status
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