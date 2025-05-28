import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import asyncHandler from "express-async-handler";

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, size = 10, search = "" } = req.query;

  let query = {};
  
  // If search term is provided, look for matching order info
  if (search) {
    query = {
      $or: [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phoneNumber': { $regex: search, $options: 'i' } }
      ]
    };
  }
  
  // Get total count for pagination
  const total = await Order.countDocuments(query);
  
  // Get orders with pagination and sorting
  const orders = await Order.find(query)
    .populate('user', 'username email')
    .populate('items.product', 'name images price') // Populate product details for display
    .sort({ createdAt: -1 }) // Sort by order date in descending order
    .skip((page - 1) * Number(size))
    .limit(Number(size));
  
  if (orders.length === 0 && total === 0) {
    return res.status(404).json({ message: "No orders are available" });
  }
  
  res.status(200).json({
    message: "success",
    items: orders,
    total,
    page: Number(page),
    size: Number(size),
    totalPages: Math.ceil(total / size)
  });
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'processing', 'shipped', 'out for delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }
  
  const order = await Order.findById(id);
  
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  // Update status and related fields
  order.status = status;
  
  // Update additional fields based on status
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  } else if (status === 'cancelled') {
    order.cancellationDate = Date.now();
  }
  
  const updatedOrder = await order.save();
  
  res.status(200).json({
    message: "Order status updated successfully",
    order: updatedOrder
  });
});

// Verify return request and process refund
export const verifyReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { approved, notes } = req.body;
  
  // Find the order
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  // Find the specific item in the order
  const orderItem = order.items.id(itemId);
  if (!orderItem) {
    return res.status(404).json({ message: "Order item not found" });
  }
  
  // Check if the item has a return request
  if (!orderItem.isReturned) {
    return res.status(400).json({ message: "This item does not have a return request" });
  }
  
  // Process the return verification
  if (approved) {
    // Update order item with verification details
    orderItem.returnVerified = true;
    orderItem.returnVerifiedAt = Date.now();
    orderItem.returnNotes = notes || 'Return approved';
    
    // Only process refund if the order is not COD or if COD order has been delivered
    const shouldProcessRefund = 
      order.paymentMethod !== 'COD' || 
      (order.paymentMethod === 'COD' && order.isDelivered);
    
    if (shouldProcessRefund) {
      // Get the user
      const user = await User.findById(order.user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has wallet field, if not, add it
      if (!user.wallet) {
        user.wallet = {
          balance: 0,
          transactions: []
        };
      }
      
      // Calculate refund amount (item price minus any applicable fees)
      const refundAmount = orderItem.totalPrice;
      
      // Add refund to user's wallet
      user.wallet.balance += refundAmount;
      
      // Add transaction record
      user.wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        description: `Refund for returned item in order #${order.orderNumber}`,
        date: Date.now()
      });
      
      // Save the user with updated wallet
      await user.save();
    }
    
    // If all items in order are returned, update order status
    const allItemsReturned = order.items.every(item => item.isReturned && item.returnVerified);
    if (allItemsReturned) {
      order.status = 'returned';
    }
    
    // Save the updated order
    await order.save();
    
    return res.status(200).json({
      message: shouldProcessRefund 
        ? "Return request approved and refund processed" 
        : "Return request approved (no refund needed for undelivered COD order)",
      refundProcessed: shouldProcessRefund,
      orderItem
    });
  } else {
    // Reject the return request
    orderItem.returnVerified = false;
    orderItem.returnRejectedAt = Date.now();
    orderItem.returnNotes = notes || 'Return rejected';
    orderItem.isReturned = false; // Reset the return status
    
    // Save the updated order
    await order.save();
    
    return res.status(200).json({
      message: "Return request rejected",
      orderItem
    });
  }
});
