// import { useEffect, useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { verifyOtpSchema } from '../../../shared/validation';

// const OtpModal = ({ email, onClose }) => {
//   const [timeLeft, setTimeLeft] = useState(60);
//   const [resendDisabled, setResendDisabled] = useState(true);
//   const { register, handleSubmit, formState: { errors } } = useForm({
//     resolver: zodResolver(verifyOtpSchema.omit({ email: true })),
//   });

//   useEffect(() => {
//     let interval = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (timeLeft <= 30) setResendDisabled(false);
//   }, [timeLeft]);

//   const onSubmit = async (data) => {
//     try {
//       const { data: response } = await axios.post('/api/auth/verify-otp', { email, otp: data.otp });
//       toast.success(response.message);
//       onClose();
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Verification failed');
//     }
//   };

//   const handleResend = async () => {
//     try {
//       const { data } = await axios.post('/api/auth/resend-otp', { email });
//       toast.success(data.message);
//       setTimeLeft(60);
//       setResendDisabled(true);
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Resend failed');
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//       <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
//         <h2 className="text-xl font-bold mb-4">Verify OTP</h2>
//         <p className="mb-2">OTP sent to {email}</p>
//         <p className="mb-4">Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           <input {...register('otp')} placeholder="Enter 6-digit OTP" className="w-full p-2 border rounded" maxLength="6" />
//           {errors.otp && <p className="text-red-500 text-sm">{errors.otp.message}</p>}
//           <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Verify OTP</button>
//         </form>
//         <button onClick={handleResend} disabled={resendDisabled} className={`w-full mt-4 p-2 rounded ${resendDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 text-white'}`}>
//           Resend OTP
//         </button>
//         <button onClick={onClose} className="w-full mt-2 text-sm text-gray-600">Cancel</button>
//       </div>
//     </div>
//   );
// };

// export default OtpModal;