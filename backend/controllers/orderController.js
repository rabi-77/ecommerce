import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import PDFDocument from "pdfkit";
import Coupon from "../models/couponModel.js";
// import fs from 'fs';
// import path from 'path';
import asyncHandler from "express-async-handler";
import { creditWallet, debitWallet } from "../services/walletService.js";
import { fetchActiveOffers, applyBestOffer } from "../services/offerService.js";

const createOrder = asyncHandler(async (req, res) => {
  const { address, paymentMethod = "COD" } = req.body;
  console.log("addressId", address, paymentMethod);

  const userId = req.user;
  console.log("so finally im here right", req.body, req.user.addresses, "ad");

  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    populate:[ {
      path: "category",
      select: "name isListed isDeleted",
    },{
    path:"brand",
    select:"name isListed isDeleted"
    }
  ]
  });

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("No items in cart");
  }

  // Get user's address
  const userAddresses = req.user.addresses;
  const shippingAddress = userAddresses.find(
    (address) => address._id.toString() === address._id.toString()
  );
console.log(shippingAddress,'shippingAddress');

  if (!shippingAddress) {
    res.status(400);
    throw new Error("Invalid shipping address");
  }

  // Validate cart items and calculate prices
  const productIdsForOffer = cart.items.map(ci => ci.product._id);
  const categoryIdsForOffer = cart.items.map(ci => ci.product.category?._id).filter(Boolean);
  const offerMaps = await fetchActiveOffers(productIdsForOffer, categoryIdsForOffer);

  let itemsPrice = 0;
  let discountAmount = 0;
  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    const variant = product.variants.find(
      (v) => v.size === cartItem.variant.size
    );

    // Check if product is available and has stock
    if (
      !product.isListed ||
      product.isDeleted ||
      !product.category ||
      !product.category.isListed ||
      product.category.isDeleted ||
      !product.brand ||
      !product.brand.isListed ||
      product.brand.isDeleted ||
      !variant ||
      variant.stock < cartItem.quantity
    ) {
      res.status(400);
      throw new Error(
        `Product ${product.name} is not available or out of stock`
      );
    }

    // Calculate prices
    const { effectivePrice, appliedOffer, discountPercent } = (() => {
      const res = applyBestOffer(product, offerMaps);
      return { effectivePrice: res.effectivePrice, appliedOffer: res.appliedOffer, discountPercent: res.discountPercent };
    })();
    const price = product.price;
    const discount = discountPercent;
    const discountedPrice = effectivePrice;

    // Add to totals
    itemsPrice += price * cartItem.quantity;
    discountAmount += (price - discountedPrice) * cartItem.quantity;

    // Add to order items
    orderItems.push({
      product: product._id,
      variant: {
        size: cartItem.variant.size,
        _id: variant._id,
        stock: variant.stock,
      },
      quantity: cartItem.quantity,
      price: price,
      discount: discount,
      totalPrice: discountedPrice,
    });

    // Update product stock
    await Product.updateOne(
      {
        _id: product._id,
        "variants._id": variant._id,
      },
      {
        $inc: { "variants.$.stock": -cartItem.quantity },
      }
    );
  }

  // Include coupon discount if applied on cart, but re-validate to ensure it is still eligible
  let couponDiscount = 0;
  let appliedCoupon = null;
  if (cart.coupon) {
    const couponDoc = await Coupon.findById(cart.coupon);
    const now = new Date();

    const stillValid =
      couponDoc &&
      couponDoc.isActive &&
      couponDoc.startDate <= now &&
      couponDoc.expiryDate >= now &&
      (couponDoc.maxUses === null || couponDoc.usedCount < couponDoc.maxUses) &&
      !couponDoc.usedBy.some(id => id.toString() === userId.toString());

    if (!stillValid) {
      return res.status(400).json({
        success: false,
        message: 'The coupon applied to your cart is no longer available. Please review your order before placing it.'
      });
    }

    // Re-validate minimum purchase amount requirement
    // Calculate current subtotal AFTER product-level discounts but BEFORE coupon.
    const currentSubtotal = itemsPrice - discountAmount; // discountAmount currently has only product-level discounts
    if (currentSubtotal < couponDoc.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Cart total must be at least ${couponDoc.minPurchaseAmount} to use this coupon. Please adjust your cart and try again.`
      });
    }

    // Recalculate coupon discount against the live subtotal to ensure accuracy
    try {
      couponDiscount = couponDoc.calculateDiscount(currentSubtotal);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    discountAmount += couponDiscount;
    appliedCoupon = couponDoc._id;
  }

  // Calculate final prices
  const taxPrice = 0; // Tax is included in price for now
  const shippingPrice = 0; // Free shipping for now
  const totalPrice = itemsPrice - discountAmount + taxPrice + shippingPrice;

  // Prevent duplicate unpaid Razorpay orders
  if (paymentMethod === 'RAZORPAY') {
    const existingPending = await Order.findOne({
      user: userId,
      paymentMethod: 'RAZORPAY',
      isPaid: false,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(200).json({ success: true, order: existingPending });
    }
  }

  // Create order
  console.log("before saving");

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  const orderNumber = `ORD-${year}${month}${day}-${timestamp}-${random}`;

  const order = new Order({
    orderNumber,
    user: userId,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountAmount,
    couponDiscount,
    coupon: appliedCoupon,
    totalPrice,
    status: "pending",
    isPaid: false, 
  });
  console.log("is it saved?");

  const createdOrder = await order.save();
  console.log("err");

  // Razorpay flow: return pending order, leave cart intact
  if (paymentMethod === 'RAZORPAY') {
    return res.status(201).json({ success: true, order: createdOrder });
  }

  // Wallet payment: attempt to debit and mark paid
  if (paymentMethod === 'WALLET') {
    try {
      await debitWallet(userId, totalPrice, {
        orderId: createdOrder._id,
        source: 'order',
        description: `Payment for order ${createdOrder.orderNumber}`,
      });

      createdOrder.isPaid = true;
      createdOrder.paidAt = Date.now();
      createdOrder.paymentMethod='WALLET'
      createdOrder.paymentResult = { status: 'completed' };
      await createdOrder.save();
    } catch (err) {
      // If wallet debit fails, delete the order to avoid orphan record
      await Order.findByIdAndDelete(createdOrder._id);
      return res.status(400).json({ success: false, message: err.message || 'Wallet payment failed' });
    }
  }

  // COD or Wallet flow: clear cart & update coupon usage
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
      await Coupon.findByIdAndUpdate(appliedCoupon, {
        $inc: { usedCount: 1 },
        $push: { usedBy: userId },
      });
    } catch (err) {
      console.error("Failed to increment coupon usedCount", err);
    }
  }

  return res.status(201).json({ success: true, order: createdOrder });
});

// @desc    Get order by ID or order number
// @route   GET /orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    $or: [{ _id: req.params.id }, { orderNumber: req.params.id }],
    user: req.user,
  }).populate({
    path: "items.product",
    select: "name images price discount",
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.json({
    success: true,
    order,
  });
});

// @desc    Get logged in user orders with search and filter
// @route   GET /orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  console.log("kdkd");

  const keyword = req.query.keyword || "";
  const status = req.query.status || "";

  let query = { user: req.user };

  // Add search functionality
  if (keyword) {
    query = {
      ...query,
      $or: [
        { orderNumber: { $regex: keyword, $options: "i" } },
        { "shippingAddress.name": { $regex: keyword, $options: "i" } },
      ],
    };
  }
  console.log("kdkd");

  // Add status filter
  if (status && status !== "all") {
    query.status = status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .select(
      "_id orderNumber createdAt totalPrice status isPaid isDelivered items shippingAddress"
    );

  res.json({
    success: true,
    orders,
  });
});

// @desc    Cancel entire order
// @route   PUT /orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  console.log('heyy');
  
  const order = await Order.findOne({
    $or: [{ _id: req.params.id }, { orderNumber: req.params.id }],
    user: req.user,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  
  // Status validation is now handled by the validateUserStatusChange middleware

  // Update order status
  order.status = "cancelled";
  order.cancellationReason = reason;
  order.cancellationDate = Date.now();

  for (const item of order.items) {
    item.isCancelled = true;
    item.cancellationReason = reason;
    item.cancellationDate = Date.now();
  }

  // Restore product stock for all items
  for (const item of order.items) {
    await Product.updateOne(
      {
        _id: item.product,
        "variants._id": item.variant._id,
      },
      {
        $inc: { "variants.$.stock": item.quantity },
      }
    );
  }

  // Wallet refund for full order cancellation
  if (order.isPaid && order.paymentMethod !== 'COD') {
    const alreadyRefunded = order.refundToWallet || 0;
    const amountPaidOnline = order.totalPrice;
    const refundAmount = amountPaidOnline - alreadyRefunded;
    if (refundAmount > 0) {
      await creditWallet(order.user, refundAmount, {
        orderId: order._id,
        source: 'refund',
        description: 'Order cancelled refund',
      });
      order.refundToWallet = alreadyRefunded + refundAmount;
    }
  }

  const updatedOrder = await order.save();

  res.json({
    success: true,
    order: updatedOrder,
  });
});

// @desc    Cancel specific item in order
// @route   PUT /orders/:id/items/:itemId/cancel
// @access  Private
const cancelOrderItem = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const { id, itemId } = req.params;

  const order = await Order.findOne({
    $or: [{ _id: id }, { orderNumber: id }],
    user: req.user,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only allow cancellation if order is pending or processing
  if (!["pending", "processing"].includes(order.status)) {
    res.status(400);
    throw new Error(
      "Cannot cancel items in an order that has been shipped or delivered"
    );
  }

  // Find the specific item
  const item = order.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error("Order item not found");
  }

  // Check if item is already cancelled
  if (item.isCancelled) {
    res.status(400);
    throw new Error("This item is already cancelled");
  }

  // Update item status
  item.isCancelled = true;
  item.cancellationReason = reason;
  item.cancellationDate = Date.now();

  // Restore product stock
  await Product.updateOne(
    {
      _id: item.product,
      "variants._id": item.variant._id,
    },
    {
      $inc: { "variants.$.stock": item.quantity },
    }
  );

  // Wallet refund for partial cancellation
  if (order.isPaid && order.paymentMethod !== 'COD') {
    const remainingSubtotal = order.items.filter(i => !i.isCancelled).reduce((sum,i)=>sum + i.totalPrice,0);
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
      // Refund only what the user actually paid for this item by subtracting its share of the coupon discount
      const discountShare = (item.totalPrice / order.itemsPrice) * (order.couponDiscount || 0);
      refundAmount = item.totalPrice - discountShare;
    } else {
      // Coupon revoked – use differential calculation to avoid over-refund
      refundAmount = amountPaidOnline - newPayable - alreadyRefunded;
    }
    if (refundAmount > 0) {
      await creditWallet(order.user, refundAmount, {
        orderId: order._id,
        source: 'refund',
        description: `Refund for cancelling item ${itemId}`,
      });
      order.refundToWallet = alreadyRefunded + refundAmount;
    }
  }

  // Check if all items are cancelled, update order status if needed
  const allItemsCancelled = order.items.every((item) => item.isCancelled);
  if (allItemsCancelled) {
    order.status = "cancelled";
    order.cancellationReason = "All items cancelled";
    order.cancellationDate = Date.now();
  }

  const updatedOrder = await order.save();

  const populatedOrder = await Order.findById(updatedOrder._id)
  .populate({
    path: 'items.product',
    select: 'name images price discount'
  })
  .lean();

  res.json({
    success: true,
    order: populatedOrder,
  });
});

// @desc    Return entire order
// @route   PUT /orders/:id/return
// @access  Private
const returnOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error("Return reason is required");
  }

  const order = await Order.findOne({
    $or: [{ _id: req.params.id }, { orderNumber: req.params.id }],
    user: req.user,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only allow return if order is delivered
  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("Only delivered orders can be returned");
  }
  
  // Check if a return request is already pending
  if (order.returnRequestStatus === 'pending') {
    res.status(400);
    throw new Error("A return request is already pending for this order");
  }
  
  // Determine which items are still eligible for return
  const eligibleItems = order.items.filter((item) => {
    if (item.isCancelled) return false; // cancelled items cannot be returned
    if (item.isReturned && item.returnRequestStatus === 'approved') return false; // already returned & accepted
    if (item.returnRequestStatus === 'pending') return false; // already has an open request
    if (item.returnRequestStatus === 'rejected') return false; // admin rejected, do not reopen automatically
    return true;
  });

  if (eligibleItems.length === 0) {
    return res.status(400).json({ message: 'No items are eligible for return' });
  }

  // Create return request only for eligible items
  eligibleItems.forEach((item) => {
    item.isReturned = false;
    item.returnReason = reason;
    item.returnRequestStatus = 'pending';
    // item.returnDate = Date.now();
  });

  // If some items were skipped (already processed) mark the order status accordingly
  order.returnRequestStatus = eligibleItems.length === order.items.length ? 'pending' : 'partial-pending';
  order.returnReason = reason;
  order.returnRequestDate = Date.now();
  
  const updatedOrder = await order.save();

  res.json({
    success: true,
    order: updatedOrder,
  });
});

// @desc    Return specific item in order
// @route   PUT /orders/:id/items/:itemId/return
// @access  Private
const returnOrderItem = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const { id, itemId } = req.params;

  if (!reason) {
    res.status(400);
    throw new Error("Return reason is required");
  }

  const order = await Order.findOne({
    $or: [{ _id: id }, { orderNumber: id }],
    user: req.user,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only allow return if order is delivered
  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("Only delivered orders can have items returned");
  }

  // Find the specific item
  const item = order.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error("Order item not found");
  }

  // Check if item is already returned or cancelled
  if (item.isReturned) {
    res.status(400);
    throw new Error("This item is already returned");
  }

  if (item.isCancelled) {
    res.status(400);
    throw new Error("Cancelled items cannot be returned");
  }

  // Update item status - mark as return requested, not immediately returned
  item.isReturned = true;
  item.returnReason = reason;
  item.returnRequestStatus = 'pending';
  item.returnDate = Date.now();
  
  // Update order return request status
  order.returnRequestStatus = 'pending';
  order.returnRequestDate = Date.now();
  
  // Note: We don't restore product stock here - that happens when admin approves the return

  // We don't change the order status to "returned" immediately
  // This will happen only after admin approves the return request

  const updatedOrder = await order.save();

  res.json({
    success: true,
    order: updatedOrder,
  });
});

// @desc    Delete/cancel unpaid pending Razorpay order when checkout is abandoned
// @route   DELETE /orders/:id/unpaid
// @access  Private
const cancelUnpaidOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
console.log('is is cancelling',id);

  const order = await Order.findOne({
    _id: id,
    user: req.user,
    paymentMethod: 'RAZORPAY',
    isPaid: false,
    status: 'pending',
  });

  if (!order) {
    return res.json({ success: false, message: 'Unpaid order not found or already processed' });
  }

  await order.deleteOne(); // Alternatively set status: 'cancelled-unpaid' to keep history

  return res.json({ success: true, message: 'Unpaid order cancelled' });
});

// @desc    Generate invoice for order
// @route   GET /orders/:id/invoice
// @access  Private
const generateInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    $or: [{ _id: req.params.id }, { orderNumber: req.params.id }],
    user: req.user,
  })
    .populate({
      path: "items.product",
      select: "name images price discount",
    })
    .populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Create a PDF document
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order.orderNumber}.pdf`
  );

  // Pipe the PDF to the response
  doc.pipe(res);

  // Add company logo and info
  doc.fontSize(20).text("Vercachi", { align: "center" });
  doc.moveDown();
  doc
    .fontSize(10)
    .text(" Commercial Street,  Perinthalmanna, 7899392", { align: "center" });
  doc.text("Phone: 9876231243 | Email: vercachi@commerce.com", {
    align: "center",
  });
  doc.moveDown(2);

  // Add invoice title
  doc.fontSize(16).text("INVOICE", { align: "center" });
  doc.moveDown();

  // Add order information
  doc.fontSize(12).text(`Invoice Number: ${order.orderNumber}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.text(`Payment Method: ${order.paymentMethod}`);
  doc.text(`Status: ${order.status.toUpperCase()}`);
  doc.moveDown();

  // Add customer information
  doc.fontSize(12).text("Bill To:");
  doc.text(`Name: ${order.shippingAddress.name}`);
  doc.text(`Address: ${order.shippingAddress.addressLine1}`);
  if (order.shippingAddress.addressLine2) {
    doc.text(`         ${order.shippingAddress.addressLine2}`);
  }
  doc.text(
    `         ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.postalCode}`
  );
  doc.text(`         ${order.shippingAddress.country}`);
  doc.text(`Phone: ${order.shippingAddress.phoneNumber}`);
  doc.moveDown();

  // Add table headers
  const tableTop = doc.y;
  const itemX = 50;
  const descriptionX = 100;
  const quantityX = 300;
  const priceX = 350;
  const amountX = 450;

  doc
    .fontSize(10)
    .text("Item", itemX, tableTop)
    .text("Description", descriptionX, tableTop)
    .text("Qty", quantityX, tableTop)
    .text("Price", priceX, tableTop)
    .text("Amount", amountX, tableTop);

  // Draw a line
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Add table rows
  let tableY = tableTop + 25;

  order.items.forEach((item, i) => {
    // Skip cancelled items
    if (item.isCancelled) return;

    const y = tableY + i * 25;
    const itemPrice = item.price * (1 - item.discount / 100);
    const amount = itemPrice * item.quantity;

    doc
      .fontSize(10)
      .text((i + 1).toString(), itemX, y)
      .text(item.product.name, descriptionX, y)
      .text(item.quantity.toString(), quantityX, y)
      .text(`$${itemPrice.toFixed(2)}`, priceX, y)
      .text(`$${amount.toFixed(2)}`, amountX, y);
  });

  // Draw a line
  const bottomY = tableY + order.items.length * 25 + 10;
  doc.moveTo(50, bottomY).lineTo(550, bottomY).stroke();

  // Add totals
  const totalsY = bottomY + 20;
  doc
    .fontSize(10)
    .text("Subtotal:", 350, totalsY)
    .text(`$${order.itemsPrice.toFixed(2)}`, amountX, totalsY);

  doc
    .fontSize(10)
    .text("Discount:", 350, totalsY + 15)
    .text(`-$${order.discountAmount.toFixed(2)}`, amountX, totalsY + 15);

  doc
    .fontSize(10)
    .text("Shipping:", 350, totalsY + 30)
    .text(`$${order.shippingPrice.toFixed(2)}`, amountX, totalsY + 30);

  doc
    .fontSize(10)
    .text("Tax:", 350, totalsY + 45)
    .text(`$${order.taxPrice.toFixed(2)}`, amountX, totalsY + 45);

  doc
    .fontSize(12)
    .text("Total:", 350, totalsY + 65, { font: "Helvetica-Bold" })
    .text(`$${order.totalPrice.toFixed(2)}`, amountX, totalsY + 65, {
      font: "Helvetica-Bold",
    });

  // Add footer
  doc
    .fontSize(10)
    .text("Thank you for your business!", 50, totalsY + 100, {
      align: "center",
    });

  // Finalize the PDF
  doc.end();

  // Update order with invoice info
  order.invoice = {
    generatedAt: Date.now(),
  };
  await order.save();
});

// @desc   Mark Razorpay order payment as failed and clear cart
// @route  POST /orders/:id/payment-failed
// @access Private
const markPaymentFailed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne({
    _id: id,
    user: req.user,
    paymentMethod: 'RAZORPAY',
    isPaid: false,
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Update status so it is not considered pending
  order.status = 'payment_failed';
  await order.save();

  // Clear cart so user starts fresh
  await Cart.findOneAndUpdate(
    { user: req.user },
    {
      $set: {
        items: [],
        coupon: null,
        discount: 0,
        total: 0,
      },
    }
  );

  return res.json({ success: true });
});

export {
  createOrder,
  getOrderById,
  getMyOrders,
  cancelOrder,
  cancelOrderItem,
  returnOrder,
  returnOrderItem,
  generateInvoice,
  cancelUnpaidOrder,
  markPaymentFailed,
};
