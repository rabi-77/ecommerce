import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { resetPasswordWithOtp, clearPasswordResetErrors } from "../../features/authSlice";

const ResetPasswordModal = ({ isOpen, onClose, otp, email }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const dispatch = useDispatch();
  
  const { 
    passwordResetEmail,
    passwordResetLoading, 
    passwordResetSuccess, 
    passwordResetError, 
    passwordResetMessage 
  } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (isOpen) {
    }
  }, [isOpen, passwordResetEmail]);
  
  useEffect(() => {
    if (passwordResetMessage && isOpen) {
      if (passwordResetError) {
        toast.error(passwordResetMessage);
      } else if (passwordResetSuccess && passwordResetMessage.includes("successful")) {
        toast.success(passwordResetMessage);
        setNewPassword("");
        setConfirmPassword("");
        dispatch(clearPasswordResetErrors());
        onClose();
      }
    }
  }, [passwordResetMessage, passwordResetSuccess, passwordResetError, dispatch, isOpen, onClose]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    dispatch(clearPasswordResetErrors());
    
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    
    if (!/[a-z]/.test(newPassword)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }
    
    if (!/[0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      toast.error("Password must contain at least one special character");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    
    dispatch(resetPasswordWithOtp({
      email: email, 
      otp: otp,
      newPassword: newPassword
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/30 md:justify-center md:pl-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Reset Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block mb-2">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Minimum 8 characters"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must contain at least 8 characters, including uppercase, lowercase, 
              number, and special character.
            </p>
          </div>
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {passwordResetLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
