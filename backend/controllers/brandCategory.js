import brandModel from "../models/brandModel.js";
import categoryModel from "../models/categoryModel.js";

const getBrands = async (req, res) => {
  try {
    const brands = await brandModel.find({ isDeleted: false, isListed: true });

    return res.status(200).json({ 
      message: brands.length === 0 ? "No brands available" : "Successfully fetched", 
      brands 
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({ isDeleted: false, isListed: true });
    
    return res.status(200).json({ 
      message: categories.length === 0 ? "No categories available" : "Success", 
      categories 
    });
  } catch (er) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export {getBrands, getCategories}
