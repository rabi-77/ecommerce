import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username cannot exceed 30 characters"],
    match: [
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, or hyphens",
    ],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    // required: [true, 'Password is required'],
    minlength: [8, "Password must be at least 8 characters"],
  },
  refreshToken: {
    type: String,
  },
  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, //uniqueness wont affect to null values
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isModified("otp.code") && this.otp?.code) {
    this.otp.code = await bcrypt.hash(this.otp.code, 10);
  }
  next();
});

export default mongoose.model("User", userSchema);
