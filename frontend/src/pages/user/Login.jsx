import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
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

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { loading, error, errormessage, token } = useSelector(
    (state) => state.auth
  );


  useEffect(() => {
    dispatch(resetAuthState());
    const token = searchParams.get("token");
    const tokenAccess = searchParams.get("tokenAccess");
    const refreshToken = searchParams.get("refreshToken");
    const tokenRefresh = searchParams.get("tokenRefresh");
    const userDataParam = searchParams.get("userData");
    const error = searchParams.get("error");

    const accessToken = tokenAccess || token;
    const refreshTokenValue = tokenRefresh || refreshToken;

    if (accessToken) {
      
      if (userDataParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userDataParam));
          
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
          
          setTimeout(() => {
            navigate("/");
          }, 100);
          
        } catch (error) {
          console.error('Error parsing user data:', error);
          toast.error("Error processing login data");
        }
      } else {
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
    if (error && errormessage) {
      toast.error(errormessage);
      dispatch(clearError());
    }

    if (token && !loading) {
      navigate("/");
    }
    
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

  const [resetEmail, setResetEmail] = useState("");

  const handleForgotPasswordClick = () => {
    dispatch(resetPasswordState());
    setResetEmail("");
    setShowForgotPasswordModal(true);
  };

  const handleOtpSent = (email) => {
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
    dispatch(resetAuthState());
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
      
      {/* Browse as Guest */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="w-full p-2 mt-3 bg-gray-200 text-gray-800 rounded"
      >
        Browse as Guest
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
      
      {/* Removed ToastContainer */}
    </div>
  );
};

export default Login;