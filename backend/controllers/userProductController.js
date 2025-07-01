import productModel from "../models/productModel.js";
import { fetchActiveOffers, applyBestOffer } from '../services/offerService.js';

const getProducts = async (req, res) => {
    
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      priceMin,
      priceMax,
      sort,
      featured,
    } = req.query;

    // Find listed brands and categories
    const listedBrands = await (await import('../models/brandModel.js')).default.find({ isListed: true, isDeleted: false }).select('_id');
    const listedCategories = await (await import('../models/categoryModel.js')).default.find({ isListed: true, isDeleted: false }).select('_id');
    
    const listedBrandIds = listedBrands.map(brand => brand._id);
    const listedCategoryIds = listedCategories.map(category => category._id);

    let query = { 
      isListed: true,
      brand: { $in: listedBrandIds },
      category: { $in: listedCategoryIds }
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (brand) {
      query.brand = brand;
    }
    if (category) {
      query.category = category;
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = Number(priceMin);
      if (priceMax) query.price.$lte = Number(priceMax);
    }

    let sortOption = {};
    switch (sort) {
      case "price-low-to-high":
        sortOption.price = 1;
        break;
      case "price-high-to-low":
        sortOption.price = -1;
        break;
      case "a-z":
        sortOption.name = 1;
        break;
      case "z-a":
        sortOption.name = -1;
        break;
      case "new-arrivals":
        sortOption.createdAt = -1;
        break;
      case "featured":
        sortOption.isFeatured = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }

    const products = await productModel
      .find(query)
      .populate("category")
      .populate("brand")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()
      ;

    const total =await productModel.countDocuments(query);

    const now = new Date();
    const productIds = products.map(p => p._id);
    const categoryIds = products.map(p => p.category?._id).filter(Boolean);

    const offerMaps = await fetchActiveOffers(productIds, categoryIds);

    const transformedProducts = products.map(prod => {
      const { effectivePrice, appliedOffer } = applyBestOffer(prod, offerMaps);
      
      return {
        ...prod,
        effectivePrice,
        appliedOffer: appliedOffer ? {
          _id: appliedOffer._id,
          percentage: appliedOffer.percentage,
          amount: appliedOffer.amount,
          type: appliedOffer.type,
        } : null,
      };
    });

    
    res.status(200).json({
      products: transformedProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalProducts: total,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id)
      .populate("category")
      .populate("brand");

    if (!product || 
        product.isListed !== true || 
        !product.brand || 
        !product.category || 
        product.brand.isListed !== true || 
        product.category.isListed !== true) {
      return res
        .status(404)
        .json({ message: "Product not found or unavailable" });
    }
    
    res.status(200).json(product);
  } catch (err) {
    
    res.status(500).json({ message: "Server error" });
  }
}

const getRelatedProducts = async (req, res) => {
    try {
      const product = await productModel.findById(req.params.id);
      if (!product || !product.isListed) {
        return res.status(404).json({ message: "Product not found or unavailable" });
      }
      
      // Find listed brands and categories
      const listedBrands = await (await import('../models/brandModel.js')).default.find({ isListed: true, isDeleted: false }).select('_id');
      const listedCategories = await (await import('../models/categoryModel.js')).default.find({ isListed: true, isDeleted: false }).select('_id');
      
      const listedBrandIds = listedBrands.map(brand => brand._id.toString());
      const listedCategoryIds = listedCategories.map(category => category._id.toString());
  
      const relatedProducts = await productModel.find({
        category: product.category,
        _id: { $ne: product._id },
        isListed: true,
        // brand: { $in: listedBrandIds },
        // category: { $in: listedCategoryIds }
      })
        .populate("category", "name")
        .populate("brand", "name")
        .limit(4);
      
      res.status(200).json(relatedProducts);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  };

  export {getProducts,getProductById,getRelatedProducts}
