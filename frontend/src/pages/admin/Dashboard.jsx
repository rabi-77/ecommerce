import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, getDashboardStatsThunk } from '../../features/admin/adminDashboard/dashboardSlice';
import { FaUsers, FaBoxOpen, FaShoppingCart, FaTag } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
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

  const counts = data?.counts || {};

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
        </div>

        {/* Totals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[ 
            { label: 'Total Users', value: counts.users, icon: <FaUsers className="text-2xl" />, colors: 'from-indigo-50 to-blue-50 border-indigo-100 text-indigo-700 text-indigo-900' },
            { label: 'Total Products', value: counts.products, icon: <FaBoxOpen className="text-2xl" />, colors: 'from-purple-50 to-pink-50 border-purple-100 text-purple-700 text-purple-900' },
            { label: 'Total Categories', value: counts.categories, icon: <MdCategory className="text-2xl" />, colors: 'from-pink-50 to-rose-50 border-pink-100 text-pink-700 text-pink-900' },
            { label: 'Total Brands', value: counts.brands, icon: <FaTag className="text-2xl" />, colors: 'from-rose-50 to-orange-50 border-rose-100 text-rose-700 text-rose-900' },
            { label: 'Total Orders', value: counts.orders, icon: <FaShoppingCart className="text-2xl" />, colors: 'from-indigo-50 to-purple-50 border-indigo-100 text-indigo-700 text-indigo-900' },
          ].map((c, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${c.colors.split(' ')[0]} ${c.colors.split(' ')[1]} rounded-2xl shadow-md border-2 ${c.colors.split(' ')[2]} p-6 transition-all hover:shadow-lg hover:-translate-y-1`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${c.colors.split(' ')[3]}`}>{c.label}</p>
                  <p className={`text-2xl font-bold ${c.colors.split(' ')[4]} mt-1`}>{c.value ?? '—'}</p>
                </div>
                <div className={`p-3 rounded-xl ${c.colors.split(' ')[2].replace('border-', 'bg-')} text-current`}>
                  {c.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Latest Orders & Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Latest Orders */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-50 p-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Latest Orders</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-indigo-600">
                    <th className="px-4 py-2">Order #</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.latestOrders?.length === 0 && (
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap" colSpan={4}>No orders found</td>
                    </tr>
                  )}
                  {data?.latestOrders?.map(o => (
                    <tr key={o._id} className="border-t">
                      <td className="px-4 py-2 whitespace-nowrap">{o.orderNumber}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{o.user?.username || '—'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">₹{o.totalPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap capitalize">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Users */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-50 p-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Newest Users</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-indigo-600">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.latestUsers?.map(u => (
                    <tr key={u._id} className="border-t">
                      <td className="px-4 py-2 whitespace-nowrap">{u.name || u.username}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Filters & Ledger */}
        <div className="flex flex-col md:flex-row md:items-center justify-end mb-6 space-y-4 md:space-y-0 md:space-x-4">
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
