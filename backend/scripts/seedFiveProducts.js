import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Brand from '../models/brandModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to generate SKU using the same method as in your codebase
const generateSKU = () => {
  return `SKU-${uuid().slice(0, 8)}`;
};

// Function to create variants
const createVariants = () => {
  const variants = [];
  const sizes = ["6", "7", "8", "9", "10"];
  
  sizes.forEach(size => {
    const stockAmount = Math.floor(Math.random() * 10) + 5; // Random stock between 5-15
    variants.push({
      size,
      stock: stockAmount,
      sku: generateSKU()
    });
  });
  
  return variants;
};

// Function to add products
const addProducts = async () => {
  try {
    // Get all categories and brands
    const categories = await Category.find({});
    const brands = await Brand.find({});
    
    if (categories.length === 0 || brands.length === 0) {
      console.error('Categories or Brands not found. Please run seedCategoriesBrands.js first.');
      process.exit(1);
    }
    
    // Map for easy lookup
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category;
    });
    
    const brandMap = {};
    brands.forEach(brand => {
      brandMap[brand.name] = brand;
    });
    
    
    // Product data
    const productsToAdd = [
      {
        name: 'Air Zoom Pegasus 38',
        description: 'The Nike Air Zoom Pegasus 38 continues to put a spring in your step, using the same responsive foam as its predecessor while adding more comfort in the places you need it most.',
        price: 120,
        images: [
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1491553895911-0055eca6402d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        isListed: true,
        isFeatured: true,
        categoryName: 'Running Shoes',
        brandName: 'Nike'
      },
      {
        name: 'Ultraboost 22',
        description: 'Adidas Ultraboost 22 running shoes with responsive cushioning and a supportive fit for your daily runs.',
        price: 180,
        images: [
          'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1608379743498-63cc1b41c94a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        isListed: true,
        isFeatured: true,
        categoryName: 'Running Shoes',
        brandName: 'Adidas'
      },
      {
        name: 'Classic Leather',
        description: 'Reebok Classic Leather shoes with a timeless design and premium materials for everyday style.',
        price: 80,
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        isListed: true,
        isFeatured: false,
        categoryName: 'Casual Shoes',
        brandName: 'Reebok'
      },
      {
        name: 'Oxford Dress Shoes',
        description: 'Classic Oxford dress shoes with premium leather and traditional craftsmanship for formal occasions.',
        price: 150,
        images: [
          'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1531310197839-ccf54634509e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        isListed: true,
        isFeatured: false,
        categoryName: 'Formal Shoes',
        brandName: 'Puma'
      },
      {
        name: 'Basketball High Tops',
        description: 'High-performance basketball shoes with ankle support and responsive cushioning for the court.',
        price: 130,
        images: [
          'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1605348532760-6753d2c43329?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1562183241-b937e95585b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
        ],
        isListed: true,
        isFeatured: true,
        categoryName: 'Sports Shoes',
        brandName: 'Nike'
      }
    ];
    
    // Add products one by one
    const addedProducts = [];
    
    for (const productData of productsToAdd) {
      const category = categoryMap[productData.categoryName];
      const brand = brandMap[productData.brandName];
      
      if (!category) {
        console.warn(`Category "${productData.categoryName}" not found, skipping product ${productData.name}`);
        continue;
      }
      
      if (!brand) {
        console.warn(`Brand "${productData.brandName}" not found, skipping product ${productData.name}`);
        continue;
      }
      
      const variants = createVariants();
      const totalStock = variants.reduce((total, variant) => total + variant.stock, 0);
      
      const product = new Product({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        images: productData.images,
        isListed: productData.isListed,
        isFeatured: productData.isFeatured,
        category: category._id,
        brand: brand._id,
        totalStock,
        variants
      });
      
      await product.save();
      addedProducts.push({
        name: product.name,
        category: productData.categoryName,
        brand: productData.brandName
      });
      
    }
    
    addedProducts.forEach((product, index) => {
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding products:', error);
    process.exit(1);
  }
};

// Run the function
connectDB().then(() => {
  addProducts();
});
