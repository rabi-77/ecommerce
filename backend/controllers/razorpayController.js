import Order from "../models/orderModel.js";
import razorpay from "../config/razorpay.js";
import asyncHandler from "express-async-handler";
import crypto from "crypto";
import Cart from "../models/cartModel.js";
import Coupon from "../models/couponModel.js";

export const createRazorpayOrder = asyncHandler(async (req, res) => {
    try {
        const { amount, receipt, orderId } = req.body;
        
        
        if (!amount || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Amount and orderId are required'
            });
        }

        // Ensure amount is a valid number
        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount provided'
            });
        }

        const convertToPaise = Math.round(amountNum * 100); // Convert to paise and ensure it's a whole number
        
        if (convertToPaise < 100) { // Minimum amount in paise (1 INR)
            return res.status(400).json({
                success: false,
                message: 'Amount must be at least 1 INR'
            });
        }
        
        const options = {
            amount: convertToPaise,
            currency: 'INR',
            receipt: receipt || `order_${Date.now()}`,
            payment_capture: 1
        };

        
        const order = await razorpay.orders.create(options);
        
        await Order.findByIdAndUpdate(orderId, {
            paymentResult:{
                razorpayOrderId: order.id,
                razorpayPaymentId: order.id,
                razorpaySignature: order.id,
            }
        });

        res.status(201).json({
            success: true,
            order: order
        });
        
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        console.error('Error details:', {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error || 'No error details',
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to create Razorpay order',
            error: error.message || 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
    
})

export const verifyPayment = asyncHandler(async (req,res)=>{
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body
    const generateSignature=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id+"|"+razorpay_payment_id)
    .digest('hex')

    if(generateSignature!==razorpay_signature){
        res.status(400).json({message:'Invslid payment signature',success:false})
    }

    const order= await Order.findOne({"paymentResult.razorpayOrderId":razorpay_order_id})
    if(!order){
        res.status(404).json({message:'Order not found',success:false})
    }

    order.isPaid=true
    order.paidAt=Date.now()
    order.status='pending'
    order.paymentResult={
        id:razorpay_payment_id,
        status:'succeeded',
        update_time:Date.now(),
        email_address:order.user.email,
        razorpayOrderId:razorpay_order_id,
        razorpayPaymentId:razorpay_payment_id,
        razorpaySignature:razorpay_signature
    }
    await order.save()
    let appliedCoupon=order.coupon
    let userId= req.user
    await Cart.findOneAndUpdate(
        { user: userId },
        {
          $set: {
            items: [],
            coupon: null,
            discount: 0,
            total: 0,
          },
        }
      );
    
      if (appliedCoupon) {
        try {
          await Coupon.findByIdAndUpdate(appliedCoupon, { $inc: { usedCount: 1 } });
          await Coupon.findByIdAndUpdate(appliedCoupon, { $push: { usedBy: userId } });
        } catch (err) {
          console.error("Failed to increment coupon usedCount", err);
        }
      } 
    
    res.status(200).json({success:true,message:'Payment verified successfully'})
})


export const getRazorpayKey = asyncHandler(async (req,res)=>{
    res.status(200).json({success:true,key:process.env.RAZORPAY_KEY_ID})
})

