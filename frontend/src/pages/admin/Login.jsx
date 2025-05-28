import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginThunk, logoutThunk, clearError, clearState } from "../../features/admin/adminAuth/adminAuthSlice";


const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {error, loading, isAuthenticated} = useSelector((state) => state.adminAuth);
  const [show, setShow] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
    if (error) {
      toast.error(error);
      // Clear the error after showing it to prevent duplicate toasts
      dispatch(clearError());
    }
    
    // Clean up function to clear errors when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [error, isAuthenticated, navigate, dispatch]);

  const showHandle = () => {
    show ? setShow(false) : setShow(true);
  };

  const handleChange=(e)=>{
    const {name,value}=e.target
    setFormData((prev)=>({ ...prev,[name]:value}))
  }

  const handleSubmit= async (e)=>{
    e.preventDefault()
    try{
        await dispatch(loginThunk(formData)).unwrap();
    }catch(err){

    }
  }
  const  handleLogout=()=>{
    dispatch(logoutThunk())
}

 

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="bg-white p-12 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-[#1f2937] mb-2">
          Welcome back!
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Enter your Credentials to access your account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              className="block text-sm font-semibold mb-1 text-[#1f2937]"
              htmlFor="email"
            >
              Email
            </label>
            <input
              onChange={handleChange}
              value={formData.email}
              type="email"
              name="email"
              id="email"
              className="w-full border-b border-[#e5e7eb] bg-transparent focus:outline-none py-1"
            />
          </div>

          <div className="mb-4 relative">
            <label
              className="block text-sm font-semibold mb-1 text-[#1f2937]"
              htmlFor="password"
            >
              Password
            </label>
            <input
              onChange={handleChange}
              name="password"
              value={formData.password}
              type={show ? "password" : ""}
              id="password"
              className="w-full border-b border-[#e5e7eb] bg-transparent focus:outline-none py-1 pr-8"
            />
            <span
              onClick={showHandle}
              className="absolute right-2 top-9 text-gray-400"
            >
              👁️‍🗨️
            </span>
          </div>

          <div className="flex items-center mb-6 text-sm text-[#1f2937]">
            <input type="checkbox" id="remember" className="mr-2" />
            <label htmlFor="remember">Remember me</label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1f2937] text-white py-2 rounded-md font-semibold"
          >
            Login
          </button>
          
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
