import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
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
    stock: Number,
    _id: mongoose.Schema.Types.ObjectId
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  isReturned: {
    type: Boolean,
    default: false
  },
  returnRequestStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', ''],
    default: ''
  },
  cancellationReason: String,
  returnReason: String,
  cancellationDate: Date,
  returnDate: Date,
  returnRequestDate: Date
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: {
        type: String,
        required: true
      },
      phoneNumber: {
        type: String,
        required: true
      },
      alternativePhoneNumber: String,
      addressLine1: {
        type: String,
        required: true
      },
      addressLine2: String,
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true,
        default: 'India'
      }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['COD'], 
      default: 'COD'
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
      razorpayOrderId:String,
      razorpayPaymentId:String,
      razorpaySignature:String
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0.0
    },
    
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      required: true,
      default: false
    },
    deliveredAt: Date,
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'shipped', 'out for delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    },
    trackingNumber: String,
    notes: String,
    cancellationReason: String,
    returnReason: String,
    returnDate: Date,
    returnRequestStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', ''],
      default: ''
    },
    returnRequestDate: Date,
    invoice: {
      url: String,
      generatedAt: Date
    }
  },
  {
    timestamps: true
  }
);

// // Generate a unique order ID (e.g., ORD12345678)
// orderSchema.pre('save', async function(next) {
//   if (this.isNew && !this.orderNumber) {
//     try {
//       // Get current date components for the order number prefix
//       const now = new Date();
//       const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
//       const month = String(now.getMonth() + 1).padStart(2, '0');
//       const day = String(now.getDate()).padStart(2, '0');
      
//       // Create a timestamp-based unique ID instead of counting documents
//       const timestamp = now.getTime().toString().slice(-6); // Last 6 digits of timestamp
//       const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
//       // Format: ORD-YYMMDD-XXXXXX-RRR (timestamp + random number for uniqueness)
//       this.orderNumber = `ORD-${year}${month}${day}-${timestamp}-${random}`;
//     } catch (error) {
//       return next(error);
//     }
//   }
//   next();
// });

const Order = mongoose.model('Order', orderSchema);

export default Order;
