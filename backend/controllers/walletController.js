import asyncHandler from 'express-async-handler';
import { getWallet } from '../services/walletService.js';

export const getWalletBalance = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const walletData = await getWallet(req.user, { page, limit });
  res.json({ success: true, ...walletData });
});
