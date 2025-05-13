import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "username atleast 3 characters")
    .max(16, "username cant exceed 16 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "user name only cntains letters, numbers, - or _"
    ),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(16, "Password cannot exceed 16 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[^\s]+$/,
      "Password must include 1 uppercase, 1 lowercase, 1 number, 1 special character, and no spaces"
    ),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
  token: z.string().min(1, 'Token is required'),
});

export const resendOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  token: z.string().min(1, 'Token is required'),
});
