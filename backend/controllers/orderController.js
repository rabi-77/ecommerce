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
import { TAX_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../config/pricing.js';
import mongoose from 'mongoose';

const createOrder = asyncHandler(async (req, res) => {
  console.log('hi');
  
  const { address, paymentMethod = "COD" } = req.body;
  const userId = req.user;
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

  const userAddresses = req.user.addresses;
  const shippingAddress = userAddresses.find(
    (address) => address._id.toString() === address._id.toString()
  );
  if (!shippingAddress) {
    res.status(400);
    throw new Error("Invalid shipping address");
  }

  const productIdsForOffer = cart.items.map(ci => ci.product._id);
  const categoryIdsForOffer = cart.items.map(ci => ci.product.category?._id).filter(Boolean);
  const offerMaps = await fetchActiveOffers(productIdsForOffer, categoryIdsForOffer);

  let itemsPrice = 0;
  let offerDiscountTotal = 0; // accumulate product/category offer savings
  let discountAmount = 0; // will become offerDiscountTotal + couponDiscount
  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    const variant = product.variants.find(
      (v) => v.size === cartItem.variant.size
    );

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

    const { effectivePrice, appliedOffer, discountPercent } = (() => {
      const res = applyBestOffer(product, offerMaps);
      return { effectivePrice: res.effectivePrice, appliedOffer: res.appliedOffer, discountPercent: res.discountPercent };
    })();
    const price = product.price;
    const discount = discountPercent;
    const discountedPrice = effectivePrice; // price after offer (per unit)
    const offerDiscount = price - discountedPrice; // per-unit discount from offer

    itemsPrice += price * cartItem.quantity;
    offerDiscountTotal += offerDiscount * cartItem.quantity;
    discountAmount += offerDiscount * cartItem.quantity;

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
      offerDiscount: offerDiscount,
      // finalUnitPrice will be added after coupon allocation
    });

    await Product.updateOne(
      {
        _id: product._id,
        "variants._id": variant._id,
      },
      {
        $inc: {
          "variants.$.stock": -cartItem.quantity,
          totalStock: -cartItem.quantity,
        },
      }
    );
  }

  if (paymentMethod === 'COD') {
    const subtotalBeforeCoupon = itemsPrice - discountAmount; 
    if (subtotalBeforeCoupon > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Cash on Delivery is available only for orders up to ₹1000. Please choose an online payment method.'
      });
    }
  }

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

    try {
      couponDiscount = couponDoc.calculateDiscount(currentSubtotal);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    discountAmount = offerDiscountTotal + couponDiscount;
    appliedCoupon = couponDoc._id;
    
  }

  
  const netAmount = itemsPrice - discountAmount; // after product + coupon discounts, before tax / shipping

  // ---- Allocate couponShare & taxShare per item ----
  if (itemsPrice > 0) {
    orderItems.forEach((itm) => {
      const lineOriginal = itm.price * itm.quantity; // before any discount
      const couponShare = parseFloat(((lineOriginal / itemsPrice) * couponDiscount).toFixed(2));
      const priceAfterDiscounts = (itm.totalPrice * itm.quantity) - couponShare;
      const taxShare = parseFloat((priceAfterDiscounts * TAX_RATE).toFixed(2));

      itm.couponShare = couponShare;
      itm.taxShare = taxShare;

      // ---- Compute finalUnitPrice per unit (price after offer + coupon) ----
      const totalAfterAllDiscounts = (itm.totalPrice * itm.quantity) - couponShare; // total after offer + coupon, before tax
      const finalUnit = parseFloat((totalAfterAllDiscounts / itm.quantity).toFixed(2));
      itm.finalUnitPrice = finalUnit;
      console.log(itm.finalUnitPrice,'finalUnitPrice');
      
    });
  }

 
  // After coupon share loop, recalc offerDiscountTotal in case of rounding adjustments
  orderItems.forEach(itm => {
    // ensure aggregate stays precise to 2 decimals
    offerDiscountTotal = parseFloat((offerDiscountTotal).toFixed(2));
  });

  const baseForShipping = netAmount + couponDiscount; 
  const shippingPrice = baseForShipping >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const taxPrice = orderItems.reduce((sum, i) => sum + (i.taxShare || 0), 0);

  const totalPrice = netAmount + taxPrice + shippingPrice;

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

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  const orderNumber = `ORD-${year}${month}${day}-${timestamp}-${random}`;

  console.log(offerDiscountTotal?'offerDiscountTotal':'no');
  const order = new Order({
    orderNumber,
    user: userId,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    offerDiscount: offerDiscountTotal,
    
    discountAmount,
    couponDiscount,
    coupon: appliedCoupon,
    totalPrice,
    status: "pending",
    isPaid: false, 
  });
  const createdOrder = await order.save();
  if (paymentMethod === 'RAZORPAY') {
    return res.status(201).json({ success: true, order: createdOrder });
  }

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
      
      await Order.findByIdAndDelete(createdOrder._id);
      return res.status(400).json({ success: false, message: err.message || 'Wallet payment failed' });
    }
  }

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

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Safely build query to avoid CastError on invalid ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

  const orConditions = [{ orderNumber: id }];
  if (isValidObjectId) {
    orConditions.unshift({ _id: id });
  }

  const order = await Order.findOne({
    $or: orConditions,
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

const getMyOrders = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword || "";
  const status = req.query.status || "";

  let query = { user: req.user };

  if (keyword) {
    query = {
      ...query,
      $or: [
        { orderNumber: { $regex: keyword, $options: "i" } },
        { "shippingAddress.name": { $regex: keyword, $options: "i" } },
      ],
    };
  }
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

const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const order = await Order.findOne({
    $or: [{ _id: req.params.id }, { orderNumber: req.params.id }],
    user: req.user,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  
  order.status = "cancelled";
  order.cancellationReason = reason;
  order.cancellationDate = Date.now();

  for (const item of order.items) {
    item.isCancelled = true;
    item.cancellationReason = reason;
    item.cancellationDate = Date.now();
  }

  for (const item of order.items) {
    await Product.updateOne(
      {
        _id: item.product,
        "variants._id": item.variant._id,
      },
      {
        $inc: {
          "variants.$.stock": item.quantity,
          totalStock: item.quantity,
        },
      }
    );
  }

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

  if (!["pending", "processing"].includes(order.status)) {
    res.status(400);
    throw new Error(
      "Cannot cancel items in an order that has been shipped or delivered"
    );
  }

  const item = order.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error("Order item not found");
  }

  if (item.isCancelled) {
    res.status(400);
    throw new Error("This item is already cancelled");
  }

  item.isCancelled = true;
  item.cancellationReason = reason;
  item.cancellationDate = Date.now();
  await Product.updateOne(
    {
      _id: item.product,
      "variants._id": item.variant._id,
    },
    {
      $inc: {
        "variants.$.stock": item.quantity,
        totalStock: item.quantity,
      },
    }
  );

  if (order.paymentMethod === 'COD') {
    const activeItems = order.items.filter(i => !i.isCancelled);
    const activeSubtotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Compute per-item offer discount removed and update aggregated offerDiscount
    const unitBefore = item.price; // MRP per unit
    const unitAfterOffer = item.totalPrice; // price after offer (before coupon)
    const cancelledOfferDiscount = (unitBefore - unitAfterOffer) * item.quantity;

    if (order.offerDiscount) {
      order.offerDiscount = parseFloat(Math.max(order.offerDiscount - cancelledOfferDiscount, 0).toFixed(2));
    }

    let couponStillValid = true;
    if (order.coupon) {
      const couponDoc = await Coupon.findById(order.coupon).select('minPurchaseAmount');
      const minSpend = couponDoc?.minPurchaseAmount ?? 0;
      couponStillValid = activeSubtotal >= minSpend;
    }

    if (!couponStillValid) {
      const prevCouponDiscount = order.couponDiscount || 0;
      order.couponDiscount = 0;
    }
 
    // Recompute total discountAmount after any adjustments
    order.discountAmount = parseFloat(((order.offerDiscount || 0) + (order.couponDiscount || 0)).toFixed(2));

    const netAfterDiscounts = activeSubtotal - order.discountAmount;

    order.itemsPrice = activeSubtotal;
    order.shippingPrice = activeSubtotal === 0 ? 0 : (activeSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);
    order.taxPrice = activeSubtotal === 0 ? 0 : parseFloat((netAfterDiscounts * TAX_RATE).toFixed(2));
    order.totalPrice = activeSubtotal === 0 ? 0 : (netAfterDiscounts + order.shippingPrice + order.taxPrice);
  }

  if (order.isPaid && order.paymentMethod !== 'COD') {

    const prevTotal = order.totalPrice;

    const subtotalBefore = order.itemsPrice; 
    const itemOriginalPrice = item.price * item.quantity;
    const itemPaidPrice = (item.finalUnitPrice || item.totalPrice || item.price) * item.quantity;
    const remainingSubtotal = subtotalBefore - itemOriginalPrice;

    const isLastActive = remainingSubtotal === 0;
    let couponStillApplies = true;
    if (order.coupon) {
      const couponDoc = await Coupon.findById(order.coupon).select('minPurchaseAmount');
      const minSpend = couponDoc?.minPurchaseAmount ?? 0;
      couponStillApplies = remainingSubtotal >= minSpend;
    }

    let refundAmount = 0;

    if (isLastActive) {
      refundAmount = prevTotal;

      order.itemsPrice = 0;
      order.couponDiscount = 0;
      order.discountAmount = 0;
      order.shippingPrice = 0;
      order.taxPrice = 0;
      order.totalPrice = 0;
    } else {
      const couponShare = item.couponShare || 0;
      const itemTax = item.taxShare || 0;

      refundAmount = itemPaidPrice + itemTax;

      order.itemsPrice -= itemOriginalPrice;
      order.couponDiscount = parseFloat((order.couponDiscount - couponShare).toFixed(2));
      // offerDiscount portion to remove is (item.price - item.totalPrice) * qty (already per-unit offer saving)
      const removedOfferDisc = (item.price - item.totalPrice) * item.quantity;
      order.offerDiscount = parseFloat(Math.max((order.offerDiscount || 0) - removedOfferDisc, 0).toFixed(2));
      order.discountAmount = parseFloat(((order.offerDiscount || 0) + (order.couponDiscount || 0)).toFixed(2));
      order.taxPrice = parseFloat((order.taxPrice - itemTax).toFixed(2));
      order.totalPrice = parseFloat((order.totalPrice - refundAmount).toFixed(2));
    }

    if (refundAmount < 0) refundAmount = 0;

    if (refundAmount > 0) {
      await creditWallet(order.user, refundAmount, {
        orderId: order._id,
        source: 'refund',
        description: `Refund for cancelling item ${itemId}`,
      });
      order.refundToWallet = (order.refundToWallet || 0) + refundAmount;
    }
  }

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

  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("Only delivered orders can be returned");
  }
  
  if (order.returnRequestStatus === 'pending') {
    res.status(400);
    throw new Error("A return request is already pending for this order");
  }
  
  const eligibleItems = order.items.filter((item) => {
    if (item.isCancelled) return false; 
    if (item.isReturned && item.returnRequestStatus === 'approved') return false; 
    if (item.returnRequestStatus === 'pending') return false; 
    if (item.returnRequestStatus === 'rejected') return false; 
    return true;
  });

  if (eligibleItems.length === 0) {
    return res.status(400).json({ message: 'No items are eligible for return' });
  }

  eligibleItems.forEach((item) => {
    item.isReturned = false;
    item.returnReason = reason;
    item.returnRequestStatus = 'pending';
  });

  order.returnRequestStatus = eligibleItems.length === order.items.length ? 'pending' : 'partial-pending';
  order.returnReason = reason;
  order.returnRequestDate = Date.now();
  
  const updatedOrder = await order.save();

  res.json({
    success: true,
    order: updatedOrder,
  });
});

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

  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("Only delivered orders can have items returned");
  }

  const item = order.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error("Order item not found");
  }

  if (item.isReturned) {
    res.status(400);
    throw new Error("This item is already returned");
  }

  if (item.isCancelled) {
    res.status(400);
    throw new Error("Cancelled items cannot be returned");
  }

  item.isReturned = true;
  item.returnReason = reason;
  item.returnRequestStatus = 'pending';
  item.returnDate = Date.now();
  
  order.returnRequestStatus = 'pending';
  order.returnRequestDate = Date.now();
  


  const updatedOrder = await order.save();

  res.json({
    success: true,
    order: updatedOrder,
  });
});

const cancelUnpaidOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
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

  await order.deleteOne(); 

  return res.json({ success: true, message: 'Unpaid order cancelled' });
});

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

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order.orderNumber}.pdf`
  );

  doc.pipe(res);

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
  const quantityX = 280; // shift left to make space for new column
  const priceX = 330;
  const offerX = 400; // new column for offer discount
  const amountX = 470;
  const statusX = amountX + 60;

  doc
    .fontSize(10)
    .text("Item", itemX, tableTop)
    .text("Description", descriptionX, tableTop)
    .text("Qty", quantityX, tableTop)
    .text("Price", priceX, tableTop)
    .text("Offer Disc", offerX, tableTop)
    .text("Amount", amountX, tableTop)
    .text("Status", statusX, tableTop);

  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  let tableY = tableTop + 25;

  order.items.forEach((item, i) => {
    const y = tableY + i * 25;
    const itemPrice = item.price; // original price per unit
    const offerDiscPerUnit = item.offerDiscount || 0; // per-unit offer discount saved in order item
    const effectiveUnitPrice = itemPrice - offerDiscPerUnit; // price after offer
    const amount = effectiveUnitPrice * item.quantity;

    const statusLabel = item.isCancelled ? 'Cancelled' : (item.isReturned ? 'Returned' : '');

    doc
      .fontSize(10)
      .text((i + 1).toString(), itemX, y)
      .text(item.product.name, descriptionX, y)
      .text(item.quantity.toString(), quantityX, y)
      .text(`Rs.${itemPrice.toFixed(2)}`, priceX, y)
      .text(`-Rs.${(offerDiscPerUnit * item.quantity).toFixed(2)}`, offerX, y)
      .text(`Rs.${amount.toFixed(2)}`, amountX, y)
      .text(statusLabel, statusX, y);
  });

  const bottomY = tableY + order.items.length * 25 + 10;
  doc.moveTo(50, bottomY).lineTo(550, bottomY).stroke();

  let lineY = bottomY + 20;

  // Subtotal
  doc
    .fontSize(10)
    .text("Subtotal:", 350, lineY)
    .text(`Rs.${order.itemsPrice.toFixed(2)}`, amountX, lineY);

  // Offer Discount
  lineY += 15;
  doc
    .fontSize(10)
    .text("Offer Discount:", 350, lineY)
    .text(`-Rs.${(order.offerDiscount || 0).toFixed(2)}`, amountX, lineY);

  // Coupon Discount (only if applied)
  lineY += 15;
  doc
    .fontSize(10)
    .text("Coupon Discount:", 350, lineY)
    .text(`-Rs.${(order.couponDiscount || 0).toFixed(2)}`, amountX, lineY);

  // Shipping
  lineY += 15;
  doc
    .fontSize(10)
    .text("Shipping:", 350, lineY)
    .text(`Rs.${order.shippingPrice.toFixed(2)}`, amountX, lineY);

  // Tax
  lineY += 15;
  doc
    .fontSize(10)
    .text("Tax:", 350, lineY)
    .text(`Rs.${order.taxPrice.toFixed(2)}`, amountX, lineY);

  // Total
  lineY += 20;
  doc
    .fontSize(12)
    .text("Total:", 350, lineY, { font: "Helvetica-Bold" })
    .text(`Rs.${order.totalPrice.toFixed(2)}`, amountX, lineY, {
      font: "Helvetica-Bold",
    });

  // Add footer
  doc
    .fontSize(10)
    .text("Thank you for your business!", 50, lineY + 35, {
      align: "center",
    });

  // Finalize the PDF
  doc.end();

  order.invoice = {
    generatedAt: Date.now(),
  };
  await order.save();
});

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

  order.status = 'payment_failed';
  await order.save();

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

function _calculateItemRefund(order, item, isLastActive) {
  const itemPrice = item.totalPrice;
  const itemTax = parseFloat((itemPrice * TAX_RATE).toFixed(2));
  const itemShipping = isLastActive ? order.shippingPrice : 0;

  return itemPrice + itemTax + itemShipping;
}

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
