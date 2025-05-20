import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaBoxOpen, FaShoppingCart, FaTag } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    categories: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch users count
        const usersResponse = await axios.get('http://localhost:5000/admin/users?size=1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch products count
        const productsResponse = await axios.get('http://localhost:5000/admin/products?size=1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch categories count
        const categoriesResponse = await axios.get('http://localhost:5000/admin/categories?size=1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Set the stats
        setStats({
          users: usersResponse.data.total || 0,
          products: productsResponse.data.total || 0,
          orders: 0, // You can add this endpoint when available
          categories: categoriesResponse.data.total || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  // Stat card component
  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
      <div className={`p-3 rounded-full ${color} text-white mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800">
          {stats.isLoading ? '...' : value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.users} 
          icon={<FaUsers className="text-xl" />} 
          color="bg-gray-800" 
        />
        
        <StatCard 
          title="Total Products" 
          value={stats.products} 
          icon={<FaBoxOpen className="text-xl" />} 
          color="bg-gray-800" 
        />
        
        <StatCard 
          title="Categories" 
          value={stats.categories} 
          icon={<FaTag className="text-xl" />} 
          color="bg-gray-800" 
        />
        
        <StatCard 
          title="Total Orders" 
          value={stats.orders} 
          icon={<FaShoppingCart className="text-xl" />} 
          color="bg-gray-800" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h3>
          <div className="border-t pt-4">
            <p className="text-gray-600">No recent activity to display.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <button className="p-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
              Add New Product
            </button>
            <button className="p-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
              View Orders
            </button>
            <button className="p-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
              Manage Users
            </button>
            <button className="p-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
              Update Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
