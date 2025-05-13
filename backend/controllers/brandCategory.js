import brandModel from "../models/brandModel.js";
import categoryModel from "../models/categoryModel.js";

const getBrands = async (req, res) => {
  try {
    const brands = await brandModel.find({ isDeleted: false, isListed: true });

    if (brands.length === 0) {
      return res.status(400).json({ message: "no brands available" });
    }

    res.json({ message: "successfully fetched", brands });
  } catch (err) {
    return res.status(500).json({ message: "internal server error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({ isDeleted: false, isListed: true });
    if (categories && categories.length === 0) {
      return res.status(400).json({ message: "no categories available" });
    }

    res.json({ message: "success", categories });
  } catch (er) {
    res.status(500).json({ message: "internal server error" });
  }
};

export {getBrands,getCategories}


