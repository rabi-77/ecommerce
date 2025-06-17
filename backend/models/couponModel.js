import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
      validate: {
        validator: function(value) {
          return this.discountType !== 'percentage' || value > 0;
        },
        message: 'Max discount amount is required for percentage discounts',
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value > this.startDate;
        },
        message: 'Expiry date must be after start date',
      },
    },
    maxUses: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Track users who already redeemed this coupon
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
couponSchema.index({ code: 1, isActive: 1 });

// Pre-save hook to ensure maxDiscountAmount is set for percentage discounts
couponSchema.pre('save', function(next) {
  if (this.discountType === 'percentage' && !this.maxDiscountAmount) {
    throw new Error('Max discount amount is required for percentage discounts');
  }
  next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    this.startDate <= now &&
    this.expiryDate >= now &&
    (this.maxUses === null || this.usedCount < this.maxUses)
  );
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(amount) {
  if (amount < this.minPurchaseAmount) {
    throw new Error(`Minimum purchase amount of ${this.minPurchaseAmount} required`);
  }

  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (amount * this.discountValue) / 100;
    discount = Math.min(discount, this.maxDiscountAmount);
  } else {
    discount = Math.min(this.discountValue, amount);
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
