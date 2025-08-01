import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { register, verifyOtp, resend, resetAuthState, setShowOtpModal, clearError } from '../../features/authSlice';
import { registerSchema, verifyOtpSchema } from '../../../../shared/validation';
// import { API_URL } from '../../../../config';
import { API_URL } from '../../config'
import Input from '../../components/common/Input';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, verifyLoading, resendLoading, success, error, errormessage, successMessage, email, token, showOtpModal, isVerified, otpExpiresAt } = useSelector((state) => state.auth);
  useEffect(() => {
    dispatch(resetAuthState()); 
  }, []);
  const { register: formRegister, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors }, reset: resetForm } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const { register: otpRegister, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors },reset: resetOtpForm } = useForm({
    resolver: zodResolver(verifyOtpSchema.omit({ email: true, token: true })),
  });

  const [timeLeft, setTimeLeft] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);
  const timerRef = useRef(null);

  const startTimer = () => {
    // clear existing interval
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (success && showOtpModal) {
      toast.success('OTP sent to your email');
      resetOtpForm();
      // Disable until success arrives; countdown will restart in success handler
      setTimeLeft(30);
      setResendDisabled(true);
      startTimer();
    }
  }, [success, showOtpModal, resetOtpForm]);
  
  useEffect(() => {
    if (showOtpModal) {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showOtpModal]);
  
  useEffect(() => {
    if (error) {
      toast.error(errormessage);
      if (errormessage === 'Registration session expired') {
        resetForm();
        resetOtpForm();
        setTimeLeft(30);
        setResendDisabled(true);
        dispatch(resetAuthState());
      } else {
        dispatch(clearError());
      }
    }
    
    if (isVerified) {
      if (successMessage && successMessage.includes('Google account')) {
        toast.success(successMessage);
      } else {
        toast.success('Account verified, please log in');
      }
      resetForm();
      resetOtpForm();
      setTimeLeft(30);
      setResendDisabled(true);
      
      setTimeout(() => {
        navigate('/login');
        dispatch(resetAuthState());
      }, 1500); 
    }
  }, [error, errormessage, isVerified, navigate, dispatch, resetForm, resetOtpForm]);

  const onRegisterSubmit = async (data) => {
    const payload = {
      ...data,
      referralCode: data.referralCode?.trim() || undefined,
    };
    dispatch(register(payload));
  };

  const onOtpSubmit = async (data) => {
    dispatch(verifyOtp({ email, otp: data.otp, token }));
    resetOtpForm()
  };

  const handleResend = async () => {
    dispatch(resend({ email, token }));
    // Disable until success arrives; countdown will restart in success handler
    setResendDisabled(true);
    resetOtpForm();
    // Do not start timer yet – wait for success effect
  };

  const closeModal = () => {
    dispatch(setShowOtpModal(false));
    dispatch(resetAuthState());
    resetForm();
    resetOtpForm()
    setTimeLeft(30)
    setResendDisabled(true)
  };
  const handleGoogleLogin=()=>{
    window.location.href = `${API_URL}/user/google`;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
        <div>
          <Input
            {...formRegister('username')}
            placeholder="Username"
            className="w-full"
            disabled={loading}
          />
          {registerErrors.username && <p className="text-red-500 text-sm">{registerErrors.username.message}</p>}
        </div>
        <div>
          <Input
            type="email"
            {...formRegister('email')}
            placeholder="Email"
            className="w-full"
            disabled={loading}
          />
          {registerErrors.email && <p className="text-red-500 text-sm">{registerErrors.email.message}</p>}
        </div>
        <div>
          <Input
            type="password"
            {...formRegister('password')}
            placeholder="Password"
            className="w-full"
            disabled={loading}
          />
          {registerErrors.password && <p className="text-red-500 text-sm">{registerErrors.password.message}</p>}
        </div>
        <div>
          <Input
            {...formRegister('referralCode')}
            placeholder="Referral code (optional)"
            className="w-full"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full p-2 rounded ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <button
        onClick={handleGoogleLogin}
        className="w-full p-2 mt-4 bg-red-500 text-white rounded"
        disabled={loading}
      >
        Sign in with Google
      </button>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="w-full p-2 mt-3 bg-gray-200 text-gray-800 rounded"
      >
        Browse as Guest
      </button>
      <p className="mt-2 text-center">
        Already have an account? <a href="/login" className="text-blue-500">Login</a>
      </p>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Verify OTP</h3>
            <p className="mb-4">Enter the OTP sent to {email}</p>
            <p className="mb-4">Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
            <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
              <div>
                <Input
                  {...otpRegister('otp')}
                  placeholder="Enter 6-digit OTP"
                  className="w-full"
                  maxLength="6"
                  disabled={verifyLoading || resendLoading}
                />
                {otpErrors.otp && <p className="text-red-500 text-sm">{otpErrors.otp.message}</p>}
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className={`flex-1 p-2 rounded ${verifyLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                  disabled={verifyLoading || resendLoading}
                >
                  {verifyLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 p-2 rounded bg-gray-500 text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled || resendLoading || verifyLoading}
              className={`w-full p-2 mt-4 rounded ${(resendDisabled || resendLoading || verifyLoading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 text-white'}`}
            >
              {resendLoading ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      {/* <ToastContainer /> */}
    </div>
  );
};

export default Register;