import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PRODUCT', 'CATEGORY'],
    required: true,
  },
  percentage: {
    type: Number,
    min: 1,
    max: 100,
  },
  amount: {
    type: Number,
    min: 1,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  validateBeforeSave: true,
});

// Ensure at least one of percentage or amount is present
offerSchema.pre('validate', function (next) {
  if (!this.percentage && !this.amount) {
    this.invalidate('percentage', 'Offer must have either percentage or amount discount');
  }
  next();
});

// Compound index to speed look-ups
offerSchema.index({ type: 1, product: 1, category: 1, isActive: 1 });

export default mongoose.model('Offer', offerSchema);
