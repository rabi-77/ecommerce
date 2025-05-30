import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";

// Define valid status transitions for admin
export const adminStatusTransitions = {
  pending: ['processing', 'shipped', 'out for delivery', 'cancelled'],
  processing: ['shipped', 'out for delivery', 'cancelled'],
  shipped: ['out for delivery', 'delivered', 'cancelled'],
  'out for delivery': ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: []
};

// Define valid status transitions for users
export const userStatusTransitions = {
  pending: ['cancelled'],
  processing: ['cancelled'],
  shipped: ['cancelled'], // Users can cancel until delivery
  'out for delivery': ['cancelled'], // Users can cancel until delivery
  delivered: ['returned'],
  cancelled: [],
  returned: []
};

// Middleware to validate status transitions for admin
export const validateAdminStatusChange = asyncHandler(async (req, res, next) => {
  const { status: newStatus } = req.body;
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  if (!adminStatusTransitions[order.status].includes(newStatus)) {
    return res.status(400).json({
      message: `Invalid status transition: Cannot change status from "${order.status}" to "${newStatus}"`
    });
  }
  
  next();
});

// Middleware to validate status transitions for users
export const validateUserStatusChange = asyncHandler(async (req, res, next) => {
  const { status: newStatus } = req.body;
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  if (!userStatusTransitions[order.status].includes(newStatus)) {
    return res.status(400).json({
      message: `You cannot change the order status from "${order.status}" to "${newStatus}" at this time`
    });
  }
  
  next();
});
