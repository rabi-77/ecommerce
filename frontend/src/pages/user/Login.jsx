import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setAuthToken, login, resetAuthState, resetPasswordState, clearPasswordResetErrors, clearError } from "../../features/authSlice";
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";
import OtpVerificationModal from "../../components/auth/OtpVerificationModal";
import ResetPasswordModal from "../../components/auth/ResetPasswordModal";
import { API_URL } from "../../config";

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
    dispatch(resetAuthState());
    // Check for both old and new token parameter names for backward compatibility
    const token = searchParams.get("token");
    const tokenAccess = searchParams.get("tokenAccess");
    const refreshToken = searchParams.get("refreshToken");
    const tokenRefresh = searchParams.get("tokenRefresh");
    const userDataParam = searchParams.get("userData");
    const error = searchParams.get("error");

    // Use either token format (supporting both old and new parameter names)
    const accessToken = tokenAccess || token;
    const refreshTokenValue = tokenRefresh || refreshToken;

    if (accessToken) {
      
      // Process user data if available
      if (userDataParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userDataParam));
          
          // Dispatch login success action directly to update Redux state
          // This mimics the exact same action that happens during regular login
          dispatch({
            type: 'auth/login/fulfilled',
            payload: {
              user: userData,
              tokenAccess: accessToken,
              tokenRefresh: refreshTokenValue
            }
          });
          
          // The login/fulfilled reducer will handle storing in localStorage
          
          toast.success("Logged in with Google");
          
          // Add a slight delay before navigating to ensure Redux state is updated
          setTimeout(() => {
            navigate("/");
          }, 100);
          
        } catch (error) {
          console.error('Error parsing user data:', error);
          toast.error("Error processing login data");
        }
      } else {
        // If no user data but we have a token, try to use it
        console.warn('No user data found in redirect, but token is present');
        dispatch(setAuthToken(accessToken));
        toast.success("Logged in with Google");
        navigate("/");
      }
    } else if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams, dispatch, navigate]);


  useEffect(() => {
    // Handle errors from Redux
    if (error && errormessage) {
      toast.error(errormessage);
      // Clear the error after showing it to prevent duplicate toasts
      dispatch(clearError());
    }

    // Handle successful login
    if (token && !loading) {
      navigate("/");
    }
    
    // Clean up function to clear errors when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [error, errormessage, token, loading, navigate, dispatch]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/user/google`;
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
    // Store the email in component state
    setResetEmail(email);
    setShowForgotPasswordModal(false);
    setShowOtpModal(true);
  };

  const handleOtpVerify = (otp) => {
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