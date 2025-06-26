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
  toggleCategoryListing
} from "../controllers/admin/manageCategory.js";
import { uploadCategory } from "../middlewares/multerCheck.js";
import {uploadProduct} from '../middlewares/multerCheckmultiple.js'
import {
  getBrands,
  addBrand,
  editBrand,
  softDeleteBrand,
  toggleBrandListing
} from "../controllers/admin/mangeBrands.js";
import { addProduct, editProduct, getProducts, softDelete, toggleFeatured, toggleList,fetchBrands,fetchCategories } from "../controllers/admin/mangeProducts.js";
import { getUsers, toggleUserBlock } from "../controllers/admin/manageUsers.js";
import { authenticateAdmin,checkAdminAuth } from "../middlewares/authenticateAdmin.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { adminLoginSchema, categorySchema, brandSchema, productSchema } from "../../shared/validation.js";
import { validate } from "../middlewares/validate.js";
import {getAllOrders, updateOrderStatus, verifyReturnRequest} from '../controllers/admin/manageOrders.js'
import { validateAdminStatusChange } from '../middlewares/orderValidation.js'
import { getInventory, updateInventory, getInventoryHistory, getLowStockProducts } from '../controllers/admin/manageInventory.js'
import { 
  createCoupon, 
  getAllCoupons, 
  getCouponById, 
  updateCoupon, 
  deleteCoupon, 
  toggleCouponStatus,
  validateCoupon
} from '../controllers/admin/manageCoupons.js'
import { couponValidationRules, validateCouponRules } from '../validations/couponValidation.js';
import { createOffer, getOffers, getOfferById, updateOffer, deleteOffer, toggleOfferActive } from '../controllers/admin/manageOffers.js'
import { getSalesReport } from '../controllers/admin/manageSalesReport.js'
import { getDashboardStats } from '../controllers/admin/dashboardController.js'

const admin = express.Router();

//authentication
admin.post("/login", validate(adminLoginSchema), adminLogin);
admin.post('/refresh', refreshAccessToken);

// Apply authenticateAdmin middleware to all routes below
admin.use(authenticateAdmin,checkAdminAuth);
admin.post("/logout", adminLogout);

//category management
admin.get("/categories", getCategories);

admin.post("/add-category", uploadCategory, validate(categorySchema), addCategory);

admin.patch(
  "/edit-category/:id",
  uploadCategory,
  validate(categorySchema),
  editCategory
);
admin.delete("/delete-category/:id", softDeleteCategory);
admin.patch("/toggle-category-listing/:categoryId", toggleCategoryListing);

//brandmanagement

admin.get("/brands", getBrands);
admin.post("/add-brand", uploadCategory, validate(brandSchema), addBrand);
admin.patch("/edit-brand/:id", uploadCategory, validate(brandSchema), editBrand);
admin.delete("/delete-brand/:id", softDeleteBrand);
admin.patch("/toggle-brand-listing/:brandId", toggleBrandListing);

//product management
admin.get('/products',getProducts)
admin.post('/add-product', uploadProduct, validate(productSchema), addProduct)

admin.put('/edit-product/:id', uploadProduct, validate(productSchema), editProduct)
admin.delete('/delete-product/:id',softDelete)

admin.patch('/products/:id/list-product', toggleList)
admin.patch('/products/:id/feature-product',toggleFeatured)

//for dropdowns
admin.get('/get-brands',fetchBrands)
admin.get('/get-categories',fetchCategories)

// User management
admin.get('/users', getUsers)

admin.patch('/toggle-user-block/:id', toggleUserBlock)



//order management
admin.get('/orders',getAllOrders)
admin.patch('/orders/:id/status', validateAdminStatusChange, updateOrderStatus)
admin.patch('/orders/:orderId/items/:itemId/verify-return', verifyReturnRequest)

//inventory management
admin.get('/inventory', getInventory)
admin.put('/inventory/:id', updateInventory)
admin.get('/inventory/:id/history', getInventoryHistory)
admin.get('/inventory/low-stock', getLowStockProducts)

// sales report
admin.get('/sales-report', getSalesReport)

// dashboard stats
admin.get('/dashboard-stats', getDashboardStats)

// Offer management
admin.get('/offers', getOffers)
admin.get('/offers/:id', getOfferById)
admin.post('/offers', createOffer)
admin.put('/offers/:id', updateOffer)
admin.delete('/offers/:id', deleteOffer)
admin.patch('/offers/:id/toggle', toggleOfferActive)

// Coupon Management
admin.get('/coupons', getAllCoupons);
admin.get('/coupons/:id', getCouponById);
admin.post('/coupons',(req,res,next)=>{console.log(req.body)
  console.log('fef')
  next()},couponValidationRules, createCoupon);
admin.put('/coupons/:id', couponValidationRules, updateCoupon);
admin.delete('/coupons/:id', deleteCoupon);
admin.patch('/coupons/:id/toggle', toggleCouponStatus);
admin.post('/coupons/validate', validate(validateCouponRules), validateCoupon);

export default admin;
