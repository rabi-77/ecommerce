import Coupon from '../../models/couponModel.js';
import { validationResult } from 'express-validator';
import Cart from '../../models/cartModel.js';

export const validateAndApplyCoupon = async (req, res) => {
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
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    if (subtotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required to use this coupon`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    cart.coupon = coupon._id;
    cart.discount = discount;
    cart.total = subtotal - discount;
    
    await cart.save();

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount
      },
      discount,
      total: cart.total
    });

  } catch (error) {
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
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cart not found' 
      });
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    cart.coupon = undefined;
    cart.discount = 0;
    cart.total = subtotal;
    
    await cart.save();

    res.json({
      success: true,
      total: cart.total
    });

  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while removing coupon' 
    });
  }
};

export const getCouponDetails = async (req, res) => {
  try {
    const { code } = req.params;
    
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gte: new Date() },
      $or: [
        { maxUses: { $exists: false } },
        { maxUses: { $gt: 0 } }
      ]
    }).select('-__v');

    if (!coupon) {
      return res.status(404).json({ 
        success: false, 
        message: 'Coupon not found or expired' 
      });
    }

    res.json({
      success: true,
      coupon
    });

  } catch (error) {
    console.error('Error getting coupon details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching coupon details' 
    });
  }
};
