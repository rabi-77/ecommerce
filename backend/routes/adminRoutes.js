import express from "express";
import {
  adminLogin,
  adminLogout,
  refreshAccessToken,
} from "../controllers/admin/adminAuth.js";
import {
  getCategories,
  addCategory,
  editCategory,
  softDeleteCategory,
} from "../controllers/admin/manageCategory.js";
import { uploadCategory } from "../middlewares/multerCheck.js";
import {uploadProduct} from '../middlewares/multerCheckmultiple.js'
import {
  getBrands,
  addBrand,
  editBrand,
  softDeleteBrand,
} from "../controllers/admin/mangeBrands.js";
import { addProduct, editProduct, getProducts, softDelete, toggleFeatured, toggleList,fetchBrands,fetchCategories } from "../controllers/admin/mangeProducts.js";
import { getUsers, blockUser, unblockUser, toggleUserBlock } from "../controllers/admin/manageUsers.js";

const admin = express.Router();

//authentication
admin.post("/login", adminLogin);
admin.post("/logout", adminLogout);
admin.post('/refresh',refreshAccessToken)
//category management
admin.get("/categories", getCategories);

admin.post("/add-category", uploadCategory, addCategory);

admin.patch(
  "/edit-category/:id",
  async (req, res, next) => {
    console.log("reaching here");
    next();
  },
  uploadCategory,
  editCategory
);
admin.delete("/delete-category/:id", softDeleteCategory);
admin.patch("/toggle-category-listing/:categoryId", (await import("../controllers/admin/toggleCategoryListing.js")).default);

//brandmanagement

admin.get("/brands", getBrands);
admin.post("/add-brand", uploadCategory, addBrand);
admin.patch("/edit-brand/:id", uploadCategory, editBrand);
admin.delete("/delete-brand/:id", softDeleteBrand);
admin.patch("/toggle-brand-listing/:brandId", (await import("../controllers/admin/toggleBrandListing.js")).default);

//product management
admin.get('/products',getProducts)
admin.post('/add-product',(req,res,next)=>{
  console.log('heyyyy file:',req.header,'and files:',req.headers,'fff',req.body);
  next()
},uploadProduct,(req,res,next)=>{
  console.log(req.body,'and' ,req.files,'signle file',req.file);
  next();
},addProduct)

admin.put('/edit-product/:id',uploadProduct,editProduct)
admin.delete('/delete-product/:id',softDelete)

admin.patch('/products/:id/list-product',(req,res,next)=>{
  console.log('reaching or qhat');
  next()
},toggleList)
admin.patch('/products/:id/feature-product',toggleFeatured)

admin.get('/get-brands',fetchBrands)
admin.get('/get-categories',fetchCategories)

// User management
admin.get('/users', getUsers)
admin.patch('/block-user/:id', blockUser)
admin.patch('/unblock-user/:id', unblockUser)
admin.patch('/toggle-user-block/:id', toggleUserBlock)

export default admin;
