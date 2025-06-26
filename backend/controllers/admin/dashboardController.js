import asyncHandler from 'express-async-handler';
import Order from '../../models/orderModel.js';
import Product from '../../models/productModel.js';
import Category from '../../models/categoryModel.js';
import Brand from '../../models/brandModel.js';
import PDFDocument from 'pdfkit';

// util copied from manageSalesReport
export const buildDateMatch = (range = 'today', from, to) => {
  const match = {};
  switch (range) {
    case 'today': {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      match.$gte = start;
      match.$lte = end;
      break;
    }
    case 'week': {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - 6));
      start.setHours(0, 0, 0, 0);
      match.$gte = start;
      match.$lte = new Date();
      break;
    }
    case 'month': {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      match.$gte = start;
      match.$lte = new Date();
      break;
    }
    case 'year': {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      match.$gte = start;
      match.$lte = new Date();
      break;
    }
    case 'custom': {
      if (from && to) {
        match.$gte = new Date(from);
        match.$lte = new Date(to);
      }
      break;
    }
    default:
      break;
  }
  return match;
};

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { range = 'today', from, to, format } = req.query;

  const dateMatch = buildDateMatch(range, from, to);
  const orderMatch = {
    isPaid: true,
    status: { $nin: ['cancelled', 'returned', 'payment_failed'] },
  };
  if (dateMatch.$gte) {
    orderMatch.createdAt = dateMatch;
  }

  // Base pipeline to get sale items (excluding cancelled/returned items)
  const basePipeline = [
    { $match: orderMatch },
    { $unwind: '$items' },
    {
      $match: {
        'items.isCancelled': { $ne: true },
        'items.isReturned': { $ne: true },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
  ];

  // --------- Top Products ---------
  const topProducts = await Order.aggregate([
    ...basePipeline,
    {
      $group: {
        _id: '$product._id',
        name: { $first: '$product.name' },
        image: { $first: { $arrayElemAt: ['$product.images', 0] } },
        totalQty: { $sum: '$items.quantity' },
        totalSales: { $sum: '$items.totalPrice' },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: 10 },
  ]);

  // --------- Top Categories ---------
  const topCategories = await Order.aggregate([
    ...basePipeline,
    {
      $group: {
        _id: '$product.category',
        totalQty: { $sum: '$items.quantity' },
      },
    },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: '$category._id', name: '$category.name', totalQty: 1 } },
    { $sort: { totalQty: -1 } },
    { $limit: 10 },
  ]);

  // --------- Top Brands ---------
  const topBrands = await Order.aggregate([
    ...basePipeline,
    {
      $group: {
        _id: '$product.brand',
        totalQty: { $sum: '$items.quantity' },
      },
    },
    { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brand' } },
    { $unwind: '$brand' },
    { $project: { _id: '$brand._id', name: '$brand.name', totalQty: 1 } },
    { $sort: { totalQty: -1 } },
    { $limit: 10 },
  ]);

  // --------- Ledger (simple) ---------
  const ledger = await Order.aggregate([
    { $match: orderMatch },
    {
      $project: {
        _id: 0,
        orderNumber: 1,
        date: '$createdAt',
        amount: '$totalPrice',
        paymentMethod: 1,
      },
    },
    { $sort: { date: -1 } },
  ]);

  // If client requests PDF ledger, stream it and return early
  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ledger.pdf"');
    doc.pipe(res);

    doc.fontSize(16).text('Ledger Book', { align: 'center' });
    doc.moveDown();

    const headers = ['Date', 'Order', 'Amount', 'Method'];
    const colWidths = [100, 120, 100, 100];
    let x = doc.x;
    headers.forEach((h, idx) => {
      doc.fontSize(10).text(h, x, doc.y, { width: colWidths[idx], continued: idx !== headers.length - 1 });
    });
    doc.moveDown();

    ledger.forEach((l) => {
      x = doc.x;
      const row = [
        new Date(l.date).toLocaleDateString(),
        l.orderNumber,
        l.amount.toFixed(2),
        l.paymentMethod,
      ];
      row.forEach((cell, idx) => {
        doc.fontSize(9).text(cell, x, doc.y, { width: colWidths[idx], continued: idx !== row.length - 1 });
      });
      doc.moveDown();
    });

    doc.end();
    return;
  }

  res.json({ range, from, to, topProducts, topCategories, topBrands, ledger });
});

export default { getDashboardStats };
