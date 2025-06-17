import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import Product from "../../models/productModel.js";
import asyncHandler from "express-async-handler";

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, size = 10, keyword = "", status = "all", sort = "newest" } = req.query;
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);

  let query = {};
  
  // Add search functionality
  if (keyword) {
    query = {
      $or: [
        { orderNumber: { $regex: keyword, $options: 'i' } },
        { 'shippingAddress.name': { $regex: keyword, $options: 'i' } },
        { 'shippingAddress.phoneNumber': { $regex: keyword, $options: 'i' } }
      ]
    };
  }
  
  // Add status filter
  if (status && status !== 'all') {
    query.status = status;
  }
  
  // Get total count for pagination
  const total = await Order.countDocuments(query);
  
  // Set up sorting based on sort parameter
  let sortOption = {};
  switch (sort) {
    case "oldest":
      sortOption.createdAt = 1;
      break;
    case "price-low-to-high":
      sortOption.totalPrice = 1;
      break;
    case "price-high-to-low":
      sortOption.totalPrice = -1;
      break;
    case "newest":
    default:
      sortOption.createdAt = -1;
      break;
  }
  
  // Get orders with pagination
  const orders = await Order.find(query)
    .populate('user', 'username email')
    .populate('items.product', 'name images price')
    .sort(sortOption)
    .skip((pageNum - 1) * sizeNum)
    .limit(sizeNum);

  if (orders.length === 0 && total === 0) {
    return res.status(404).json({ message: "No orders are available" });
  }

  res.json({
    success: true,
    orders,
    total,
    page: Number(page),
    size: Number(size),
    totalPages: Math.ceil(total / Number(size))
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
    order.isPaid= true;
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  } else if (status === 'cancelled') {
    order.isPaid=false
    order.cancellationDate = Date.now();
  }
  
  // Save the order first
  await order.save();
  
  // Then fetch it with populated fields to return complete data
  const populatedOrder = await Order.findById(id)
    .populate('user', 'username email')
    .populate('items.product', 'name images price');
  
  res.status(200).json({
    message: "Order status updated successfully",
    order: populatedOrder
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
  
  // Validate there is a pending return request on this item
  if (orderItem.returnRequestStatus !== 'pending') {
    return res.status(400).json({ message: "This item does not have a pending return request" });
  }
  
  // Process the return verification
  if (approved) {
    // Update order item with verification details
    orderItem.isReturned = true;
    orderItem.returnVerified = true;
    orderItem.returnVerifiedAt = Date.now();
    orderItem.returnDate = Date.now();
    orderItem.returnNotes = notes || 'Return approved';
    orderItem.returnRequestStatus = 'approved';
    
    // Restore product stock for this item
    await Product.updateOne(
      {
        _id: orderItem.product,
        "variants._id": orderItem.variant._id,
      },
      {
        $inc: { "variants.$.stock": orderItem.quantity },
      }
    );
    
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
    
    // Check if all items in the order have been approved for return
    const allItemsReturned = order.items.every(item => 
      item.isCancelled || (item.isReturned && item.returnRequestStatus === 'approved')
    );
    
    // If all items are returned, update the order status
    if (allItemsReturned) {
      order.status = 'returned';
      order.returnDate = Date.now();
    }
    
    // Update the order's return request status
    order.returnRequestStatus = order.items.every(item => 
      item.isCancelled || 
      !item.isReturned || 
      (item.isReturned && (item.returnRequestStatus === 'approved' || item.returnRequestStatus === 'rejected'))
    ) ? 'approved' : 'pending';
    
    // Save the updated order
    await order.save();
    
    // Fetch the populated order to return complete data
    const populatedOrder = await Order.findById(orderId)
      .populate('user', 'username email')
      .populate('items.product', 'name images price');
    
    return res.status(200).json({
      message: shouldProcessRefund ? 
        "Return request approved and refund processed" : 
        "Return request approved, no refund processed for COD order that wasn't delivered",
      order: populatedOrder
    });
  } else {
    // Reject the return request
    orderItem.isReturned = false;
    orderItem.returnVerified = false;
    orderItem.returnVerifiedAt = Date.now();
    orderItem.returnNotes = notes || 'Return rejected';
    orderItem.returnRequestStatus = 'rejected';
    
    // Update the order's return request status
    order.returnRequestStatus = order.items.every(item => 
      item.isCancelled || 
      !item.isReturned || 
      (item.isReturned && (item.returnRequestStatus === 'approved' || item.returnRequestStatus === 'rejected'))
    ) ? 'rejected' : 'pending';
    
    // Save the updated order
    await order.save();
    
    // Fetch the populated order to return complete data
    const populatedOrder = await Order.findById(orderId)
      .populate('user', 'username email')
      .populate('items.product', 'name images price');
    
    return res.status(200).json({
      message: "Return request rejected",
      order: populatedOrder
    });
  }
});
