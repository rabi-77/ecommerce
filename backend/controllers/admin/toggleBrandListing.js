import brandModel from "../../models/brandModel.js";

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

export default toggleBrandListing;
