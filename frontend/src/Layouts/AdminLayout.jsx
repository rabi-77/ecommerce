import Sidebar from "../components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutThunk } from "../features/admin/adminAuth/adminAuthSlice";

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
const {adminInfo}= useSelector((state)=>state.adminAuth)
  const handleLogout = () => {
    dispatch(logoutThunk(adminInfo._id));
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex justify-between items-center py-4 px-8">
            <h2 className="text-xl font-semibold">Admin Panel</h2>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 bg-[#f5f5f5] p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
