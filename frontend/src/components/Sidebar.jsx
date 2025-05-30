import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Product', path: '/admin/product' },
    { name: 'Inventory', path: '/admin/inventory' },
    { name: 'Brands', path: '/admin/brands' },
    { name: 'Category', path: '/admin/category' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Offers', path: '/admin/offers' },
    { name: 'Settings', path: '/admin/settings' },
    { name: 'Banner', path: '/admin/banner' },
    { name: 'Coupons', path: '/admin/coupons' },
  ];

  return (
    <div className="w-64 min-h-screen bg-gray-800 text-white p-6">
      <h1 className="text-xl font-bold mb-8 text-white border-b border-gray-700 pb-4">Vercetti</h1>
      <nav className="space-y-2">
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-gray-700 text-white border-l-4 border-gray-500' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
