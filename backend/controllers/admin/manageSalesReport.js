import asyncHandler from "express-async-handler";
import Order from "../../models/orderModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const buildDateMatch = (range, from, to) => {
  const match = {};
  switch (range) {
    case 'today': {
      const start = new Date();
      start.setHours(0,0,0,0);
      const end = new Date();
      end.setHours(23,59,59,999);
      match.$gte = start;
      match.$lte = end;
      break;
    }
    case 'week': {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - 6));
      start.setHours(0,0,0,0);
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

export const getSalesReport = asyncHandler(async (req, res) => {
  const { range = 'today', from, to, format } = req.query;

  const dateMatch = buildDateMatch(range, from, to);

  const matchStage = {
    isPaid: true,
    status: { $nin: ['cancelled', 'returned','payment_failed'] },
  };
  if (dateMatch.$gte) {
    matchStage.createdAt = dateMatch;
  }

  
  const [summary] = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: { $sum: "$totalPrice" },
        totalProductDiscount: { $sum: "$discountAmount" },
        totalCouponDiscount: { $sum: "$couponDiscount" },
      },
    },
    {
      $addFields: {
        totalDiscount: { $add: ["$totalProductDiscount", "$totalCouponDiscount"] },
        grossSales: { $add: ["$totalSales", { $add: ["$totalProductDiscount", "$totalCouponDiscount"] }] },
      },
    },
  ]);

  
  const data = summary || {
    totalOrders: 0,
    totalSales: 0,
    totalProductDiscount: 0,
    totalCouponDiscount: 0,
    totalDiscount: 0,
    grossSales: 0,
  };

  const orders = await Order.find(matchStage)
    .select('orderNumber itemsPrice discountAmount couponDiscount taxPrice shippingPrice totalPrice paymentMethod isPaid paidAt')
    .sort({ createdAt: -1 });

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);

    // Heading
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();

    // Summary table
    Object.entries(data).forEach(([k, v]) => {
      doc.fontSize(12).text(`${k.replace(/([A-Z])/g, ' $1')}: ${v}`);
    });

    // Order details header
    doc.moveDown(1).fontSize(14).text('Paid Orders', { underline: true });
    doc.moveDown(0.5);

    // Column titles
    const headers = ['Order ID', 'Subtotal', 'ProdDisc', 'CouponDisc', 'Tax', 'Shipping', 'Total', 'Payment', 'PaidAt'];
    const colWidths = [90, 60, 60, 70, 50, 60, 60, 60, 80];
    let x = doc.x;
    headers.forEach((h, idx) => {
      doc.fontSize(10).text(h, x, doc.y, { width: colWidths[idx], continued: idx !== headers.length - 1 });
      x += colWidths[idx];
    });
    doc.moveDown(0.5);

    // Rows
    orders.forEach((o) => {
      x = doc.x;
      const row = [
        o.orderNumber,
        o.itemsPrice.toFixed(2),
        o.discountAmount.toFixed(2),
        o.couponDiscount.toFixed(2),
        o.taxPrice.toFixed(2),
        o.shippingPrice.toFixed(2),
        o.totalPrice.toFixed(2),
        o.paymentMethod,
        o.paidAt ? new Date(o.paidAt).toLocaleDateString() : ''
      ];
      row.forEach((cell, idx) => {
        doc.fontSize(9).text(String(cell), x, doc.y, { width: colWidths[idx], continued: idx !== row.length - 1 });
        x += colWidths[idx];
      });
      doc.moveDown(0.2);
    });

    doc.end();
    return;
  }

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    Object.entries(data).forEach(([k, v]) => {
      summarySheet.addRow({ metric: k, value: v });
    });

    // Orders Sheet
    const orderSheet = workbook.addWorksheet('Paid Orders');
    orderSheet.columns = [
      { header: 'Order ID', key: 'orderNumber', width: 25 },
      { header: 'Subtotal', key: 'itemsPrice', width: 15 },
      { header: 'Product Discount', key: 'discountAmount', width: 18 },
      { header: 'Coupon Discount', key: 'couponDiscount', width: 18 },
      { header: 'Tax', key: 'taxPrice', width: 12 },
      { header: 'Shipping', key: 'shippingPrice', width: 15 },
      { header: 'Total', key: 'totalPrice', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Paid At', key: 'paidAt', width: 20 },
    ];
    orders.forEach((o) => {
      orderSheet.addRow({
        orderNumber: o.orderNumber,
        itemsPrice: o.itemsPrice,
        discountAmount: o.discountAmount,
        couponDiscount: o.couponDiscount,
        taxPrice: o.taxPrice,
        shippingPrice: o.shippingPrice,
        totalPrice: o.totalPrice,
        paymentMethod: o.paymentMethod,
        paidAt: o.paidAt ? o.paidAt.toISOString().slice(0, 10) : ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  
  res.json({ range, from, to, summary: data, orders });
});

export default { getSalesReport };
