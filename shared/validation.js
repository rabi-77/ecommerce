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
  // Optional referral code – exactly 8 hex characters produced by backend
  referralCode: z
    .string()
    .trim()
    .length(8, "Referral code must be 8 characters")
    .regex(/^[A-Fa-f0-9]{8}$/i, "Referral code must be hexadecimal")
    .optional()
    .or(z.literal("")),
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

// Admin validation schemas
export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Common schema for both Category and Brand validation
const nameDescriptionSchema = (type) => z.object({
  name: z.string()
    .min(2, `${type} name must be at least 2 characters`)
    .max(50, `${type} name cannot exceed 50 characters`)
    .refine(val => val.trim().length > 0, `${type} name cannot be empty or just whitespace`)
    .refine(val => !/^\s+$/.test(val), `${type} name cannot contain only whitespace`),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .refine(val => !val || val.trim().length > 0, "Description cannot be just whitespace")
    .optional(),
});

// Category validation schema
export const categorySchema = nameDescriptionSchema("Category");

// Brand validation schema
export const brandSchema = nameDescriptionSchema("Brand");

// Product validation schema
export const productSchema = z.object({
  name: z.string()
    .min(3, "Product name must be at least 3 characters")
    .max(100, "Product name cannot exceed 100 characters")
    .refine(val => val.trim().length > 0, "Product name cannot be empty or just whitespace")
    .refine(val => !/^\s+$/.test(val), "Product name cannot contain only whitespace"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters")
    .refine(val => val.trim().length >= 10, "Description must be at least 10 non-whitespace characters")
    .refine(val => !/^\s+$/.test(val), "Description cannot contain only whitespace"),
  price: z.string().or(z.number())
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number")
    .refine(val => Number(val) <= 1000000, "Price cannot exceed 1,000,000"),
  category: z.string()
    .min(1, "Category is required")
    .refine(val => val.trim().length > 0, "Category cannot be empty"),
  brand: z.string()
    .min(1, "Brand is required")
    .refine(val => val.trim().length > 0, "Brand cannot be empty"),
  variants: z.string().refine(val => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, "Variants must be a valid JSON array with at least one variant"),
});
