import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setAuthToken, login, resetAuthState, resetPasswordState, clearPasswordResetErrors } from "../../features/authSlice";
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";
import OtpVerificationModal from "../../components/auth/OtpVerificationModal";
import ResetPasswordModal from "../../components/auth/ResetPasswordModal";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Modal states for forgot password flow
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { loading, error, errormessage, token } = useSelector(
    (state) => state.auth
  );


  useEffect(() => {
    resetAuthState()
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      dispatch(setAuthToken(token));
      toast.success("Logged in with Google");
      navigate("/");
    } else if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams, dispatch, navigate]);


  useEffect(() => {
    // Handle errors from Redux
    if (error && errormessage) {
      toast.error(errormessage);
    }

    // Handle successful login
    if (token && !loading) {
      navigate("/");
    }
  }, [error, errormessage, token, loading, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/user/google";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  // State to track the email for password reset flow
  const [resetEmail, setResetEmail] = useState("");

  // Forgot password handlers
  const handleForgotPasswordClick = () => {
    // Reset all states before showing the modal
    dispatch(resetPasswordState());
    setResetEmail("");
    setShowForgotPasswordModal(true);
  };

  const handleOtpSent = (email) => {
    console.log('Email received in handleOtpSent:', email);
    // Store the email in component state
    setResetEmail(email);
    setShowForgotPasswordModal(false);
    setShowOtpModal(true);
  };

  const handleOtpVerify = (otp) => {
    console.log('OTP received in handleOtpVerify:', otp);
    setOtpCode(otp);
    setShowOtpModal(false);
    setShowResetPasswordModal(true);
  };

  const handleCloseAllModals = () => {
    setShowForgotPasswordModal(false);
    setShowOtpModal(false);
    setShowResetPasswordModal(false);
    setOtpCode("");
    // Reset auth state
    dispatch(resetAuthState());
    // Only reset password state when completely closing the flow
    dispatch(resetPasswordState());
  };

  if (searchParams.get("token") && loading) {
    return <div className="h-screen flex justify-center items-center">Verifying Google login...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded mb-4"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        <div className="text-right mb-4">
          <button 
            type="button" 
            onClick={handleForgotPasswordClick}
            className="text-blue-500 text-sm"
          >
            Forgot Password?
          </button>
        </div>
      </form>
      
      <div className="flex items-center mb-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-500">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <button
        onClick={handleGoogleLogin}
        className="w-full p-2 bg-red-500 text-white rounded"
      >
        Sign in with Google
      </button>
      
      <p className="mt-2 text-center">
        Don't have an account? <a href="/register" className="text-blue-500">Register</a>
      </p>
      
      {/* Forgot Password Modals */}
      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal} 
        onClose={handleCloseAllModals} 
        onOtpSent={handleOtpSent} 
      />
      
      <OtpVerificationModal 
        isOpen={showOtpModal} 
        onClose={handleCloseAllModals} 
        onVerify={handleOtpVerify} 
      />
      
      <ResetPasswordModal 
        isOpen={showResetPasswordModal} 
        onClose={handleCloseAllModals} 
        otp={otpCode}
        email={resetEmail} // Pass email directly as prop
      />
      
      <ToastContainer />
    </div>
  );
};

export default Login;