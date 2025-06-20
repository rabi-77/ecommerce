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
  };
  if (dateMatch.$gte) {
    matchStage.createdAt = dateMatch;
  }

  // Aggregate sales data
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

  // If no orders, set defaults
  const data = summary || {
    totalOrders: 0,
    totalSales: 0,
    totalProductDiscount: 0,
    totalCouponDiscount: 0,
    totalDiscount: 0,
    grossSales: 0,
  };

  if (format === 'pdf') {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();
    Object.entries(data).forEach(([k,v])=>{
      doc.fontSize(12).text(`${k.replace(/([A-Z])/g,' $1')}: ${v}`);
    });
    doc.end();
    return;
  }

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');
    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 15 },
    ];
    Object.entries(data).forEach(([k,v])=>{
      sheet.addRow({ metric: k, value: v });
    });
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename=sales-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  res.json({ range, from, to, data });
});

export default { getSalesReport };
