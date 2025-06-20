import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSalesReportThunk, setFilters } from '../../features/admin/salesReportSlice';
import { downloadSalesReport } from '../../services/admin/salesReportService';
import { toast } from 'react-toastify';
import { FaFilePdf, FaFileExcel, FaDownload, FaCalendarAlt } from 'react-icons/fa';

const StatCard = ({ title, value, className = '' }) => (
  <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${className}`}>
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <p className="text-2xl font-semibold text-gray-800">{value}</p>
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sales Report</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => handleDownload('pdf')} 
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <FaFilePdf /> PDF
          </button>
          <button 
            onClick={() => handleDownload('excel')} 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            <FaFileExcel /> Excel
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FaCalendarAlt className="text-gray-500" /> Date Range
        </h3>
        <div className="flex flex-wrap gap-2">
          {['today', 'week', 'month', 'year'].map((r) => (
            <button
              key={r}
              onClick={() => applyRange(r)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filters.range === r
                  ? 'bg-gray-800 text-white'
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
              className="border rounded-md px-3 py-1.5 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) => setCustomRange((prev) => ({ ...prev, to: e.target.value }))}
              className="border rounded-md px-3 py-1.5 text-sm"
            />
            <button
              onClick={applyCustom}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
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
            value={data?.data.totalOrders || 0} 
            className="border-l-4 border-blue-500"
          />
          <StatCard 
            title="Gross Sales" 
            value={`₹${data?.data.grossSales || 0}`} 
            className="border-l-4 border-green-500"
          />
          <StatCard 
            title="Total Discounts" 
            value={`₹${data?.data.totalDiscount || 0}`} 
            className="border-l-4 border-yellow-500"
          />
          <StatCard 
            title="Net Revenue" 
            value={`₹${data ? (data.data.grossSales - (data.data.totalDiscount || 0)) : 0}`} 
            className="border-l-4 border-purple-500 bg-purple-50"
          />
        </div>
      )}
    </div>
  );
};

export default SalesReport;
