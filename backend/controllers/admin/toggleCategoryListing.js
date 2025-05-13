import categoryModel from "../../models/categoryModel.js";

const toggleCategoryListing = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await categoryModel.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Toggle the isListed status
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

export default toggleCategoryListing;
