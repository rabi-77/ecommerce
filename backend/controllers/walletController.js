import asyncHandler from 'express-async-handler';
import { getWallet } from '../services/walletService.js';

export const getWalletBalance = asyncHandler(async (req, res) => {
  const wallet = await getWallet(req.user);
  res.json({ success: true, wallet });
});
