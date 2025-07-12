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
        totalOfferDiscount: { $sum: "$offerDiscount" },
        totalTax: { $sum: "$taxPrice" },
        totalShipping: { $sum: "$shippingPrice" }
      },
    },
    {
      $addFields: {
        totalDiscount: { $add: ["$totalProductDiscount", "$totalCouponDiscount", "$totalOfferDiscount"] },
        grossSales: { $add: ["$totalSales", { $add: ["$totalProductDiscount", "$totalCouponDiscount", "$totalOfferDiscount"] }] },
      },
    },
  ]);

  
  const data = summary || {
    totalOrders: 0,
    totalSales: 0,
    totalProductDiscount: 0,
    totalCouponDiscount: 0,
    totalOfferDiscount: 0,
    totalDiscount: 0,
    grossSales: 0,
    totalTax: 0,
    totalShipping: 0
  };

  const orders = await Order.find(matchStage)
    .select('orderNumber itemsPrice discountAmount couponDiscount offerDiscount taxPrice shippingPrice totalPrice paymentMethod isPaid paidAt')
    .sort({ createdAt: -1 });

  // if (format === 'pdf') {
  //   const doc = new PDFDocument({ margin: 30, size: 'A4' });
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
  //   doc.pipe(res);

  //   // Heading
  //   doc.fontSize(18).text('Sales Report', { align: 'center' });
  //   doc.moveDown();

  //   // Summary table
  //   Object.entries(data).forEach(([k, v]) => {
  //     doc.fontSize(12).text(`${k.replace(/([A-Z])/g, ' $1')}: ${v}`);
  //   });

  //   // Order details header
  //   doc.moveDown(1).fontSize(14).text('Paid Orders', { underline: true });
  //   doc.moveDown(0.5);

  //   // Column titles
  //   const headers = ['Order ID', 'Subtotal', 'ProdDisc', 'CouponDisc', 'OfferDisc', 'Tax', 'Shipping', 'Total', 'Payment', 'PaidAt'];
  //   const colWidths = [90, 60, 60, 70, 70, 50, 60, 60, 60, 80];
  //   let x = doc.x;
  //   headers.forEach((h, idx) => {
  //     doc.fontSize(10).text(h, x, doc.y, { width: colWidths[idx], continued: idx !== headers.length - 1 });
  //     x += colWidths[idx];
  //   });
  //   doc.moveDown(0.5);

  //   // Rows
  //   orders.forEach((o) => {
  //     x = doc.x;
  //     const row = [
  //       o.orderNumber,
  //       o.itemsPrice.toFixed(2),
  //       o.discountAmount.toFixed(2),
  //       o.couponDiscount.toFixed(2),
  //       o.offerDiscount.toFixed(2),
  //       o.taxPrice.toFixed(2),
  //       o.shippingPrice.toFixed(2),
  //       o.totalPrice.toFixed(2),
  //       o.paymentMethod,
  //       o.paidAt ? new Date(o.paidAt).toLocaleDateString() : ''
  //     ];
  //     row.forEach((cell, idx) => {
  //       doc.fontSize(9).text(String(cell), x, doc.y, { width: colWidths[idx], continued: idx !== row.length - 1 });
  //       x += colWidths[idx];
  //     });
  //     doc.moveDown(0.2);
  //   });

  //   doc.end();
  //   return;
  // }

  // if (format === 'pdf') {
  //   // Use A4 landscape for better width
  //   const doc = new PDFDocument({ 
  //     margin: 30, 
  //     size: 'A4',
  //     layout: 'landscape' // Changed to landscape for more horizontal space
  //   });
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
  //   doc.pipe(res);
  
  //   // Title
  //   doc.fontSize(20).font('Helvetica-Bold').text('SALES REPORT', { align: 'center' });
  //   doc.moveDown();
  
  //   // Date range info
  //   doc.fontSize(10).font('Helvetica').text(`Report Period: ${range}${range === 'custom' ? ` (${from} to ${to})` : ''}`, { align: 'center' });
  //   doc.moveDown(1);
  
  //   // ======== SUMMARY SECTION ========
  //   doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
  //   doc.moveDown(0.5);
  
  //   // Filter and format summary data (removed _id and added proper formatting)
  //   const summaryData = [
  //     { label: 'Total Orders', value: data.totalOrders },
  //     { label: 'Gross Sales', value: '₹' + (data.grossSales || 0).toFixed(2) },
  //     { label: 'Total Discount', value: '₹' + (data.totalDiscount || 0).toFixed(2) },
  //     { label: 'Total Tax', value: '₹' + (data.totalTax || 0).toFixed(2) },
  //     { label: 'Total Shipping', value: '₹' + (data.totalShipping || 0).toFixed(2) },
  //     { label: 'Net Sales', value: '₹' + (data.totalSales || 0).toFixed(2) }
  //   ];
  
  //   // Draw summary table
  //   const summaryTableTop = doc.y;
  //   const leftColX = 50;
  //   const rightColX = 300;
  //   const rowHeight = 20;
  
  //   doc.font('Helvetica-Bold').fontSize(10);
  //   doc.text('Metric', leftColX, summaryTableTop);
  //   doc.text('Amount', rightColX, summaryTableTop, { width: 150, align: 'right' });
  
  //   doc.font('Helvetica').fontSize(10);
  //   summaryData.forEach((row, i) => {
  //     const y = summaryTableTop + (i + 1) * rowHeight;
  //     doc.text(row.label, leftColX, y);
  //     doc.text(row.value, rightColX, y, { width: 150, align: 'right' });
  //   });
  
  //   doc.moveDown(2);
  
  //   // ======== ORDER DETAILS SECTION ========
  //   doc.fontSize(14).font('Helvetica-Bold').text('Order Details', { underline: true });
  //   doc.moveDown(0.5);
  
  //   // Column configuration with increased widths
  //   const columns = [
  //     { header: 'Order ID', key: 'orderNumber', width: 120, align: 'left' },
  //     { header: 'Subtotal', key: 'subtotal', width: 80, align: 'right' },
  //     { header: 'Product Discount', key: 'prodDisc', width: 90, align: 'right' },
  //     { header: 'Coupon Discount', key: 'couponDisc', width: 90, align: 'right' },
  //     { header: 'Offer Discount', key: 'offerDisc', width: 90, align: 'right' },
  //     { header: 'Tax', key: 'tax', width: 70, align: 'right' },
  //     { header: 'Shipping', key: 'shipping', width: 80, align: 'right' },
  //     { header: 'Total', key: 'total', width: 80, align: 'right' },
  //     { header: 'Payment Method', key: 'payment', width: 100, align: 'left' },
  //     { header: 'Date', key: 'date', width: 90, align: 'left' }
  //   ];
  
  //   // Table positioning - using full landscape width
  //   const tableLeft = 30;
  //   let currentX = tableLeft;
  //   const headerY = doc.y;
    
  //   // Draw headers
  //   doc.font('Helvetica-Bold').fontSize(9);
  //   columns.forEach(column => {
  //     doc.text(column.header, currentX, headerY, { 
  //       width: column.width, 
  //       align: column.align,
  //       lineBreak: false
  //     });
  //     currentX += column.width;
  //   });
  
  //   // Header underline
  //   const headerBottomY = headerY + 15;
  //   doc.moveTo(tableLeft, headerBottomY)
  //      .lineTo(currentX, headerBottomY)
  //      .stroke();
  
  //   // Draw rows with proper number formatting
  //   doc.font('Helvetica').fontSize(8);
  //   let rowY = headerBottomY + 10;
    
  //   orders.forEach(order => {
  //     currentX = tableLeft;
      
  //     // Format currency values properly (fixes the ¹ issue)
  //     const formatCurrency = (val) => {
  //       const num = parseFloat(val || 0);
  //       return '₹' + Math.abs(num).toFixed(2); // Handles negative values
  //     };
  
  //     const rowData = {
  //       orderNumber: order.orderNumber,
  //       subtotal: formatCurrency(order.itemsPrice),
  //       prodDisc: formatCurrency(order.discountAmount),
  //       couponDisc: formatCurrency(order.couponDiscount),
  //       offerDisc: formatCurrency(order.offerDiscount),
  //       tax: formatCurrency(order.taxPrice),
  //       shipping: formatCurrency(order.shippingPrice),
  //       total: formatCurrency(order.totalPrice),
  //       payment: order.paymentMethod,
  //       date: order.paidAt ? new Date(order.paidAt).toLocaleDateString() : 'N/A'
  //     };
  
  //     columns.forEach(column => {
  //       doc.text(rowData[column.key], currentX, rowY, {
  //         width: column.width,
  //         align: column.align,
  //         lineBreak: false
  //       });
  //       currentX += column.width;
  //     });
  
  //     rowY += 15;
      
  //     // Add page break if needed
  //     if (rowY > doc.page.height - 50) {
  //       doc.addPage();
  //       rowY = 50;
  //       // Redraw headers on new page
  //       currentX = tableLeft;
  //       doc.font('Helvetica-Bold').fontSize(9);
  //       columns.forEach(column => {
  //         doc.text(column.header, currentX, rowY - 15, { 
  //           width: column.width, 
  //           align: column.align,
  //           lineBreak: false
  //         });
  //         currentX += column.width;
  //       });
  //       doc.moveTo(tableLeft, rowY)
  //          .lineTo(currentX, rowY)
  //          .stroke();
  //       rowY += 25;
  //       doc.font('Helvetica').fontSize(8);
  //     }
  //   });
  
  //   // Footer
  //   doc.moveDown(2);
  //   doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, { align: 'right' });
  
  //   doc.end();
  //   return;
  // }
  // if (format === 'pdf') {
  //   // Use A4 landscape with optimized margins
  //   const doc = new PDFDocument({ 
  //     margin: 25,  // Slightly reduced margins
  //     size: 'A4',
  //     layout: 'landscape'
  //   });
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
  //   doc.pipe(res);
  
  //   // Title
  //   doc.fontSize(18).font('Helvetica-Bold').text('SALES REPORT', { align: 'center' });
  //   doc.moveDown(0.5);
  
  //   // Date range info
  //   doc.fontSize(9).font('Helvetica').text(`Report Period: ${range}${range === 'custom' ? ` (${from} to ${to})` : ''}`, { align: 'center' });
  //   doc.moveDown(1);
  
  //   // ======== SUMMARY SECTION ========
  //   doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY', { align: 'center', underline: true });
  //   doc.moveDown(0.5);
  
  //   // Summary data - compact version
  //   const summaryData = [
  //     { label: 'Total Orders:', value: data.totalOrders || 0 },
  //     { label: 'Gross Sales:', value: data.grossSales || 0 },
  //     { label: 'Total Discount:', value: data.totalDiscount || 0 },
  //     { label: 'Net Sales:', value: data.totalSales || 0 }
  //   ];
  
  //   // Draw compact summary table
  //   let summaryX = 50;
  //   const summaryY = doc.y;
  //   const summaryColWidth = 150;
  
  //   doc.font('Helvetica').fontSize(9);
  //   summaryData.forEach((item, i) => {
  //     const x = summaryX + (i % 2) * summaryColWidth;
  //     const y = summaryY + Math.floor(i / 2) * 20;
      
  //     doc.text(item.label, x, y, { width: 80, align: 'left' });
  //     doc.text(
  //       typeof item.value === 'number' ? '₹' + item.value.toFixed(2) : item.value,
  //       x + 80, 
  //       y,
  //       { width: 70, align: 'right' }
  //     );
  //   });
  
  //   doc.moveDown(Math.ceil(summaryData.length / 2) * 0.5);
  
  //   // ======== ORDER DETAILS SECTION ========
  //   doc.fontSize(12).font('Helvetica-Bold').text('ORDER DETAILS', { align: 'center', underline: true });
  //   doc.moveDown(0.5);
  
  //   // Optimized column configuration with proper spacing
  //   const columns = [
  //     { header: 'Order ID', key: 'orderNumber', width: 110, align: 'left' },
  //     { header: 'Subtotal', key: 'subtotal', width: 70, align: 'right' },
  //     { header: 'P.Disc', key: 'prodDisc', width: 60, align: 'right' },
  //     { header: 'C.Disc', key: 'couponDisc', width: 60, align: 'right' },
  //     { header: 'O.Disc', key: 'offerDisc', width: 60, align: 'right' },
  //     { header: 'Tax', key: 'tax', width: 55, align: 'right' },
  //     { header: 'Ship', key: 'shipping', width: 55, align: 'right' },
  //     { header: 'Total', key: 'total', width: 70, align: 'right' },
  //     { header: 'Payment', key: 'payment', width: 85, align: 'left' },  // Increased width
  //     { header: 'Date', key: 'date', width: 80, align: 'left' }         // Adequate space for date
  //   ];
  
  //   // Table positioning
  //   const tableLeft = 25;
  //   let currentX = tableLeft;
  //   const headerY = doc.y;
    
  //   // Draw headers with 5px gap between columns
  //   doc.font('Helvetica-Bold').fontSize(8);
  //   columns.forEach(column => {
  //     doc.text(column.header, currentX, headerY, { 
  //       width: column.width, 
  //       align: column.align,
  //       lineBreak: false
  //     });
  //     currentX += column.width + 5; // Consistent 5px gap
  //   });
  
  //   // Header underline
  //   const headerBottomY = headerY + 12;
  //   doc.moveTo(tableLeft, headerBottomY)
  //      .lineTo(currentX, headerBottomY)
  //      .stroke();
  
  //   // Draw rows with proper number formatting
  //   doc.font('Helvetica').fontSize(8);
  //   let rowY = headerBottomY + 8;
    
  //   // Fix for number formatting
  //   const safeFormat = (num) => {
  //     if (typeof num !== 'number') num = parseFloat(num) || 0;
  //     return num.toFixed(2);
  //   };
  
  //   orders.forEach(order => {
  //     currentX = tableLeft;
      
  //     const rowData = {
  //       orderNumber: order.orderNumber,
  //       subtotal: safeFormat(order.itemsPrice),
  //       prodDisc: safeFormat(order.discountAmount),
  //       couponDisc: safeFormat(order.couponDiscount),
  //       offerDisc: safeFormat(order.offerDiscount),
  //       tax: safeFormat(order.taxPrice),
  //       shipping: safeFormat(order.shippingPrice),
  //       total: safeFormat(order.totalPrice),
  //       payment: order.paymentMethod,
  //       date: order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '-'
  //     };
  
  //     columns.forEach(column => {
  //       const value = column.key === 'payment' || column.key === 'date' || column.key === 'orderNumber' 
  //         ? rowData[column.key] 
  //         : '₹' + rowData[column.key];
        
  //       doc.text(value, currentX, rowY, {
  //         width: column.width,
  //         align: column.align,
  //         lineBreak: false
  //       });
  //       currentX += column.width + 5; // Consistent 5px gap
  //     });
  
  //     rowY += 12;
      
  //     // Page break with header repeat
  //     if (rowY > doc.page.height - 30) {
  //       doc.addPage();
  //       rowY = 40;
  //       currentX = tableLeft;
  //       doc.font('Helvetica-Bold').fontSize(8);
  //       columns.forEach(column => {
  //         doc.text(column.header, currentX, rowY - 12, { 
  //           width: column.width, 
  //           align: column.align,
  //           lineBreak: false
  //         });
  //         currentX += column.width + 5;
  //       });
  //       doc.moveTo(tableLeft, rowY)
  //          .lineTo(currentX, rowY)
  //          .stroke();
  //       rowY += 8;
  //       doc.font('Helvetica').fontSize(8);
  //     }
  //   });
  
  //   // Footer
  //   doc.moveDown(1);
  //   doc.fontSize(7).text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'right' });
  
  //   doc.end();
  //   return;
  // }
  // if (format === 'pdf') {
  //   const doc = new PDFDocument({
  //     margin: 25,
  //     size: 'A4',
  //     layout: 'landscape'
  //   });
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
  //   doc.pipe(res);
  
  //   // Title
  //   doc.fontSize(18).font('Helvetica-Bold').text('SALES REPORT', { align: 'center' });
  //   doc.moveDown(0.5);
  
  //   // Date range info
  //   doc.fontSize(9).font('Helvetica').text(`Report Period: ${range}${range === 'custom' ? ` (${from} to ${to})` : ''}`, { align: 'center' });
  //   doc.moveDown(1);
  
  //   // ======== SUMMARY SECTION ========
  //   doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY TOTALS', { align: 'center', underline: true });
  //   doc.moveDown(0.5);
  
  //   // Summary data with proper formatting
  //   const summaryData = [
  //     { label: 'Total Orders:', value: data.totalOrders || 0 },
  //     { label: 'Gross Sales:', value: '₹' + (data.grossSales || 0).toFixed(2) },
  //     { label: 'Total Discounts:', value: '₹' + (data.totalDiscount || 0).toFixed(2) },
  //     { label: 'Total Tax:', value: '₹' + (data.totalTax || 0).toFixed(2) },
  //     { label: 'Total Shipping:', value: '₹' + (data.totalShipping || 0).toFixed(2) },
  //     { label: 'Net Sales:', value: '₹' + (data.totalSales || 0).toFixed(2) }
  //   ];
  
  //   // Draw summary table with proper alignment
  //   let summaryX = 100;
  //   const summaryY = doc.y;
  //   const summaryColWidth = 200;
  
  //   doc.font('Helvetica').fontSize(9);
  //   summaryData.forEach((item, i) => {
  //     const y = summaryY + i * 20;
  //     doc.text(item.label, summaryX, y, { width: 120, align: 'left' });
  //     doc.text(item.value, summaryX + 130, y, { width: 100, align: 'right' });
  //   });
  
  //   doc.moveDown(summaryData.length * 0.5 + 1);
  
  //   // ======== ORDER DETAILS SECTION ========
  //   doc.fontSize(12).font('Helvetica-Bold').text('ORDER DETAILS', { align: 'center', underline: true });
  //   doc.moveDown(0.5);
  
  //   // Column configuration with proper spacing
  //   const columns = [
  //     { header: 'Order ID', key: 'orderNumber', width: 110, align: 'left' },
  //     { header: 'Subtotal', key: 'subtotal', width: 70, align: 'right' },
  //     { header: 'Prod Disc', key: 'prodDisc', width: 65, align: 'right' },
  //     { header: 'Cpn Disc', key: 'couponDisc', width: 65, align: 'right' },
  //     { header: 'Off Disc', key: 'offerDisc', width: 65, align: 'right' },
  //     { header: 'Tax', key: 'tax', width: 55, align: 'right' },
  //     { header: 'Shipping', key: 'shipping', width: 65, align: 'right' },
  //     { header: 'Total', key: 'total', width: 75, align: 'right' },
  //     { header: 'Payment', key: 'payment', width: 90, align: 'left' }, // Increased width
  //     { header: 'Date', key: 'date', width: 80, align: 'left' }
  //   ];
  
  //   // Table positioning
  //   const tableLeft = 20;
  //   let currentX = tableLeft;
  //   const headerY = doc.y;
    
  //   // Draw headers with 5px gap
  //   doc.font('Helvetica-Bold').fontSize(8);
  //   columns.forEach(column => {
  //     doc.text(column.header, currentX, headerY, { 
  //       width: column.width, 
  //       align: column.align,
  //       lineBreak: false
  //     });
  //     currentX += column.width + 5;
  //   });
  
  //   // Header underline
  //   const headerBottomY = headerY + 12;
  //   doc.moveTo(tableLeft, headerBottomY)
  //      .lineTo(currentX, headerBottomY)
  //      .stroke();
  
  //   // Draw rows with proper formatting
  //   doc.font('Helvetica').fontSize(8);
  //   let rowY = headerBottomY + 8;
    
  //   orders.forEach(order => {
  //     currentX = tableLeft;
      
  //     const formatMoney = (val) => {
  //       const num = parseFloat(val || 0);
  //       return '₹' + num.toFixed(2);
  //     };
  
  //     const rowData = {
  //       orderNumber: order.orderNumber,
  //       subtotal: formatMoney(order.itemsPrice),
  //       prodDisc: formatMoney(order.discountAmount),
  //       couponDisc: formatMoney(order.couponDiscount),
  //       offerDisc: formatMoney(order.offerDiscount),
  //       tax: formatMoney(order.taxPrice),
  //       shipping: formatMoney(order.shippingPrice),
  //       total: formatMoney(order.totalPrice),
  //       payment: order.paymentMethod,
  //       date: order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '-'
  //     };
  
  //     columns.forEach(column => {
  //       doc.text(rowData[column.key], currentX, rowY, {
  //         width: column.width,
  //         align: column.align,
  //         lineBreak: false
  //       });
  //       currentX += column.width + 5;
  //     });
  
  //     rowY += 12;
      
  //     // Page break logic
  //     if (rowY > doc.page.height - 30) {
  //       doc.addPage();
  //       rowY = 40;
  //       currentX = tableLeft;
  //       doc.font('Helvetica-Bold').fontSize(8);
  //       columns.forEach(column => {
  //         doc.text(column.header, currentX, rowY - 12, { 
  //           width: column.width, 
  //           align: column.align,
  //           lineBreak: false
  //         });
  //         currentX += column.width + 5;
  //       });
  //       doc.moveTo(tableLeft, rowY)
  //          .lineTo(currentX, rowY)
  //          .stroke();
  //       rowY += 8;
  //       doc.font('Helvetica').fontSize(8);
  //     }
  //   });
  
  //   // Footer
  //   doc.moveDown(1);
  //   doc.fontSize(7).text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'right' });
  
  //   doc.end();
  //   return;
  // }
  // if (format === 'pdf') {
  //   const doc = new PDFDocument({
  //     margin: 25,
  //     size: 'A4',
  //     layout: 'landscape'
  //   });
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
  //   doc.pipe(res);
  
  //   // Title
  //   doc.fontSize(18).font('Helvetica-Bold').text('SALES REPORT', { align: 'center' });
  //   doc.moveDown(0.5);
  
  //   // Date range info
  //   doc.fontSize(9).font('Helvetica').text(`Report Period: ${range}${range === 'custom' ? ` (${from} to ${to})` : ''}`, { align: 'center' });
  //   doc.moveDown(1);
  
  //   // ======== SUMMARY SECTION ========
  //   doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY TOTALS', { align: 'center', underline: true });
  //   doc.moveDown(0.5);
  
  //   // Summary data with proper formatting - using Rs. instead of ₹
  //   const summaryData = [
  //     { label: 'Total Orders:', value: data.totalOrders || 0 },
  //     { label: 'Gross Sales:', value: 'Rs.' + (data.grossSales || 0).toFixed(2) },
  //     {label:'Offer discount',value:'Rs.'+(data.totalOfferDiscount || 0).toFixed(2)},
  //     {label:'coupon discount',value:'Rs.'+(data.totalCouponDiscount || 0).toFixed(2)},
  //     { label: 'Total Discounts:', value: 'Rs.' + (data.totalDiscount || 0).toFixed(2) },
  //     { label: 'Total Tax:', value: 'Rs.' + (data.totalTax || 0).toFixed(2) },
  //     { label: 'Total Shipping:', value: 'Rs.' + (data.totalShipping || 0).toFixed(2) },
  //     { label: 'Net Sales:', value: 'Rs.' + (data.totalSales || 0).toFixed(2) }
  //   ];
  
  //   // Draw summary table with proper alignment
  //   let summaryX = 100;
  //   const summaryY = doc.y;
  //   const summaryColWidth = 200;
  
  //   doc.font('Helvetica').fontSize(9);
  //   summaryData.forEach((item, i) => {
  //     const y = summaryY + i * 20;
  //     doc.text(item.label, summaryX, y, { width: 120, align: 'left' });
  //     doc.text(item.value, summaryX + 130, y, { width: 100, align: 'right' });
  //   });
  
  //   doc.moveDown(summaryData.length * 0.5 + 1);
  
  //   // ======== ORDER DETAILS SECTION ========
  //   doc.fontSize(12).font('Helvetica-Bold').text('ORDER DETAILS', { align: 'center', underline: true });
  //   doc.moveDown(0.5);
  
  //   // Column configuration with proper spacing - increased payment and total column widths
  //   const columns = [
  //     { header: 'Order ID', key: 'orderNumber', width: 110, align: 'left' },
  //     { header: 'Subtotal', key: 'subtotal', width: 70, align: 'right' },
  //     { header: 'Prod Disc', key: 'prodDisc', width: 65, align: 'right' },
  //     { header: 'Cpn Disc', key: 'couponDisc', width: 65, align: 'right' },
  //     { header: 'Off Disc', key: 'offerDisc', width: 65, align: 'right' },
  //     { header: 'Tax', key: 'tax', width: 55, align: 'right' },
  //     { header: 'Shipping', key: 'shipping', width: 65, align: 'right' },
  //     { header: 'Total', key: 'total', width: 85, align: 'right' }, // Increased from 75 to 85
  //     { header: 'Payment', key: 'payment', width: 100, align: 'left' }, // Increased from 90 to 100
  //     { header: 'Date', key: 'date', width: 80, align: 'left' }
  //   ];
  
  //   // Table positioning
  //   const tableLeft = 20;
  //   let currentX = tableLeft;
  //   const headerY = doc.y;
    
  //   // Draw headers with 5px gap
  //   doc.font('Helvetica-Bold').fontSize(8);
  //   columns.forEach(column => {
  //     doc.text(column.header, currentX, headerY, { 
  //       width: column.width, 
  //       align: column.align,
  //       lineBreak: false
  //     });
  //     currentX += column.width + 5;
  //   });
  
  //   // Header underline
  //   const headerBottomY = headerY + 12;
  //   doc.moveTo(tableLeft, headerBottomY)
  //      .lineTo(currentX, headerBottomY)
  //      .stroke();
  
  //   // Draw rows with proper formatting
  //   doc.font('Helvetica').fontSize(8);
  //   let rowY = headerBottomY + 8;
    
  //   orders.forEach(order => {
  //     currentX = tableLeft;
      
  //     const formatMoney = (val) => {
  //       const num = parseFloat(val || 0);
  //       return 'Rs.' + num.toFixed(2); // Changed from ₹ to Rs.
  //     };
  
  //     const rowData = {
  //       orderNumber: order.orderNumber,
  //       subtotal: formatMoney(order.itemsPrice),
  //       prodDisc: formatMoney(order.discountAmount),
  //       couponDisc: formatMoney(order.couponDiscount),
  //       offerDisc: formatMoney(order.offerDiscount),
  //       tax: formatMoney(order.taxPrice),
  //       shipping: formatMoney(order.shippingPrice),
  //       total: formatMoney(order.totalPrice),
  //       payment: order.paymentMethod,
  //       date: order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '-'
  //     };
  
  //     columns.forEach(column => {
  //       doc.text(rowData[column.key], currentX, rowY, {
  //         width: column.width,
  //         align: column.align,
  //         lineBreak: false
  //       });
  //       currentX += column.width + 5;
  //     });
  
  //     rowY += 12;
      
  //     // Page break logic
  //     if (rowY > doc.page.height - 30) {
  //       doc.addPage();
  //       rowY = 40;
  //       currentX = tableLeft;
  //       doc.font('Helvetica-Bold').fontSize(8);
  //       columns.forEach(column => {
  //         doc.text(column.header, currentX, rowY - 12, { 
  //           width: column.width, 
  //           align: column.align,
  //           lineBreak: false
  //         });
  //         currentX += column.width + 5;
  //       });
  //       doc.moveTo(tableLeft, rowY)
  //          .lineTo(currentX, rowY)
  //          .stroke();
  //       rowY += 8;
  //       doc.font('Helvetica').fontSize(8);
  //     }
  //   });
  
  //   // Footer
  //   doc.moveDown(1);
  //   doc.fontSize(7).text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'right' });
  
  //   doc.end();
  //   return;
  // }
  if (format === 'pdf') {
    const doc = new PDFDocument({
      margin: 25,
      size: 'A4',
      layout: 'landscape'
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);
  
    // Title
    doc.fontSize(18).font('Helvetica-Bold').text('SALES REPORT', { align: 'center' });
    doc.moveDown(0.5);
  
    // Date range info
    doc.fontSize(9).font('Helvetica').text(`Report Period: ${range}${range === 'custom' ? ` (${from} to ${to})` : ''}`, { align: 'center' });
    doc.moveDown(1);
  
    // ======== SUMMARY SECTION ========
    doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY TOTALS', { align: 'center', underline: true });
    doc.moveDown(0.5);
  
    // Summary data with proper formatting - using Rs. instead of ₹
    const summaryData = [
      { label: 'Total Orders:', value: data.totalOrders || 0 },
      { label: 'Gross Sales:', value: 'Rs.' + (data.grossSales || 0).toFixed(2) },
      { label: 'Total Discounts:', value: 'Rs.' + (data.totalDiscount || 0).toFixed(2) },
      { label: 'Total Tax:', value: 'Rs.' + (data.totalTax || 0).toFixed(2) },
      { label: 'Total Shipping:', value: 'Rs.' + (data.totalShipping || 0).toFixed(2) },
      { label: 'Net Sales:', value: 'Rs.' + (data.totalSales || 0).toFixed(2) }
    ];
  
    // Draw summary table with proper alignment - CHANGED: Moved content under heading
    let summaryX = (doc.page.width - 250) / 2; // Center the summary content
    const summaryY = doc.y;
    const summaryColWidth = 200;
  
    doc.font('Helvetica').fontSize(9);
    summaryData.forEach((item, i) => {
      const y = summaryY + i * 20;
      doc.text(item.label, summaryX, y, { width: 120, align: 'left' });
      doc.text(item.value, summaryX + 130, y, { width: 100, align: 'right' });
    });
  
    doc.moveDown(summaryData.length * 0.5 + 1);
  
    // ======== ORDER DETAILS SECTION ========
    // CHANGED: Center the "ORDER DETAILS" heading
    doc.fontSize(12).font('Helvetica-Bold').text('ORDER DETAILS', { align: 'center', underline: true });
    doc.moveDown(0.5);
  
  
    // Column configuration with proper spacing - increased payment and total column widths
    const columns = [
      { header: 'Order ID', key: 'orderNumber', width: 110, align: 'left' },
      { header: 'Subtotal', key: 'subtotal', width: 70, align: 'right' },
      { header: 'Prod Disc', key: 'prodDisc', width: 65, align: 'right' },
      { header: 'Cpn Disc', key: 'couponDisc', width: 65, align: 'right' },
      { header: 'Off Disc', key: 'offerDisc', width: 65, align: 'right' },
      { header: 'Tax', key: 'tax', width: 55, align: 'right' },
      { header: 'Shipping', key: 'shipping', width: 65, align: 'right' },
      { header: 'Total', key: 'total', width: 85, align: 'right' },
      { header: 'Payment', key: 'payment', width: 100, align: 'left' },
      { header: 'Date', key: 'date', width: 80, align: 'left' }
    ];
  
    // Table positioning
    const tableLeft = 20;
    let currentX = tableLeft;
    const headerY = doc.y;
    
    // Draw headers with 5px gap
    doc.font('Helvetica-Bold').fontSize(8);
    columns.forEach(column => {
      doc.text(column.header, currentX, headerY, { 
        width: column.width, 
        align: column.align,
        lineBreak: false
      });
      currentX += column.width + 5;
    });
  
    // Header underline
    const headerBottomY = headerY + 12;
    doc.moveTo(tableLeft, headerBottomY)
       .lineTo(currentX, headerBottomY)
       .stroke();
  
    // Draw rows with proper formatting
    doc.font('Helvetica').fontSize(8);
    let rowY = headerBottomY + 8;
    
    orders.forEach(order => {
      currentX = tableLeft;
      
      const formatMoney = (val) => {
        const num = parseFloat(val || 0);
        return 'Rs.' + num.toFixed(2);
      };
  
      const rowData = {
        orderNumber: order.orderNumber,
        subtotal: formatMoney(order.itemsPrice),
        prodDisc: formatMoney(order.discountAmount),
        couponDisc: formatMoney(order.couponDiscount),
        offerDisc: formatMoney(order.offerDiscount),
        tax: formatMoney(order.taxPrice),
        shipping: formatMoney(order.shippingPrice),
        total: formatMoney(order.totalPrice),
        payment: order.paymentMethod,
        date: order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '-'
      };
  
      columns.forEach(column => {
        doc.text(rowData[column.key], currentX, rowY, {
          width: column.width,
          align: column.align,
          lineBreak: false
        });
        currentX += column.width + 5;
      });
  
      rowY += 12;
      
      // Page break logic
      if (rowY > doc.page.height - 30) {
        doc.addPage();
        rowY = 40;
        currentX = tableLeft;
        doc.font('Helvetica-Bold').fontSize(8);
        columns.forEach(column => {
          doc.text(column.header, currentX, rowY - 12, { 
            width: column.width, 
            align: column.align,
            lineBreak: false
          });
          currentX += column.width + 5;
        });
        doc.moveTo(tableLeft, rowY)
           .lineTo(currentX, rowY)
           .stroke();
        rowY += 8;
        doc.font('Helvetica').fontSize(8);
      }
    });
  
    // Footer
    doc.moveDown(1);
    doc.fontSize(7).text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'right' });
  
    doc.end();
    return;
  }

  

  // if (format === 'excel') {
  //   const workbook = new ExcelJS.Workbook();

  //   // Summary Sheet
  //   const summarySheet = workbook.addWorksheet('Summary');
  //   summarySheet.columns = [
  //     { header: 'Metric', key: 'metric', width: 25 },
  //     { header: 'Value', key: 'value', width: 20 },
  //   ];
  //   Object.entries(data).forEach(([k, v]) => {
  //     summarySheet.addRow({ metric: k, value: v });
  //   });

  //   const orderSheet = workbook.addWorksheet('Paid Orders');
  //   orderSheet.columns = [
  //     { header: 'Order ID', key: 'orderNumber', width: 25 },
  //     { header: 'Subtotal', key: 'itemsPrice', width: 15 },
  //     { header: 'Product Discount', key: 'discountAmount', width: 18 },
  //     { header: 'Coupon Discount', key: 'couponDiscount', width: 18 },
  //     { header: 'Offer Discount', key: 'offerDiscount', width: 18 },
  //     { header: 'Tax', key: 'taxPrice', width: 12 },
  //     { header: 'Shipping', key: 'shippingPrice', width: 15 },
  //     { header: 'Total', key: 'totalPrice', width: 15 },
  //     { header: 'Payment Method', key: 'paymentMethod', width: 15 },
  //     { header: 'Paid At', key: 'paidAt', width: 20 },
  //   ];
  //   orders.forEach((o) => {
  //     orderSheet.addRow({
  //       orderNumber: o.orderNumber,
  //       itemsPrice: o.itemsPrice,
  //       discountAmount: o.discountAmount,
  //       couponDiscount: o.couponDiscount,
  //       offerDiscount: o.offerDiscount,
  //       taxPrice: o.taxPrice,
  //       shippingPrice: o.shippingPrice,
  //       totalPrice: o.totalPrice,
  //       paymentMethod: o.paymentMethod,
  //       paidAt: o.paidAt ? o.paidAt.toISOString().slice(0, 10) : ''
  //     });
  //   });

  //   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  //   res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
  //   await workbook.xlsx.write(res);
  //   res.end();
  //   return;
  // }
 
  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
  
    // Summary Sheet - Match PDF exactly
    const summarySheet = workbook.addWorksheet('Summary Totals');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Amount', key: 'amount', width: 25 }
    ];
  
    // Add title row
    summarySheet.addRow(['SALES REPORT']);
    summarySheet.mergeCells('A1:B1');
    summarySheet.getCell('A1').font = { bold: true, size: 14 };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };
  
    // Add period info
    summarySheet.addRow([`Report Period: ${range}${range === 'custom' ? ` (${from} to ${to})` : ''}`]);
    summarySheet.mergeCells('A2:B2');
    summarySheet.getCell('A2').alignment = { horizontal: 'center' };
  
    // Add empty row
    summarySheet.addRow([]);
  
    // Add header row
    summarySheet.addRow(['SUMMARY TOTALS']);
    summarySheet.mergeCells('A3:B3');
    summarySheet.getCell('A3').font = { bold: true };
    summarySheet.getCell('A3').alignment = { horizontal: 'center' };
    summarySheet.getCell('A3').border = { bottom: { style: 'thin' } };
  
    // Add empty row
    summarySheet.addRow([]);
  
    // Add summary data matching PDF exactly
    const summaryData = [
      { metric: 'Total Orders:', amount: data.totalOrders || 0 },
      { metric: 'Gross Sales:', amount: 'Rs.' + (data.grossSales || 0).toFixed(2) },
      { metric: 'Product Discount:', amount: 'Rs.' + (data.totalProductDiscount || 0).toFixed(2) },
      { metric: 'Coupon Discount:', amount: 'Rs.' + (data.totalCouponDiscount || 0).toFixed(2) },
      { metric: 'Offer Discount:', amount: 'Rs.' + (data.totalOfferDiscount || 0).toFixed(2) },
      { metric: 'Total Discounts:', amount: 'Rs.' + (data.totalDiscount || 0).toFixed(2) },
      { metric: 'Total Tax:', amount: 'Rs.' + (data.totalTax || 0).toFixed(2) },
      { metric: 'Total Shipping:', amount: 'Rs.' + (data.totalShipping || 0).toFixed(2) },
      { metric: 'Net Sales:', amount: 'Rs.' + (data.totalSales || 0).toFixed(2) }
    ];
  
    summaryData.forEach(row => summarySheet.addRow(row));
  
    // Orders Sheet - Match PDF table exactly
    const orderSheet = workbook.addWorksheet('Order Details');
    
    // Add title
    orderSheet.addRow(['ORDER DETAILS']);
    orderSheet.mergeCells('A1:J1');
    orderSheet.getCell('A1').font = { bold: true, size: 14 };
    orderSheet.getCell('A1').alignment = { horizontal: 'center' };
  
    // Add empty row
    orderSheet.addRow([]);
  
    // Add headers matching PDF exactly
    const headers = ['Order ID', 'Subtotal', 'Prod Disc', 'Cpn Disc', 'Off Disc', 'Tax', 'Shipping', 'Total', 'Payment', 'Date'];
    orderSheet.addRow(headers);
    
    // Format header row
    const headerRow = orderSheet.getRow(3);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  
    // Set column widths
    const columnWidths = [15, 12, 12, 12, 12, 10, 12, 12, 15, 12];
    columnWidths.forEach((width, index) => {
      orderSheet.getColumn(index + 1).width = width;
    });
  
    // Add order data matching PDF exactly
    orders.forEach(order => {
      const rowData = [
        order.orderNumber,
        'Rs.' + (order.itemsPrice || 0).toFixed(2),
        'Rs.' + (order.discountAmount || 0).toFixed(2),
        'Rs.' + (order.couponDiscount || 0).toFixed(2),
        'Rs.' + (order.offerDiscount || 0).toFixed(2),
        'Rs.' + (order.taxPrice || 0).toFixed(2),
        'Rs.' + (order.shippingPrice || 0).toFixed(2),
        'Rs.' + (order.totalPrice || 0).toFixed(2),
        order.paymentMethod,
        order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : '-'
      ];
      const row = orderSheet.addRow(rowData);
      
      // Add borders to each cell
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  
    // Format currency columns (B to H)
    for (let col = 2; col <= 8; col++) {
      orderSheet.getColumn(col).alignment = { horizontal: 'right' };
    }
  
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
    return;
  } 

  
  res.json({ range, from, to, summary: data, orders });
});

export default { getSalesReport };
