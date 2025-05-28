import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    size: {
      type: String,
      required: true
    },
    stock: {
      type: Number
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { timestamps: true });

// Create a compound index to ensure a user can't add the same product variant multiple times
// Instead, the quantity will be updated
cartItemSchema.index({ user: 1, product: 1, 'variant.size': 1 }, { unique: true });

const cartModel = mongoose.model('CartItem', cartItemSchema);

export default cartModel;
