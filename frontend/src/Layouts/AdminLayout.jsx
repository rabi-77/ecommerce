import Sidebar from "../components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutThunk } from "../features/admin/adminAuth/adminAuthSlice";
import { useState } from "react";
import { HiMenuAlt2 } from "react-icons/hi";

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminInfo } = useSelector((state) => state.adminAuth);

  // NEW: state for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutThunk(adminInfo._id));
    // navigate("/adm/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Desktop sidebar fixed to the left */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-64">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 w-64 bg-gray-800">
            <Sidebar onLinkClick={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64 overflow-hidden w-full">
        <header className="bg-gray-800 shadow-md fixed top-0 inset-x-0 z-20">
          <div className="flex justify-between items-center py-4 px-4 sm:px-6 md:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className="text-gray-200 md:hidden mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <HiMenuAlt2 className="w-6 h-6" />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-white flex-1">
              Admin Panel
            </h2>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 p-4 sm:p-6 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
