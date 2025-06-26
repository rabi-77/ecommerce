import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSalesReportThunk, setFilters } from '../../features/admin/salesReportSlice';
import { downloadSalesReport } from '../../services/admin/salesReportService';
import { toast } from 'react-toastify';
import { FaFilePdf, FaFileExcel, FaDownload, FaCalendarAlt } from 'react-icons/fa';

const StatCard = ({ title, value, className = '' }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-md border-2 border-transparent hover:shadow-lg transition-all ${className}`}>
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

const SalesReport = () => {
  const dispatch = useDispatch();
  const { data, loading, filters } = useSelector((state) => state.salesReport);
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  useEffect(() => {
    dispatch(getSalesReportThunk(filters));
  }, [dispatch, filters]);

  const applyRange = (range) => {
    dispatch(setFilters({ range }));
  };

  const applyCustom = () => {
    if (!customRange.from || !customRange.to) {
      toast.error('Select both dates');
      return;
    }
    dispatch(setFilters({ range: 'custom', from: customRange.from, to: customRange.to }));
  };

  const handleDownload = async (format) => {
    try {
      const params = { ...filters, format };
      const res = await downloadSalesReport(params);
      const blob = new Blob([res.data], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Download failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-indigo-900">Sales Report</h2>
            <p className="text-indigo-600">Track and analyze your sales performance</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button 
              onClick={() => handleDownload('pdf')} 
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm font-medium"
            >
              <FaFilePdf className="text-lg" /> PDF
            </button>
            <button 
              onClick={() => handleDownload('excel')} 
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md text-sm font-medium"
            >
              <FaFileExcel className="text-lg" /> Excel
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-50 p-6 mb-8">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaCalendarAlt className="text-indigo-600" /> Date Range
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {['today', 'week', 'month', 'year'].map((r) => (
              <button
                key={r}
                onClick={() => applyRange(r)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  filters.range === r
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, from: e.target.value }))}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, to: e.target.value }))}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={applyCustom}
                className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading report data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Total Orders" 
              value={data?.summary?.totalOrders || 0} 
              className="border-l-4 border-blue-500"
              
            />
            <StatCard 
              title="Gross Sales" 
              value={`₹${Math.ceil(data?.summary?.grossSales || 0)}`} 
              className="border-l-4 border-green-500"
            />
            <StatCard 
              title="Total Discounts" 
              value={`₹${Math.ceil(data?.summary?.totalDiscount || 0)}`} 
              className="border-l-4 border-yellow-500"
            />
            <StatCard 
              title="Net Revenue" 
              value={`₹${Math.ceil(data?.summary ? (data.summary.grossSales - (data.summary.totalDiscount || 0)) : 0)}`} 
              className="border-l-4 border-purple-500 bg-purple-50"
            />
          </div>
        )}
        
        {/* Orders Table */}
        {loading ? null : (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-md font-semibold text-gray-700 mb-4">Paid Orders</h3>
            {data?.orders && data.orders.length > 0 ? (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Order ID</th>
                      <th className="px-4 py-2 text-left">Subtotal</th>
                      <th className="px-4 py-2 text-left">Offer</th>
                      <th className="px-4 py-2 text-left">Coupon Discount</th>
                      <th className="px-4 py-2 text-left">Tax</th>
                      <th className="px-4 py-2 text-left">Shipping</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Payment</th>
                      {/* <th className="px-4 py-2 text-left">Paid At</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((o) => (
                      <tr key={o._id} className="border-b">
                        <td className="px-4 py-2 whitespace-nowrap">{o.orderNumber}</td>
                        <td className="px-4 py-2">₹{o.itemsPrice.toFixed(2)}</td>
                        <td className="px-4 py-2">₹{o.discountAmount.toFixed(2)}</td>
                        <td className="px-4 py-2">₹{o.couponDiscount.toFixed(2)}</td>
                        <td className="px-4 py-2">₹{o.taxPrice.toFixed(2)}</td>
                        <td className="px-4 py-2">₹{o.shippingPrice.toFixed(2)}</td>
                        <td className="px-4 py-2 font-semibold">₹{o.totalPrice.toFixed(2)}</td>
                        <td className="px-4 py-2">{o.paymentMethod}</td>
                        {/* <td className="px-4 py-2">{o.paidAt ? new Date(o.paidAt).toLocaleDateString() : ''}</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No paid orders found for this range.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
