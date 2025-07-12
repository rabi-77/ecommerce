import { NavLink } from 'react-router-dom';

const Sidebar = ({ onLinkClick = () => {} }) => {
  const navItems = [
    { name: 'Dashboard', path: '/adm/dashboard' },
    { name: 'Users', path: '/adm/users' },
    { name: 'Product', path: '/adm/product' },
    { name: 'Inventory', path: '/adm/inventory' },
    { name: 'Brands', path: '/adm/brands' },
    { name: 'Category', path: '/adm/category' },
    { name: 'Orders', path: '/adm/orders' },
    { name: 'Offers', path: '/adm/offers' },
    { name: 'Banners', path: '/adm/banner' },
    { name: 'Coupons', path: '/adm/coupons' },
    { name: 'Sales Report', path: '/adm/sales-report' },
  ];

  return (
    <div className="w-64 md:w-64 min-h-screen bg-gray-800 text-white p-6">
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
            onClick={onLinkClick}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
