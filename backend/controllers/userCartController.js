import Cart from '../models/cartModel.js';
import productModel from '../models/productModel.js';
import wishlistModel from '../models/wishlistModel.js';
import Coupon from '../models/couponModel.js';
import { fetchActiveOffers, applyBestOffer } from '../services/offerService.js';
import { TAX_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../config/pricing.js';
import mongoose from 'mongoose';

const MAX_QUANTITY_PER_PRODUCT = 10;

export const calculateCartTotals = async (cart) => {
  let subtotal = 0;
  let productDiscount = 0;
  let couponDiscount = 0;
  let totalAfterProductDisc = 0;
  let totalAfterCoupon = 0; // before tax & shipping
  let tax = 0;
  let shipping = 0;
  let grandTotal = 0;

  // Fetch current active offers for all products in cart
  const productIds = cart.items.map(item => item.product._id);
  const categoryIds = cart.items.map(item => item.product.category?._id).filter(Boolean);
  const offerMaps = await fetchActiveOffers(productIds, categoryIds);

  cart.items.forEach((item, index) => {
    const itemPrice = item.product.price;
    const itemDisc = item.product.discount || 0;
    const discountedPrice = itemPrice * (1 - itemDisc / 100);
    
    // Update offer fields for this cart item
    const { effectivePrice, appliedOffer } = applyBestOffer(item.product, offerMaps);
    console.log('so applieng here right');
    
    item.appliedOffer = appliedOffer?._id || null;

    console.log('appliedOffer', appliedOffer);
    console.log('item.appliedOffer',item.appliedOffer);
    
    item.offerPrice = effectivePrice;
    
    // Mark the item as modified for Mongoose
    cart.markModified(`items.${index}.appliedOffer`);
    cart.markModified(`items.${index}.offerPrice`);
    
    subtotal += itemPrice * item.quantity;
    productDiscount += (itemPrice - discountedPrice) * item.quantity;
    totalAfterProductDisc += discountedPrice * item.quantity;
  });
await cart.save();
  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        couponDiscount = (totalAfterProductDisc * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
        }
      } else {
        couponDiscount = Math.min(coupon.discountValue, totalAfterProductDisc);
      }
      totalAfterCoupon = Math.max(0, totalAfterProductDisc - couponDiscount);
    }
  } else {
    totalAfterCoupon = totalAfterProductDisc;
  }

  tax = parseFloat((totalAfterCoupon * TAX_RATE).toFixed(2));

  shipping = totalAfterProductDisc >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  grandTotal = parseFloat((totalAfterCoupon + tax + shipping).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    productDiscount: parseFloat(productDiscount.toFixed(2)),
    couponDiscount: parseFloat(couponDiscount.toFixed(2)),
    tax,
    shipping,
    total: grandTotal
  };
};

export const addToCart = async (req, res) => {
  try {
    const { productId, size, quantity = 1 } = req.body;
    const userId = req.user;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isListed || product.isDeleted) {
      return res.status(400).json({ message: "Product is not available" });
    }

    const categoryPopulated = await product.populate('category');
    if (categoryPopulated.category && (!categoryPopulated.category.isListed || categoryPopulated.category.isDeleted)) {
      return res.status(400).json({ message: "Product category is not available" });
    }

    const brandPopulated = await categoryPopulated.populate('brand');
    if (brandPopulated.brand && (!brandPopulated.brand.isListed || brandPopulated.brand.isDeleted)) {
      return res.status(400).json({ message: "Product brand is not available" });
    }

    const variant = product.variants.find(v => v.size === size);
    if (!variant) {
      return res.status(400).json({ message: "Selected size is not available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        coupon: null,
        discount: 0,
        total: 0
      });
    }

    const productItems = cart.items.filter(item => item.product.toString() === productId);
    let totalProductQuantity = productItems.reduce((total, item) => total + item.quantity, 0);

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant.size === size
    );

    if (existingItemIndex > -1) {
      const newVariantQuantity = cart.items[existingItemIndex].quantity + quantity;
      const newTotalQuantity = totalProductQuantity + quantity;
      
      if (newVariantQuantity > variant.stock) {
        return res.status(400).json({ message: `Cannot add more items. Only ${variant.stock} available in this size.` });
      }
      
      if (newTotalQuantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      // Calculate current offer for the existing item
      const offerMaps = await fetchActiveOffers([productId], [product.category?._id].filter(Boolean));
      const { effectivePrice, appliedOffer, discountAmount } = applyBestOffer(product, offerMaps);
      console.log('appliedOffer', appliedOffer);
      
      cart.items[existingItemIndex].quantity = newVariantQuantity;
      cart.items[existingItemIndex].variant.stock = variant.stock; // Update stock info
      cart.items[existingItemIndex].appliedOffer = appliedOffer?._id || null;
      cart.items[existingItemIndex].offerPrice = effectivePrice;
      cart.items[existingItemIndex].offerDiscount = discountAmount || 0;
    } else {
      if (totalProductQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      // Calculate current offer for the new item
      const offerMaps = await fetchActiveOffers([productId], [product.category?._id].filter(Boolean));
      const { effectivePrice, appliedOffer, discountAmount } = applyBestOffer(product, offerMaps);
      console.log('appliedOffer', appliedOffer);
      
      cart.items.push({
        product: productId,
        variant: {
          size: size,
          stock: variant.stock
        },
        quantity,
        appliedOffer: appliedOffer?._id || null,
        offerPrice: effectivePrice,
        // offerDiscount: discountAmount || 0
      });
    }

    await cart.save();

    await wishlistModel.findOneAndDelete({ user: userId, product: productId });

    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      })
      .populate('coupon');

    const totals = await calculateCartTotals(populatedCart);

    populatedCart.discount = totals.couponDiscount;
    populatedCart.tax = totals.tax;
    populatedCart.shipping = totals.shipping;
    populatedCart.total = totals.total;
    await populatedCart.save();

    res.status(201).json({ 
      message: "Item added to cart",
      cartItems: populatedCart.items,
      count: populatedCart.items.length,
      summary: {
        subtotal: totals.subtotal,
        productDiscount: totals.productDiscount,
        couponDiscount: totals.couponDiscount,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total
      }
    });
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const cartItem = cart.items[itemIndex];

    const product = await productModel.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.isListed || product.isDeleted) {
      return res.status(400).json({ message: "Product is no longer available" });
    }

    const categoryPopulated = await product.populate('category');
    if (categoryPopulated.category && (!categoryPopulated.category.isListed || categoryPopulated.category.isDeleted)) {
      return res.status(400).json({ message: "Product category is not available" });
    }
    const brandPopulated = await product.populate('brand');
    if (brandPopulated.brand && (!brandPopulated.brand.isListed || brandPopulated.brand.isDeleted)) {
      return res.status(400).json({ message: "Product brand is not available" });
    }
    const variant = product.variants.find(v => v.size === cartItem.variant.size);
    if (!variant) {
      return res.status(400).json({ message: "Product variant no longer available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    const productItems = cart.items.filter(
      item => item.product.toString() === cartItem.product.toString() && item._id.toString() !== cartItemId
    );
    const otherVariantsQuantity = productItems.reduce((total, item) => total + item.quantity, 0);
    
    if (otherVariantsQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
      return res.status(400).json({ 
        message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].variant.stock = variant.stock; 

    await cart.save();
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      })
      .populate('coupon');

    const totals = await calculateCartTotals(populatedCart);

    populatedCart.discount = totals.couponDiscount;
    populatedCart.tax = totals.tax;
    populatedCart.shipping = totals.shipping;
    populatedCart.total = totals.total;
    await populatedCart.save();

    res.json({ 
      message: "Cart updated",
      cartItems: populatedCart.items,
      count: populatedCart.items.length,
      summary: {
        subtotal: totals.subtotal,
        productDiscount: totals.productDiscount,
        couponDiscount: totals.couponDiscount,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total
      }
    });
  } catch (err) {
    console.error('Error updating cart item:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      })
      .populate('coupon');

    const totals = await calculateCartTotals(populatedCart);

    if (populatedCart.items.length === 0 && populatedCart.coupon) {
      populatedCart.coupon = null;
      populatedCart.discount = 0;
      populatedCart.tax = 0;
      populatedCart.shipping = 0;
      populatedCart.total = 0;
      await populatedCart.save();
    } else {
      populatedCart.discount = totals.couponDiscount;
      populatedCart.tax = totals.tax;
      populatedCart.shipping = totals.shipping;
      populatedCart.total = totals.total;
      await populatedCart.save();
    }

    res.json({ 
      message: "Item removed from cart",
      cartItems: populatedCart.items,
      count: populatedCart.items.length,
      summary: {
        subtotal: totals.subtotal,
        productDiscount: totals.productDiscount,
        couponDiscount: totals.couponDiscount,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total
      }
    });
  } catch (err) {
    console.error('Error removing from cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user;
    
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name isListed isDeleted' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      });

    if (!cart) {
      return res.json({
        cartItems: [],
        count: 0,
        summary: {
          subtotal: 0,
          productDiscount: 0,
          couponDiscount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        }
      });
    }

    const availableCartItems = cart.items.filter(item => {
      const product = item.product;
      if (!product) return false; 
      
      const category = product.category;
      const brand = product.brand;
      const variant = product.variants.find(v => v.size === item.variant.size);

      return product.isListed && 
             !product.isDeleted && 
             category && 
             category.isListed && 
             !category.isDeleted&&
             brand &&
             brand.isListed &&
             !brand.isDeleted &&
             variant && 
             variant.stock >= item.quantity;
    });

    const productIds = availableCartItems.map(it => it.product._id);
    const categoryIds = availableCartItems
      .map(it => it.product.category?._id)
      .filter(Boolean);
    const offerMaps = await fetchActiveOffers(productIds, categoryIds);

    let subtotal = 0;
    let productDiscount = 0;
    let totalAfterProductDisc = 0;
    let totalAfterCoupon = 0; // before tax & shipping
    let tax = 0;
    let shipping = 0;
    let grandTotal = 0;

    availableCartItems.forEach(item => {
      const productDoc = item.product;
      const { effectivePrice, appliedOffer } = applyBestOffer(productDoc, offerMaps);

      item.product = {
        ...productDoc.toObject(),
        effectivePrice,
        appliedOffer: appliedOffer
          ? {
              _id: appliedOffer._id,
              percentage: appliedOffer.percentage,
              amount: appliedOffer.amount,
              type: appliedOffer.type,
            }
          : null,
      };

      subtotal += productDoc.price * item.quantity;
      productDiscount += (productDoc.price - effectivePrice) * item.quantity;
      totalAfterProductDisc += effectivePrice * item.quantity;
    });

    await cart.populate({
      path: 'coupon',
      select: 'code discountType discountValue maxDiscountAmount'
    });
    let couponDiscount = 0;
    if (cart.coupon) {
      couponDiscount = cart.discount || 0;
      totalAfterCoupon = Math.max(0, totalAfterProductDisc - couponDiscount);
    } else {
      totalAfterCoupon = totalAfterProductDisc;
    }

    tax = parseFloat((totalAfterCoupon * TAX_RATE).toFixed(2));

    shipping = totalAfterProductDisc >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    grandTotal = parseFloat((totalAfterCoupon + tax + shipping).toFixed(2));
    calculateCartTotals(cart);
    // applyCoupon();
    res.json({
      cartItems: availableCartItems,
      count: availableCartItems.length,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        productDiscount: parseFloat(productDiscount.toFixed(2)),
        couponDiscount: parseFloat(couponDiscount.toFixed(2)),
        tax,
        shipping,
        total: grandTotal
      },
      coupon: cart.coupon ? {
        code: cart.coupon.code,
        discountType: cart.coupon.discountType,
        discountValue: cart.coupon.discountValue,
        maxDiscountAmount: cart.coupon.maxDiscountAmount
      } : null
    });
  } catch (err) {
    console.error('Error fetching cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user;
    
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { 
        $set: { 
          items: [],
          coupon: null,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0 
        } 
      },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Cart cleared successfully',
      cart
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error while clearing cart' });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    ("Applying coupon to cart:", req.body.code);
    const { code } = req.body;
    const userId = req.user;

    const userIdStr = userId.toString();

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true
    });

    ("Coupon found:", coupon ? {
      code: coupon.code,
      isActive: coupon.isActive,
      startDate: coupon.startDate,
      expiryDate: coupon.expiryDate,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      currentTime: new Date(),
      isBeforeStart: new Date() < new Date(coupon.startDate),
      isAfterExpiry: new Date() > new Date(coupon.expiryDate)
    } : 'No active coupon found with this code');

    if (!coupon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or inactive coupon code' 
      });
    }

    if (coupon && coupon.usedBy.some(id => id.toString() === userIdStr)) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this coupon'
      });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (cart) {
      const subtotal = cart.items.reduce((sum, item) => {
        const price = item.product.discountedPrice || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      if (subtotal < coupon.minPurchaseAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required to use this coupon`,
          minPurchaseAmount: coupon.minPurchaseAmount,
          currentSubtotal: subtotal
        });
      }
    }

    const prodIds = cart.items.map(it => it.product._id);
    const catIds = cart.items.map(it => it.product.category?._id).filter(Boolean);
    const offerMaps = await fetchActiveOffers(prodIds, catIds);

    let subtotal = 0;
    let productDiscount = 0;
    let totalAfterProductDisc = 0;
    let totalAfterCoupon = 0; // before tax & shipping
    let tax = 0;
    let shipping = 0;
    let grandTotal = 0;

    cart.items.forEach(item => {
      const { effectivePrice } = applyBestOffer(item.product, offerMaps);
      subtotal += item.product.price * item.quantity;
      productDiscount += (item.product.price - effectivePrice) * item.quantity;
      totalAfterProductDisc += effectivePrice * item.quantity;
    });

    if (subtotal < coupon.minPurchaseAmount) {
      ('Minimum purchase amount not met');
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required to use this coupon`
      });
    }

    let couponDiscount = 0;
    if (coupon.discountType === 'percentage') {
      couponDiscount = (totalAfterProductDisc * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
        couponDiscount = coupon.maxDiscountAmount;
      }
    } else {
      couponDiscount = Math.min(coupon.discountValue, totalAfterProductDisc);
    }

    totalAfterCoupon = Math.max(0, totalAfterProductDisc - couponDiscount);

    tax = parseFloat((totalAfterCoupon * TAX_RATE).toFixed(2));

    shipping = totalAfterProductDisc >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    grandTotal = parseFloat((totalAfterCoupon + tax + shipping).toFixed(2));

    cart.coupon = coupon._id;
    cart.discount = couponDiscount;
    cart.tax = tax;
    cart.shipping = shipping;
    cart.total = grandTotal;
    
    await cart.save();

    await cart.populate('coupon');

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount
      },
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        productDiscount: parseFloat(productDiscount.toFixed(2)),
        couponDiscount: parseFloat(couponDiscount.toFixed(2)),
        tax,
        shipping,
        total: grandTotal
      }
    });

  } catch (error) {
    (
      'hier'
    );
    
    console.error('Error applying coupon:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while applying coupon' 
    });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    const userId = req.user;
    
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product');

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }

    if (!cart.coupon) {
      return res.status(400).json({
        success: false,
        message: 'No coupon is currently applied to this cart'
      });
    }

    const prodIds = cart.items.map(it => it.product._id);
    const catIds = cart.items.map(it => it.product.category?._id).filter(Boolean);
    const offerMaps = await fetchActiveOffers(prodIds, catIds);

    let subtotal = 0;
    let productDiscount = 0;
    let totalAfterProductDisc = 0;
    let totalAfterCoupon = 0; // before tax & shipping
    let tax = 0;
    let shipping = 0;
    let grandTotal = 0;

    cart.items.forEach(it => {
      const { effectivePrice } = applyBestOffer(it.product, offerMaps);
      subtotal += it.product.price * it.quantity;
      productDiscount += (it.product.price - effectivePrice) * it.quantity;
      totalAfterProductDisc += effectivePrice * it.quantity;
    });

    totalAfterCoupon = totalAfterProductDisc;

    tax = parseFloat((totalAfterCoupon * TAX_RATE).toFixed(2));

    shipping = totalAfterProductDisc >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    grandTotal = parseFloat((totalAfterCoupon + tax + shipping).toFixed(2));

    cart.coupon = undefined;
    cart.discount = 0;
    cart.tax = tax;
    cart.shipping = shipping;
    cart.total = grandTotal;
    
    await cart.save();

    res.json({
      success: true,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        productDiscount: parseFloat(productDiscount.toFixed(2)),
        couponDiscount: 0,
        tax,
        shipping,
        total: grandTotal
      }
    });

  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while removing coupon' 
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gte: new Date() },
      $or: [
        { maxUses: { $exists: false } },
        { maxUses: { $gt: 0 } }
      ]
    });

    if (!coupon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired coupon code' 
      });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (cart) {
      const subtotal = cart.items.reduce((sum, item) => {
        const price = item.product.discountedPrice || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      if (subtotal < coupon.minPurchaseAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required to use this coupon`,
          minPurchaseAmount: coupon.minPurchaseAmount,
          currentSubtotal: subtotal
        });
      }
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minPurchaseAmount: coupon.minPurchaseAmount
      }
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while validating coupon' 
    });
  }
};

export const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user;
    
    // Calculate current cart subtotal (after offers but before coupons)
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: ['category', 'brand'],
    });

    let subtotal = 0;
    if (cart && cart.items.length) {
      // Apply best offer pricing (re-using existing helper)
      const prodIds = cart.items.map((it) => it.product._id);
      const catIds = cart.items.map((it) => it.product.category?._id).filter(Boolean);
      const offerMaps = await fetchActiveOffers(prodIds, catIds);

      cart.items.forEach((it) => {
        const { effectivePrice } = applyBestOffer(it.product, offerMaps);
        subtotal += effectivePrice * it.quantity;
      });
    }

    const now = new Date();

    const rawCoupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
      $or: [
        { maxUses: { $exists: false } },
        { $expr: { $gt: ['$maxUses', '$usedCount'] } },
      ],
      usedBy: { $nin: [userId] },
    }).select('code discountType discountValue minPurchaseAmount maxDiscountAmount description expiryDate');

    // Separate eligible vs ineligible based on minPurchaseAmount
    const coupons = rawCoupons.map((c) => ({
      _id: c._id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountAmount: c.maxDiscountAmount,
      minPurchaseAmount: c.minPurchaseAmount,
      description: c.description || 'coupon says',
      expiryDate: c.expiryDate,
      eligible: subtotal >= c.minPurchaseAmount,
    }));

    res.json({ success: true, coupons, cartSubtotal: subtotal });
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching coupons' });
  }
};
