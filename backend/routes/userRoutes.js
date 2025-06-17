// const express=require("express")
import express from 'express'
const user=express.Router()
import {register,resend,verify,googleAuth,googleAuthCallback, userLogin, userLogout,refreshAccessToken, checkUserStatus, forgotPassword, resetPassword, resendPasswordResetOtp,} from '../controllers/userController.js'
import {validate} from '../middlewares/validate.js'
import passport from 'passport'
import { getProducts,getProductById,getRelatedProducts } from '../controllers/userProductController.js'
import { getBrands,getCategories } from '../controllers/brandCategory.js'
import { verifyToken } from '../middlewares/auth.js'
import {authenticateUser,userAuthorization} from '../middlewares/user/authenticateUser.js'
import {getUserinfo,editUserDetails} from '../controllers/userProfile.js'
import {uploadCategory} from '../middlewares/multerCheck.js'
import { getUserAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/userAddressController.js'
import {requestEmailChange, verifyEmailChange, changePassword} from '../controllers/userEmailController.js'
import { addToWishlist, removeFromWishlist, getWishlist, checkWishlistItem, clearWishlist } from '../controllers/userWishlistController.js'
import { addToCart, updateCartItem, removeFromCart, getCart, clearCart, applyCoupon, removeCoupon,validateCoupon } from '../controllers/userCartController.js'
import {validateAndApplyCoupon,removeCoupon as removecpn,getCouponDetails} from '../controllers/user/userCouponController.js'
import {createRazorpayOrder,verifyPayment,getRazorpayKey} from '../controllers/razorpayController.js'

user.post('/register',register)
user.post('/login',userLogin)
user.post('/logout',authenticateUser,userAuthorization,userLogout)

user.post('/refresh',refreshAccessToken)

// user.post('/register')
user.post('/register/verify-otp',verify)
user.post('/register/resend-otp',resend)

// Forgot Password Routes
user.post('/forgot-password', forgotPassword)
user.post('/reset-password', resetPassword)
user.post('/resend-password-reset-otp', resendPasswordResetOtp)

// Check if user is blocked
user.get('/check-status', verifyToken, checkUserStatus)

user.get('/google',googleAuth);
user.get("/google/callback",passport.authenticate("google",{session:false}),googleAuthCallback)


//product listing
user.get("/products", getProducts);
user.get("/products/:id", getProductById);
user.get("/products/:id/related", getRelatedProducts);


user.get("/categories", getCategories);
user.get("/brands", getBrands);


//user profile
user.get('/profile',(req,res,next)=>{
    console.log('reach lpleeSE');
    next()
},getUserinfo)
user.put('/profile',(req,res,next)=>{
    console.log('is it coming');
    next();
},uploadCategory,editUserDetails)

// Address management routes
user.get('/addresses', verifyToken, getUserAddresses)
user.post('/address', verifyToken, addAddress)
user.put('/address/:addressId', verifyToken, updateAddress)
user.delete('/address/:addressId', verifyToken, deleteAddress)
user.put('/address/:addressId/default', verifyToken, setDefaultAddress)

// Wishlist routes
user.get('/wishlist', verifyToken, getWishlist)
user.post('/wishlist', verifyToken, addToWishlist)
user.delete('/wishlist/:productId', verifyToken, removeFromWishlist)
user.get('/wishlist/check/:productId', verifyToken, checkWishlistItem)
user.delete('/wishlist', verifyToken, clearWishlist)

// Cart routes
user.get('/cart', verifyToken, getCart)
user.post('/cart', verifyToken, addToCart)
user.delete('/cart/clear', verifyToken, clearCart);

// Coupon routes
user.post('/coupons/validate', verifyToken, validateCoupon);
user.post('/cart/apply-coupon', verifyToken, applyCoupon);
user.delete('/cart/coupon', verifyToken, removeCoupon);
user.put('/cart/:cartItemId', verifyToken, updateCartItem)
user.delete('/cart/:cartItemId', verifyToken, removeFromCart)

//change password setup
user.post('/change-email-request',verifyToken,requestEmailChange)
user.get('/verify-email-change',verifyEmailChange)
user.put('/change-password',verifyToken,changePassword)


user.post('/create-order',verifyToken,createRazorpayOrder)
user.post('/verify-payment',verifyToken,verifyPayment)
user.get('/razorpay-key',verifyToken,getRazorpayKey)

export default user