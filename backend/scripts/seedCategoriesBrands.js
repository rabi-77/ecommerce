import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import Brand from '../models/brandModel.js';
import Category from '../models/categoryModel.js';

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

// Sample data for shoe shop
const categories = [
  {
    name: 'Running Shoes',
    description: 'Lightweight shoes designed for running and jogging',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'Casual Shoes',
    description: 'Comfortable shoes for everyday wear',
    imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'Sports Shoes',
    description: 'Specialized shoes for various sports activities',
    imageUrl: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'Formal Shoes',
    description: 'Elegant shoes for formal occasions',
    imageUrl: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  }
];

const brands = [
  {
    name: 'Nike',
    description: 'Global sports footwear and apparel manufacturer',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'Adidas',
    description: 'German athletic shoes and sportswear company',
    imageUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'Puma',
    description: 'German athletic and casual footwear manufacturer',
    imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'Reebok',
    description: 'Fitness and lifestyle footwear brand',
    imageUrl: 'https://images.unsplash.com/photo-1622040806062-07e726d7dfd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'New Balance',
    description: 'American sports footwear manufacturer',
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  },
  {
    name: 'Converse',
    description: 'Iconic casual canvas shoes',
    imageUrl: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    isListed: true,
    isDeleted: false
  }
];

// Function to seed categories and brands
const seedCategoriesAndBrands = async () => {
  try {
    // Clear existing data
    await Brand.deleteMany({});
    await Category.deleteMany({});
    
    console.log('Cleared existing categories and brands');
    
    // Insert categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Added ${createdCategories.length} categories:`);
    createdCategories.forEach(category => {
      console.log(`- ${category.name}`);
    });
    
    // Insert brands
    const createdBrands = await Brand.insertMany(brands);
    console.log(`Added ${createdBrands.length} brands:`);
    createdBrands.forEach(brand => {
      console.log(`- ${brand.name}`);
    });
    
    console.log('Categories and brands added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories and brands:', error);
    process.exit(1);
  }
};

// Run the seeding function
connectDB().then(() => {
  seedCategoriesAndBrands();
});
