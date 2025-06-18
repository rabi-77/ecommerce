import Cart from '../models/cartModel.js';
import productModel from '../models/productModel.js';
import wishlistModel from '../models/wishlistModel.js';
import Coupon from '../models/couponModel.js';
import { fetchActiveOffers, applyBestOffer } from '../services/offerService.js';

// Maximum quantity allowed per product (across all variants)
const MAX_QUANTITY_PER_PRODUCT = 10;

// Helper function to calculate cart totals with coupon support
const calculateCartTotals = async (cart) => {
  let subtotal = 0;
  let productDiscount = 0;
  let couponDiscount = 0;
  let total = 0;

  // Calculate subtotal and product-level discounts
  cart.items.forEach(item => {
    const itemPrice = item.product.price;
    const itemDisc = item.product.discount || 0;
    const discountedPrice = itemPrice * (1 - itemDisc / 100);
    
    subtotal += itemPrice * item.quantity;
    productDiscount += (itemPrice - discountedPrice) * item.quantity;
    total += discountedPrice * item.quantity;
  });

  // Apply coupon discount if exists
  if (cart.coupon) {
    const coupon = await Coupon.findById(cart.coupon);
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        couponDiscount = (total * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
        }
      } else {
        couponDiscount = Math.min(coupon.discountValue, total);
      }
      total = Math.max(0, total - couponDiscount);
    }
  }

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    productDiscount: parseFloat(productDiscount.toFixed(2)),
    couponDiscount: parseFloat(couponDiscount.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, size, quantity = 1 } = req.body;
    const userId = req.user;

    // Check if product exists
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

    // Check if the variant exists and has stock
    const variant = product.variants.find(v => v.size === size);
    if (!variant) {
      return res.status(400).json({ message: "Selected size is not available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    // Find or create user's cart
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

    // Calculate total quantity of this product in cart (across all variants)
    const productItems = cart.items.filter(item => item.product.toString() === productId);
    let totalProductQuantity = productItems.reduce((total, item) => total + item.quantity, 0);

    // Check if item already exists in cart with this specific variant
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant.size === size
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newVariantQuantity = cart.items[existingItemIndex].quantity + quantity;
      const newTotalQuantity = totalProductQuantity + quantity;
      
      // Check if new quantity exceeds stock for this variant
      if (newVariantQuantity > variant.stock) {
        return res.status(400).json({ message: `Cannot add more items. Only ${variant.stock} available in this size.` });
      }
      
      // Check if new total quantity exceeds maximum allowed per product
      if (newTotalQuantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      cart.items[existingItemIndex].quantity = newVariantQuantity;
      cart.items[existingItemIndex].variant.stock = variant.stock; // Update stock info
    } else {
      // Check if adding this item would exceed the max quantity per product
      if (totalProductQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      // Add new item to cart
      cart.items.push({
        product: productId,
        variant: {
          size: size,
          stock: variant.stock
        },
        quantity
      });
    }

    // Save the cart
    await cart.save();

    // Remove from wishlist if it exists there
    await wishlistModel.findOneAndDelete({ user: userId, product: productId });

    // Populate cart for response
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

    // Calculate cart totals with coupon support
    const totals = await calculateCartTotals(populatedCart);

    // Update cart with calculated totals
    populatedCart.discount = totals.couponDiscount;
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

    // Get the product to check stock and availability
    const product = await productModel.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product is still available
    if (!product.isListed || product.isDeleted) {
      return res.status(400).json({ message: "Product is no longer available" });
    }

    // Check if product's category is still active
    const categoryPopulated = await product.populate('category');
    if (categoryPopulated.category && (!categoryPopulated.category.isListed || categoryPopulated.category.isDeleted)) {
      return res.status(400).json({ message: "Product category is not available" });
    }
    const brandPopulated = await product.populate('brand');
    if (brandPopulated.brand && (!brandPopulated.brand.isListed || brandPopulated.brand.isDeleted)) {
      return res.status(400).json({ message: "Product brand is not available" });
    }
    // Check if the variant has enough stock
    const variant = product.variants.find(v => v.size === cartItem.variant.size);
    if (!variant) {
      return res.status(400).json({ message: "Product variant no longer available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    // Calculate total quantity of this product in cart (across all variants)
    const productItems = cart.items.filter(
      item => item.product.toString() === cartItem.product.toString() && item._id.toString() !== cartItemId
    );
    const otherVariantsQuantity = productItems.reduce((total, item) => total + item.quantity, 0);
    
    // Check if new total quantity exceeds maximum allowed per product
    if (otherVariantsQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
      return res.status(400).json({ 
        message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
      });
    }

    // Update the quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].variant.stock = variant.stock; // Update stock info

    await cart.save();

    // Populate cart for response
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

    // Calculate cart totals with coupon support
    const totals = await calculateCartTotals(populatedCart);

    // Update cart with calculated totals
    populatedCart.discount = totals.couponDiscount;
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
        total: totals.total
      }
    });
  } catch (err) {
    console.error('Error updating cart item:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Remove item from cart
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

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate cart for response
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

    // Calculate cart totals with coupon support
    const totals = await calculateCartTotals(populatedCart);

    // If cart is empty, remove any applied coupon
    if (populatedCart.items.length === 0 && populatedCart.coupon) {
      populatedCart.coupon = null;
      populatedCart.discount = 0;
      populatedCart.total = 0;
      await populatedCart.save();
    } else {
      // Update cart with calculated totals
      populatedCart.discount = totals.couponDiscount;
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
        total: totals.total
      }
    });
  } catch (err) {
    console.error('Error removing from cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user;
    
    // Find the user's cart
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name isListed isDeleted' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      });

    // If no cart exists, return empty cart
    if (!cart) {
      return res.json({
        cartItems: [],
        count: 0,
        summary: {
          subtotal: 0,
          productDiscount: 0,
          couponDiscount: 0,
          total: 0
        }
      });
    }

    // Filter out products that are no longer available or whose category is not available
    const availableCartItems = cart.items.filter(item => {
      const product = item.product;
      if (!product) return false; // Skip if product was deleted
      
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

    // Collect product & category ids present in cart to fetch relevant offers
    const productIds = availableCartItems.map(it => it.product._id);
    const categoryIds = availableCartItems
      .map(it => it.product.category?._id)
      .filter(Boolean);

    // Fetch active offers for these ids
    const offerMaps = await fetchActiveOffers(productIds, categoryIds);

    let subtotal = 0;
    let productDiscount = 0;
    let total = 0;

    availableCartItems.forEach(item => {
      const productDoc = item.product;
      const { effectivePrice, appliedOffer } = applyBestOffer(productDoc, offerMaps);

      // attach computed fields for frontend
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
      total += effectivePrice * item.quantity;
    });

    // populate coupon for response
    await cart.populate({
      path: 'coupon',
      select: 'code discountType discountValue maxDiscountAmount'
    });

    // If coupon already applied, use stored values
    let couponDiscount = 0;
    if (cart.coupon) {
      couponDiscount = cart.discount || 0;
      total = cart.total || total - couponDiscount;
    }

    res.json({
      cartItems: availableCartItems,
      count: availableCartItems.length,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        productDiscount: parseFloat(productDiscount.toFixed(2)),
        couponDiscount: parseFloat(couponDiscount.toFixed(2)),
        total: parseFloat(total.toFixed(2))
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

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user;
    
    // Find and update cart
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { 
        $set: { 
          items: [],
          coupon: null,
          discount: 0,
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

// Apply coupon to cart
export const applyCoupon = async (req, res) => {
  try {
    console.log("Applying coupon to cart:", req.body.code);
    const { code } = req.body;
    const userId = req.user;

    // Get current date in local time
    const now = new Date();
    console.log("Current server time:", now);

    // Find the coupon by code first
    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true
    });

    console.log("Coupon found:", coupon ? {
      code: coupon.code,
      isActive: coupon.isActive,
      startDate: coupon.startDate,
      expiryDate: coupon.expiryDate,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      currentTime: now,
      isBeforeStart: now < new Date(coupon.startDate),
      isAfterExpiry: now > new Date(coupon.expiryDate)
    } : 'No active coupon found with this code');

    if (!coupon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or inactive coupon code' 
      });
    }

    if(coupon.usedBy&&coupon.usedBy.some(id=>id.toString()===userId.toString())){
      return res.status(400).json({success:false,message:"you have already used this coupon"})
    }

    // Check if coupon is within valid date range
    const startDate = new Date(coupon.startDate);
    const expiryDate = new Date(coupon.expiryDate);
    
    if (now < startDate) {
      return res.status(400).json({
        success: false,
        message: `This coupon is not valid until ${startDate.toLocaleDateString()}`
      });
    }

    if (now > expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has expired'
      });
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has reached its maximum usage limit'
      });
    }

    // Get user's cart to check minimum purchase amount
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

    // Fetch offers relevant to items
    const prodIds = cart.items.map(it => it.product._id);
    const catIds = cart.items.map(it => it.product.category?._id).filter(Boolean);
    const offerMaps = await fetchActiveOffers(prodIds, catIds);

    // Calculate subtotal using effective price after offers
    let subtotal = 0;
    cart.items.forEach(item => {
      const { effectivePrice } = applyBestOffer(item.product, offerMaps);
      subtotal += effectivePrice * item.quantity;
    });

    // Check minimum purchase amount
    if (subtotal < coupon.minPurchaseAmount) {
      console.log('Minimum purchase amount not met');
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required to use this coupon`
      });
    }

    // Calculate coupon discount
    let couponDiscount = 0;
    if (coupon.discountType === 'percentage') {
      couponDiscount = (subtotal * coupon.discountValue) / 100;
      // Apply max discount if set
      if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
        couponDiscount = coupon.maxDiscountAmount;
      }
    } else {
      // Fixed amount
      couponDiscount = Math.min(coupon.discountValue, subtotal);
    }

    // Update cart with coupon
    cart.coupon = coupon._id;
    cart.discount = couponDiscount;
    cart.total = subtotal - couponDiscount;
    
    await cart.save();

    // Populate the coupon details for the response
    await cart.populate('coupon');

    // compute product-level discount again for summary
    let productDiscount = 0;
    cart.items.forEach(item => {
      const { effectivePrice } = applyBestOffer(item.product, offerMaps);
      productDiscount += (item.product.price - effectivePrice) * item.quantity;
    });

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
        total: parseFloat((subtotal - couponDiscount).toFixed(2))
      }
    });

  } catch (error) {
    console.log(
      'hier'
    );
    
    console.error('Error applying coupon:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while applying coupon' 
    });
  }
};

// Remove coupon from cart
export const removeCoupon = async (req, res) => {
  try {
    const userId = req.user;
    
    // Get user's cart with populated items
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product');

    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }

    // Check if cart has a coupon applied
    if (!cart.coupon) {
      return res.status(400).json({
        success: false,
        message: 'No coupon is currently applied to this cart'
      });
    }

    // Recalculate subtotal using offers
    const prodIds = cart.items.map(it => it.product._id);
    const catIds = cart.items.map(it => it.product.category?._id).filter(Boolean);
    const offerMaps = await fetchActiveOffers(prodIds, catIds);

    let subtotal = 0;
    let productDiscount = 0;
    cart.items.forEach(it => {
      const { effectivePrice } = applyBestOffer(it.product, offerMaps);
      subtotal += effectivePrice * it.quantity;
      productDiscount += (it.product.price - effectivePrice) * it.quantity;
    });

    // Update cart
    cart.coupon = undefined;
    cart.discount = 0;
    cart.total = subtotal;
    
    await cart.save();

    res.json({
      success: true,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        productDiscount: parseFloat(productDiscount.toFixed(2)),
        couponDiscount: 0,
        total: parseFloat(subtotal.toFixed(2))
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

// Validate coupon (for frontend validation)
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user;

    // Find active coupon
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
        message: 'Invalidm or expired coupon code' 
      });
    }

    // Get user's cart to check minimum purchase amount
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

    // Return coupon details if valid
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
