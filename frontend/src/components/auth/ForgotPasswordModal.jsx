import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { forgotPassword, setPasswordResetEmail } from "../../features/authSlice";

const ForgotPasswordModal = ({ isOpen, onClose, onOtpSent }) => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  
  const { 
    passwordResetLoading, 
    passwordResetSuccess, 
    passwordResetError, 
    passwordResetMessage 
  } = useSelector((state) => state.auth);
  
  // Clear form and error states when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form state
      setEmail("");
      setEmail("");
    }
  }, [isOpen, dispatch]);
  
  useEffect(() => {
    if (passwordResetMessage && isOpen) {
      if (passwordResetError) {
        toast.error(passwordResetMessage);
      } else if (passwordResetSuccess) {
        toast.success(passwordResetMessage);
        dispatch(setPasswordResetEmail(email));
        onOtpSent(email);
      }
    }
  }, [passwordResetMessage, passwordResetSuccess, passwordResetError, dispatch, email, isOpen, onOtpSent]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Proceed with password reset request
    
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    dispatch(forgotPassword(email));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/30 md:justify-center md:pl-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Forgot Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="forgotEmail" className="block mb-2">Email</label>
            <input
              type="email"
              id="forgotEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
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
              disabled={passwordResetLoading}
            >
              {passwordResetLoading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
