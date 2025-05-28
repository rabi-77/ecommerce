import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";

// Define valid status transitions
export const statusTransitions = {
  pending: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out for delivery', 'cancelled'],
  'out for delivery': ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: []
};

// Middleware to validate status transitions
export const validateStatusChange = asyncHandler(async (req, res, next) => {
  const { status: newStatus } = req.body;
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  if (!statusTransitions[order.status].includes(newStatus)) {
    return res.status(400).json({
      message: `Invalid status transition: Cannot change status from "${order.status}" to "${newStatus}"`
    });
  }
  
  next();
});
