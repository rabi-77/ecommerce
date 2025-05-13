// const express=require("express")
import express from 'express'
const user=express.Router()
import {register,resend,verify,googleAuth,googleAuthCallback, userLogin, userLogout,refreshAccessToken, checkUserStatus} from '../controllers/userController.js'
import {validate} from '../middlewares/validate.js'
import passport from 'passport'
import { getProducts,getProductById,getRelatedProducts } from '../controllers/userProductController.js'
import { getBrands,getCategories } from '../controllers/brandCategory.js'
import { verifyToken } from '../middlewares/auth.js'


user.post('/register',register)
user.post('/login',userLogin)
user.post('/logout',userLogout)
// user.post('/register')
user.post('/register/verify-otp',verify)
user.post('/register/resend-otp',resend)

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

export default user