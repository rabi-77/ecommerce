import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { resendPasswordOtp, resetPasswordWithOtp, clearPasswordResetErrors } from "../../features/authSlice";

const OtpVerificationModal = ({ isOpen, onClose, onVerify }) => {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60); 
  const dispatch = useDispatch();
  
  const { 
    passwordResetEmail,
    passwordResetLoading, 
    passwordResetSuccess, 
    passwordResetError, 
    passwordResetMessage 
  } = useSelector((state) => state.auth);
  
  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [countdown, isOpen]);
  
  useEffect(() => {
    if (isOpen) {
      setCountdown(60);
      
      if (passwordResetError) {
        dispatch(clearPasswordResetErrors());
      }
    }
  }, [isOpen, passwordResetSuccess, passwordResetError, passwordResetEmail, dispatch]);
  
  useEffect(() => {
    if (passwordResetMessage && isOpen && passwordResetSuccess && passwordResetMessage.includes("sent")) {
      toast.success(passwordResetMessage);
      setCountdown(60); 
    }
  }, [passwordResetMessage, passwordResetSuccess, isOpen]);
  
  const handleResendOtp = () => {
    if (passwordResetEmail) {
      dispatch(resendPasswordOtp(passwordResetEmail));
    } else {
      toast.error("Email is required");
      onClose();
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error("OTP must be a 6-digit number");
      return;
    }
    
    dispatch(clearPasswordResetErrors());
    
    
    if (!passwordResetEmail) {
      toast.error("Email information is missing. Please start over.");
      onClose();
      return;
    }
    
    dispatch(resetPasswordWithOtp({
      email: passwordResetEmail,
      otp: otp,
      newPassword: null, 
      validateOnly: true
    })).then(result => {
      if (!result.error) {
        dispatch(clearPasswordResetErrors());
        onVerify(otp);
      } else {
        toast.error(result.payload || "Invalid OTP");
      }
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/30 md:justify-center md:pl-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Enter OTP</h3>
        <p className="mb-4 text-sm text-gray-600">We've sent a verification code to <strong>{passwordResetEmail || 'your email'}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="otp" className="block mb-2">OTP Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter 6-digit code"
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">OTP expires in {countdown} seconds</p>
              {countdown === 0 && (
                <p className="text-xs text-red-500">OTP expired. Please resend.</p>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-blue-500 text-sm"
              disabled={passwordResetLoading || countdown > 50} // Prevent immediate resend
            >
              {passwordResetLoading ? "Sending..." : countdown > 50 ? `Resend in ${countdown - 50}s` : "Resend OTP"}
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
                disabled={countdown === 0} // Disable verify button if OTP expired
              >
                Verify
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpVerificationModal;
