import Cart from '../models/cartModel.js';
import productModel from '../models/productModel.js';
import wishlistModel from '../models/wishlistModel.js';
import Coupon from '../models/couponModel.js';
import { fetchActiveOffers, applyBestOffer } from '../services/offerService.js';

const MAX_QUANTITY_PER_PRODUCT = 10;

const calculateCartTotals = async (cart) => {
  let subtotal = 0;
  let productDiscount = 0;
  let couponDiscount = 0;
  let total = 0;

  cart.items.forEach(item => {
    const itemPrice = item.product.price;
    const itemDisc = item.product.discount || 0;
    const discountedPrice = itemPrice * (1 - itemDisc / 100);
    
    subtotal += itemPrice * item.quantity;
    productDiscount += (itemPrice - discountedPrice) * item.quantity;
    total += discountedPrice * item.quantity;
  });

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
      
      cart.items[existingItemIndex].quantity = newVariantQuantity;
      cart.items[existingItemIndex].variant.stock = variant.stock; // Update stock info
    } else {
      if (totalProductQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      cart.items.push({
        product: productId,
        variant: {
          size: size,
          stock: variant.stock
        },
        quantity
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
      populatedCart.total = 0;
      await populatedCart.save();
    } else {
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
    let total = 0;

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
      total += effectivePrice * item.quantity;
    });

    await cart.populate({
      path: 'coupon',
      select: 'code discountType discountValue maxDiscountAmount'
    });
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
    console.log("Applying coupon to cart:", req.body.code);
    const { code } = req.body;
    const userId = req.user;

    const now = new Date();
    console.log("Current server time:", now);

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

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has reached its maximum usage limit'
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
    cart.items.forEach(item => {
      const { effectivePrice } = applyBestOffer(item.product, offerMaps);
      subtotal += effectivePrice * item.quantity;
    });

    if (subtotal < coupon.minPurchaseAmount) {
      console.log('Minimum purchase amount not met');
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required to use this coupon`
      });
    }

    let couponDiscount = 0;
    if (coupon.discountType === 'percentage') {
      couponDiscount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
        couponDiscount = coupon.maxDiscountAmount;
      }
    } else {
      couponDiscount = Math.min(coupon.discountValue, subtotal);
    }

    cart.coupon = coupon._id;
    cart.discount = couponDiscount;
    cart.total = subtotal - couponDiscount;
    
    await cart.save();

    await cart.populate('coupon');

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
        message: 'Invalidm or expired coupon code' 
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
