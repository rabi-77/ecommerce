import Order from "../../models/orderModel";
import asyncHandler from 'express-async-handler'

const getAllOrders= asyncHandler( async (req,res)=>{
  const orders=await Order.find() 
})