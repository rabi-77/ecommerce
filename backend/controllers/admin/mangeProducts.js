// import { json } from "express";
import productModel from "../../models/productModel.js";
import brandModel from "../../models/brandModel.js";
import categoryModel from "../../models/categoryModel.js";

import { uploadImagesToCloudinary } from "../../utils/imageUpload.js";
import { v4 as uuid } from "uuid";

const getProducts = async (req, res) => {
  const { size = 10, page = 1, search = "" } = req.query;

  const query = {
    
    name: { $regex: search, $options: "i" },
  };
  try {
    const total = await productModel.countDocuments(query);
    const products = await productModel
      .find(query)
      .populate("category", "name")
      .populate("brand", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(size);
        
    res.json({ total, products, page: Number(page), size: Number(size) });
  } catch (err) {
    res.status(500).json({ message: "internal server error" });
  }
};

const addProduct = async (req, res) => {
  const { name, price, images, description, brand, category, variants } =
    req.body;
  const files = req.files;
  if (!files || files.length < 3) {
    return res.status(400).json({ message: "Minimum 3 images required" });
  }
  
  if (files.length > 5) {
    return res.status(400).json({ message: "Maximum 5 images allowed" });
  }
  const parsedVariants = JSON.parse(variants || "[]");
  if (parsedVariants.length === 0) {
    return res.status(400).json({ message: "At least one variant required" });
  }

  // if (count === undefined || isNaN(count) || count < 0) {
  //     return res.status(400).json({ message: "Count must be a non-negative number" });
  // }

  try {
    const existProduct = await productModel.findOne({ name });

    if (existProduct) {
      return res.status(400).json({ message: "product already exist" });
    }

    const imageUrls = await uploadImagesToCloudinary(files, "products");

    const variantsSet = parsedVariants.map((item) => ({
      size: item.size,
      stock: item.stock,
      sku: `SKU-${uuid().slice(0, 8)}`,
    }));
    const totalStock = parsedVariants.reduce((acc,curr) => {
     return Number(curr.stock) + acc;
    }, 0);
    
    const newProduct = new productModel({
      name,
      price,
      description,
      brand,
      category,
      // era: era || null,
      totalStock,
      variants: variantsSet,
      images: imageUrls,
    });

    await newProduct.save();
    res.status(201).json({message:'successfully added',product:newProduct})
  } catch (err) {

    res.status(500).json({ message: "some internal server error ishappening" });
  }
};

const editProduct = async (req, res) => {
  const { id } = req.params;
  
  const {
    name,
    price,
    description,
    brand,
    category,
    // era,
    // totalStock,
    variants,
    existImgs = [],
  } = req.body;
  const files = req.files;

  try {
    const product = await productModel.findById(id);
    if (!product) {
      
      return res.status(404).json({ message: "Product not found" });
    }

    if (name !== product.name) {
      const existingProduct = await productModel.findOne({ name });
      if (existingProduct) {
        return res.status(409).json({ message: "Product with this name already exists" });
      }
    }

    // if (totalStock === undefined || isNaN(totalStock) || totalStock < 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "Count must be a non-negative number" });
    // }

    const parsedVariants = JSON.parse(variants || []);
    if (parsedVariants.length === 0) {
      return res.status(400).json({ message: "atleast one variant is needed" });
    }
    const variantsSet = parsedVariants.map((item) => ({
      size: item.size,
      stock: item.stock,
      sku: `SKU-${uuid().slice(0, 8)}`,
    }));

    const calculateTotalStock= variantsSet.reduce((acc,curr)=>curr.stock+acc,0)

    // const updatedImages = product.images.filter((img) =>
    //   existImgs.includes(img)
    // );

    let updatedImages= product.images.filter((img)=>{
      return existImgs.includes(img)
    })

    if (files?.length) {
      const newImages = await uploadImagesToCloudinary(files, "products");
      updatedImages = [...newImages, ...updatedImages];
    }

    if (updatedImages.length < 3) {
      return res.status(400).json({ message: "Minimum three images required" });
    }
    
    if (updatedImages.length > 5) {
      return res.status(400).json({ message: "Maximum 5 images allowed" });
    }

    product.images = updatedImages;
    product.name = name;
    product.brand = brand;
    product.category = category;
    product.price = price;
    product.description = description;
    product.totalStock = calculateTotalStock;
    // product.era = era;
    product.variants = variantsSet;
    await product.save();

    res.json({ message: "success", product });
  } catch (err) {
    
    res.status(500).json({ message: "some internal error" });
  }
};

const softDelete = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await productModel.findByIdAndDelete(id);
    if (!product) {
      res.status(404).json({ message: "coudnt find this product" });
    }
    res.json({ message: "successfully deleted" });
  } catch (er) {
    res.status(500).json({ message: "some internal error" });
  }
};

const toggleList = async (req, res) => {
  
  
  const { id } = req.params;
  
  try {
    const product = await productModel.findById(id);
    if (!product) {
      
      return res.status(404).json({ message: "Could not find this product" });
    }

    product.isListed = !product.isListed;
    await product.save();

    res.json({
      message: `Product ${
        product.isListed ? "listed" : "unlisted"
      } successfully`,
      product,
      isListed:product.isListed
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const toggleFeatured = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Could not find this product" });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json({
      message: `Product ${
        product.isFeatured ? "featured" : "unfeatured"
      } successfully`,
      product,
      isFeatured:product.isFeatured
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const fetchBrands = async (req, res) => {
  try {
    const brand = await brandModel.find();
    if (brand.length === 0) {
    return  res.status(400).json({ message: "there is no brands " });
    }
    res.json({ brands: brand });
  } catch (err) {
   return res.status(500).json({ message: "failed" });
  }
};

const fetchCategories = async (req, res) => {
  try {
    const category = await categoryModel.find();
    if (category.length === 0) {
      res.status(400).json({ message: "there is no categories available " });
    }
    res.json({ categories: category });
  } catch (err) {
    res.status(500).json({ message: "failed" });
  }
};

export {
  fetchBrands,
  fetchCategories,
  getProducts,
  addProduct,
  editProduct,
  softDelete,
  toggleList,
  toggleFeatured,
};
