import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Product', path: '/admin/product' },
    { name: 'Brands', path: '/admin/brands' },
    { name: 'Category', path: '/admin/category' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Offers', path: '/admin/offers' },
    { name: 'Settings', path: '/admin/settings' },
    { name: 'Banner', path: '/admin/banner' },
    { name: 'Coupons', path: '/admin/coupons' },
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 p-6">
      <h1 className="text-xl font-bold mb-6">Vercetti</h1>
      <nav className="space-y-3">
        {navItems.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive ? 'bg-black text-white' : 'text-gray-800 hover:bg-gray-100'
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
