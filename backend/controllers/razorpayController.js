import Order from "../models/orderModel";
import razorpay from "../config/razorpay";
import asyncHandler from "express-async-handler";

export const createRazorpayOrder = asyncHandler(async (req,res)=>{
    const {amount,reciept,orderId}= req.body

    const convertToPaise= amount*100

    const options={
        amount:convertToPaise,
        currency:"INR",
        reciept:reciept || `order_${Date.now()}`,
        payment_capture:1
    }

    const order = await razorpay.orders.create(options)


    await Order.findByIdAndUpdate(orderId,{
        razorpayOrderId:order.id,
        
    })
    res.status(201).json({success:true,order})
    
})

export const verifyPayment = asyncHandler(async (req,res)=>{
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body

    const generateSignature=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id+"|"+razorpay_payment_id)
    .digest('hex')

    if(generateSignature!==razorpay_signature){
        res.status(400).json({message:'Invslid payment signature',success:false})
    }

    const order= await Order.findOne({razorpayOrderId:razorpay_order_id})

    if(!order){
        res.json(404,{message:'Order not found',success:false})
    }

    order.isPaid=true
    order.paidAt=Date.now()
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
    res.status(200).json({success:true,message:'Payment verified successfully'})
})


export const getRazorpayKey = asyncHandler(async (req,res)=>{
    res.status(200).json({success:true,key:process.env.RAZORPAY_KEY_ID})
})

