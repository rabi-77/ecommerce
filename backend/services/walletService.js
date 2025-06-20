import mongoose from 'mongoose';
import Wallet from '../models/walletModel.js';

export async function creditWallet(userId, amount, { orderId = null, source = 'refund', description = '' } = {}) {
  if (amount <= 0) return;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true, session }
    );

    wallet.transactions.push({
      type: 'CREDIT',
      amount,
      description,
      source,
      order: orderId,
      balanceAfter: wallet.balance,
    });

    await wallet.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function debitWallet(userId, amount, { orderId = null, source = 'order', description = '' } = {}) {
  if (amount <= 0) return;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'DEBIT',
      amount,
      description,
      source,
      order: orderId,
      balanceAfter: wallet.balance,
    });
    await wallet.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function getWallet(userId) {
  const wallet = await Wallet.findOne({ user: userId }) || { balance: 0, transactions: [] };
  if (wallet.transactions && wallet.transactions.length) {
    wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
  }
  return wallet;
}
