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
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to generate SKU using the same method as in your codebase
const generateSKU = () => {
  return `SKU-${uuid().slice(0, 8)}`;
};

// Function to add a sample product
const addSampleProduct = async () => {
  try {
    // Find a category and brand to reference
    const runningCategory = await Category.findOne({ name: 'Running Shoes' });
    const nikeBrand = await Brand.findOne({ name: 'Nike' });
    
    if (!runningCategory || !nikeBrand) {
      console.error('Category or Brand not found. Please run seedCategoriesBrands.js first.');
      process.exit(1);
    }
    
    console.log('Found category:', runningCategory.name);
    console.log('Found brand:', nikeBrand.name);
    
    // Create variants
    const variants = [];
    const sizes = ["6", "7", "8", "9", "10"];
    
    sizes.forEach(size => {
      const stockAmount = Math.floor(Math.random() * 10) + 5; // Random stock between 5-15
      variants.push({
        size,
        stock: stockAmount,
        sku: generateSKU() // Using your SKU generation method
      });
    });
    
    // Calculate total stock
    const totalStock = variants.reduce((total, variant) => total + variant.stock, 0);
    
    // Create the product
    const product = new Product({
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
      category: runningCategory._id,
      brand: nikeBrand._id,
      totalStock,
      variants
    });
    
    // Save the product
    await product.save();
    
    console.log('Sample product added successfully:');
    console.log('- Name:', product.name);
    console.log('- Category:', runningCategory.name);
    console.log('- Brand:', nikeBrand.name);
    console.log('- Variants:', product.variants.length);
    console.log('- Total Stock:', product.totalStock);
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample product:', error);
    process.exit(1);
  }
};

// Run the function
connectDB().then(() => {
  addSampleProduct();
});
