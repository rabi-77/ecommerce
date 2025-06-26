import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, getDashboardStatsThunk } from '../../features/admin/adminDashboard/dashboardSlice';
import { FaUsers, FaBoxOpen, FaShoppingCart, FaTag } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { downloadLedgerPdf } from '../../features/admin/adminDashboard/dashboardService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, filters } = useSelector((state) => state.adminDashboard);

  useEffect(() => {
    dispatch(getDashboardStatsThunk(filters));
  }, [dispatch, filters]);

  // helpers
  const statsLoading = loading || !data;

  const productChartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    const top10 = data.topProducts.slice(0, 10);
    return {
      labels: top10.map((p) => p.name),
      datasets: [
        {
          label: 'Qty Sold',
          data: top10.map((p) => p.totalQty),
          backgroundColor: '#4B5563',
        },
      ],
    };
  }, [data]);

  const categoryChartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    const top10 = data.topCategories.slice(0, 10);
    return {
      labels: top10.map((c) => c.name),
      datasets: [
        {
          label: 'Qty Sold',
          data: top10.map((c) => c.totalQty),
          backgroundColor: '#a855f7', // purple
        },
      ],
    };
  }, [data]);

  const brandChartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    const top10 = data.topBrands.slice(0, 10);
    return {
      labels: top10.map((b) => b.name),
      datasets: [
        {
          label: 'Qty Sold',
          data: top10.map((b) => b.totalQty),
          backgroundColor: '#ec4899', // pink
        },
      ],
    };
  }, [data]);

  const productChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2, // width : height
    animation: false,
    plugins: {
      legend: { display: false },
    },
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-indigo-900">Dashboard Overview</h2>
            <p className="text-indigo-600">Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <select
              className="px-4 py-2 bg-white border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-indigo-800 font-medium"
              value={filters.range}
              onChange={(e) => dispatch(setFilters({ range: e.target.value }))}
            >
              <option value="today" className="text-indigo-800">Today</option>
              <option value="week" className="text-indigo-800">Last 7 days</option>
              <option value="month" className="text-indigo-800">This month</option>
              <option value="year" className="text-indigo-800">This year</option>
            </select>
            <button
              onClick={async () => {
                try {
                  const response = await downloadLedgerPdf(filters);
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'ledger.pdf');
                  document.body.appendChild(link);
                  link.click();
                  link.parentNode.removeChild(link);
                } catch (err) {
                  console.error('Ledger download failed', err);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md transition-all duration-200 flex items-center text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Ledger
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-md border-2 border-indigo-100 p-6 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Top Products</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{data?.topProducts?.length || 0}</p>
                {/* <p className="text-xs text-indigo-500 mt-1">+12% from last month</p> */}
              </div>
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                <FaBoxOpen className="text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md border-2 border-purple-100 p-6 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Top Categories</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{data?.topCategories?.length || 0}</p>
                {/* <p className="text-xs text-purple-500 mt-1">+8% from last month</p> */}
              </div>
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <FaTag className="text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-md border-2 border-pink-100 p-6 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-700">Top Brands</p>
                <p className="text-2xl font-bold text-pink-900 mt-1">{data?.topBrands?.length || 0}</p>
                {/* <p className="text-xs text-pink-500 mt-1">+15% from last month</p> */}
              </div>
              <div className="p-3 rounded-xl bg-pink-100 text-pink-600">
                <FaShoppingCart className="text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-50 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-indigo-900">Top Products (Quantity Sold)</h3>
          </div>
          <div className="h-80">
            {statsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-indigo-400">Loading chart...</div>
              </div>
            ) : (
              <Bar 
                data={{
                  ...productChartData,
                  datasets: productChartData.datasets.map(dataset => ({
                    ...dataset,
                    backgroundColor: '#818cf8',
                    borderRadius: 8,
                    borderSkipped: false,
                  }))
                }}
                options={{
                  ...productChartOptions,
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    ...productChartOptions.plugins,
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { 
                        color: 'rgba(99, 102, 241, 0.1)',
                        drawBorder: false
                      },
                      ticks: { 
                        color: '#4f46e5',
                        font: {
                          weight: 'bold'
                        }
                      }
                    },
                    x: {
                      grid: { 
                        display: false,
                        drawBorder: false
                      },
                      ticks: { 
                        color: '#4f46e5',
                        font: {
                          weight: 'bold'
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Categories Chart Section */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-purple-50 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-purple-900">Top Categories (Quantity Sold)</h3>
          </div>
          <div className="h-80">
            {statsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-purple-400">Loading chart...</div>
              </div>
            ) : (
              <Bar
                data={{
                  ...categoryChartData,
                  datasets: categoryChartData.datasets.map((ds) => ({
                    ...ds,
                    backgroundColor: '#a855f7',
                    borderRadius: 8,
                    borderSkipped: false,
                  })),
                }}
                options={{
                  ...productChartOptions,
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: { ...productChartOptions.plugins, legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(168, 85, 247, 0.1)', drawBorder: false },
                      ticks: { color: '#7e22ce', font: { weight: 'bold' } },
                    },
                    x: {
                      grid: { display: false, drawBorder: false },
                      ticks: { color: '#7e22ce', font: { weight: 'bold' } },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Brands Chart Section */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-pink-50 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-pink-900">Top Brands (Quantity Sold)</h3>
          </div>
          <div className="h-80">
            {statsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-pink-400">Loading chart...</div>
              </div>
            ) : (
              <Bar
                data={{
                  ...brandChartData,
                  datasets: brandChartData.datasets.map((ds) => ({
                    ...ds,
                    backgroundColor: '#ec4899',
                    borderRadius: 8,
                    borderSkipped: false,
                  })),
                }}
                options={{
                  ...productChartOptions,
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: { ...productChartOptions.plugins, legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(236, 72, 153, 0.1)', drawBorder: false },
                      ticks: { color: '#be185d', font: { weight: 'bold' } },
                    },
                    x: {
                      grid: { display: false, drawBorder: false },
                      ticks: { color: '#be185d', font: { weight: 'bold' } },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
