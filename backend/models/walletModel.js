import mongoose from 'mongoose';
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    amount: { type: Number, required: true },
    description: String,
    source: { type: String, enum: ['refund', 'order', 'topup', 'admin','REFERRAL'], default: 'refund' },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    balanceAfter: Number,
  },
  { timestamps: true }
);

const walletSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    balance: { type: Number, default: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Wallet', walletSchema);
