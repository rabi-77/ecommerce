import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import Product from "../../models/productModel.js";
import asyncHandler from "express-async-handler";
import { creditWallet } from "../../services/walletService.js";
import Coupon from "../../models/couponModel.js";

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, size = 10, keyword = "", status = "all", sort = "newest" } = req.query;
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);

  let query = {};
  
  if (keyword) {
    query = {
      $or: [
        { orderNumber: { $regex: keyword, $options: 'i' } },
        { 'shippingAddress.name': { $regex: keyword, $options: 'i' } },
        { 'shippingAddress.phoneNumber': { $regex: keyword, $options: 'i' } }
      ]
    };
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const total = await Order.countDocuments(query);
  
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
    
    if (order.isPaid && ['WALLET', 'RAZORPAY'].includes(order.paymentMethod)) {
      await creditWallet(order.user, order.totalPrice, {
        orderId: order._id,
        source: 'refund',
        description: 'Refund for cancelled order',
      });
      order.refundToWallet = (order.refundToWallet || 0) + order.totalPrice;
    }

    order.isPaid = false;
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

export const verifyReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { approved, notes } = req.body;
  
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  const orderItem = order.items.id(itemId);
  if (!orderItem) {
    return res.status(404).json({ message: "Order item not found" });
  }
  
  // Validate there is a pending return request on this item
  if (orderItem.returnRequestStatus !== 'pending') {
    return res.status(400).json({ message: "This item does not have a pending return request" });
  }
  
  // Helper to recalculate order-level returnRequestStatus
  function calculateOrderReturnStatus(order) {
    const relevantItems = order.items.filter(item => !item.isCancelled);
    const pendingCount = relevantItems.filter(item => item.returnRequestStatus === 'pending').length;
    const approvedCount = relevantItems.filter(item => item.returnRequestStatus === 'approved').length;
    const rejectedCount = relevantItems.filter(item => item.returnRequestStatus === 'rejected').length;

    if (pendingCount > 0 && (approvedCount > 0 || rejectedCount > 0)) {
      return 'partial-pending';
    }
    if (pendingCount > 0) {
      return 'pending';
    }
    if (approvedCount > 0 && rejectedCount === 0) {
      return 'approved';
    }
    if (rejectedCount > 0 && approvedCount === 0) {
      return 'rejected';
    }
    // Mixed approved and rejected with no pending – fall back to partial-pending so admin can review
    return 'partial-pending';
  }

  if (approved) {
    // Update order item with verification details
    orderItem.isReturned = true;
    orderItem.returnVerified = true;
    orderItem.returnVerifiedAt = Date.now();
    orderItem.returnDate = Date.now();
    orderItem.returnNotes = notes || 'Return approved';
    orderItem.returnRequestStatus = 'approved';
    
    await Product.updateOne(
      {
        _id: orderItem.product,
        "variants._id": orderItem.variant._id,
      },
      {
        $inc: { "variants.$.stock": orderItem.quantity },
      }
    );
    
    const shouldProcessRefund = 
      order.paymentMethod !== 'COD' || 
      (order.paymentMethod === 'COD' && order.isDelivered);
    
    if (shouldProcessRefund) {
      // Calculate accurate refund with coupon rules
      const remainingSubtotal = order.items.filter(it => !(it._id.toString() === itemId) && !it.isCancelled && !(it.isReturned && it.returnRequestStatus==='approved')).reduce((sum,it)=>sum + it.totalPrice,0);

      let minSpend = 0;
      if (order.coupon) {
        const couponDoc = await Coupon.findById(order.coupon).select('minimumAmount');
        if (couponDoc) minSpend = couponDoc.minimumAmount;
      }

      const couponStillApplies = remainingSubtotal >= minSpend;
      const newDiscount = couponStillApplies ? order.couponDiscount : 0;
      const newPayable = remainingSubtotal - newDiscount;

      const amountPaidOnline = order.totalPrice;
      const alreadyRefunded = order.refundToWallet || 0;

      let refundAmount = 0;
      if (couponStillApplies) {
        // Pro-rate the coupon discount to this item so customer only gets back what they actually paid
        const discountShare = (orderItem.totalPrice / order.itemsPrice) * (order.couponDiscount || 0);
        refundAmount = orderItem.totalPrice - discountShare;
      } else {
        // Coupon revoked – fall back to differential method
        refundAmount = amountPaidOnline - newPayable - alreadyRefunded;
      }

      if (refundAmount > 0) {
        await creditWallet(order.user, refundAmount, {
          orderId: order._id,
          source: 'refund',
          description: `Refund for returned item ${orderItem.product}`,
        });
        order.refundToWallet = alreadyRefunded + refundAmount;
      }
    }
    
    const allItemsReturned = order.items.every(item => 
      item.isCancelled || (item.isReturned && item.returnRequestStatus === 'approved')
    );
    
    if (allItemsReturned) {
      order.status = 'returned';
      order.returnDate = Date.now();
    }
    
    // Re-calculate order-level return status with new helper
    order.returnRequestStatus = calculateOrderReturnStatus(order);
    
    await order.save();
    
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
    
    // Re-calculate order-level return status with new helper
    order.returnRequestStatus = calculateOrderReturnStatus(order);
    
    await order.save();
    
    const populatedOrder = await Order.findById(orderId)
      .populate('user', 'username email')
      .populate('items.product', 'name images price');
    
    return res.status(200).json({
      message: "Return request rejected",
      order: populatedOrder
    });
  }
});
