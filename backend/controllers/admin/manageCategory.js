import categoryModel from "../../models/categoryModel.js";
import { uploadImagesToCloudinary } from "../../utils/imageUpload.js";


// const storage = multer.memoryStorage();
// const uploadCategory = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const validImageTypes = ["image/jpeg", "image/png", "image/gif"]; // Allowed image MIME types
//     if (validImageTypes.includes(file.mimetype)) {
//       cb(null, true); // Accept the file
//     } else {
//       cb(new Error("Only image files are allowed (JPEG, PNG, GIF)"), false); // Reject the file
//     }
//   },
// }).single("image");

const getCategories = async (req, res) => {
  const { page = 1, search = "", size = 10 } = req.query;
  const query = {
    isDeleted: false,
    name: { $regex: search, $options: "i" },
  };

  try {
    const total = await categoryModel.countDocuments(query);
    const categories = await categoryModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(Number(size));
    res.json({ categories, total, page: Number(page), size: Number(size) });
  } catch (err) {
    res.status(500).json({ message: "something happened internally" });
  }
};


const addCategory = async (req, res) => {
  const { name, description } = req.body;
  const file = req.file;
  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Category name cannot be empty or contain only whitespace" });
    }
    
    const trimmedName = name.trim();
    
    if (!file) {
      return res
        .status(400)
        .json({ message: "An image is required for the category" });
    }

    const existingCategory = await categoryModel.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists (case-insensitive match)" });
    }

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Only image files are allowed (JPEG, PNG, GIF)" });
    }

    const imageUrl = await uploadImagesToCloudinary([file], "categories");
    const newCategory = new categoryModel({
      name: trimmedName,
      description: description ? description.trim() : '',
      imageUrl: imageUrl[0],
    });

    await newCategory.save();
    res
      .status(201)
      .json({
        message: "category created successfully",
        category: newCategory,
      });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

const editCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const file = req.file;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: "Category name cannot be empty or contain only whitespace" });
  }
  
  const trimmedName = name.trim();
  
  try {
    const checking = await categoryModel.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    if (checking && checking._id.toString() !== id) {
      return res
        .status(400)
        .json({ message: "Category with this name already exists (case-insensitive match)" });
    }

let imageUrl;
    if (file) {
      const uploadImage = await uploadImagesToCloudinary([file], "categories");
      imageUrl = uploadImage[0]; 
    }

    const editCategory = await categoryModel.findByIdAndUpdate(
      id,
      { 
        name: trimmedName, 
        description: description ? description.trim() : '',
        ...(imageUrl && { imageUrl })
      },
      { new: true }
    );
    
    if (!editCategory) {
      return res
        .status(500)
        .json({ message: "category with this id doesnt exist" });
    }

    res.json({ message: "category updated successfully",category:editCategory });
  } catch (err) {
    
    res.status(500).json({ message: "some internal server error" });
  }
};


const softDeleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    const category = await categoryModel.findOne({_id:id});
    if (!category) {
        
      return res
        .status(404)
        .json({ message: "this category doesnt exist no more" });
    }
    const softDelete = await categoryModel.findByIdAndDelete(
      id,
     
    );
    if (!softDelete) {
      return res.status(500).json({ message: "couldnt found this category" });
    }
    res.json({ message: "category deleted successfully",deletedId:softDelete._id });
    
  } catch (err) {
    
    res
      .status(500)
      .json({ message: "some internal error while deleting the category" });
  }
};

const toggleCategoryListing = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryModel.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    category.isListed = !category.isListed;
    await category.save();
    
    res.json({ 
      message: `Category ${category.isListed ? 'listed' : 'unlisted'} successfully`, 
      category 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export { getCategories, editCategory, addCategory, softDeleteCategory, toggleCategoryListing };
