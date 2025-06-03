import Order from "../models/orderModel";
import razorpay from "../config/razorpay";
import asyncHandler from "express-async-handler";

export const createRazorpayOrder = asyncHandler(async (req,res)=>{
    const {amount,reciept}= req.body

    const convertToPaise= amount*100

    const options={
        amount:convertToPaise,
        currency:"INR",
        reciept:reciept || `order_${GiDrawbridge.now()}`,
        payment_capture:1
    }

    const order = await razorpay.orders.create(options)
    res.status(201).json({success:true,order})
    
})