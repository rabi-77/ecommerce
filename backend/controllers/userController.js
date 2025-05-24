import bcrypt from 'bcrypt'
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import passport from "passport";
import { configDotenv } from "dotenv";
configDotenv();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODE_MAILER_EMAIL || "mymailer66@gmail.com",
    pass: process.env.NODE_MAILER_PASSWORD || "viqt sxjn hmzb lyno",
  },
});


console.log("Email config status:", {
  email: process.env.NODE_MAILER_EMAIL ? "Environment variable loaded" : "Using fallback",
  password: process.env.NODE_MAILER_PASSWORD ? "Environment variable loaded" : "Using fallback"
});
// Function to generate and send OTP
export const generateAndSendOtp = async (email) => {
  console.log("Generating OTP for", email);

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes for better user experience

  try {
    // Log the plaintext OTP for development purposes
    console.log("Generated OTP:", otp);
    
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL || "mymailer66@gmail.com",
      to: email,
      subject: "Password Reset - Verification Code",
      text: `Your password reset verification code is ${otp}. It expires in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Password Reset Verification</h2>
        <p>Your password reset verification code is:</p>
        <div style="background-color: #edf2f7; padding: 12px; border-radius: 4px; font-size: 24px; letter-spacing: 2px; text-align: center; font-weight: bold;">${otp}</div>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #718096; font-size: 14px;">If you did not request this code, please ignore this email.</p>
      </div>`
    });
    
    return { otp, expiresAt };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

const register = async (req, res) => {
  console.log("hey");

  const { username, email, password } = req.body;
  console.log(req.body);

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      // Special case: Google user trying to add password
      if (existingUser.authProvider === "google" && !existingUser.password) {
        // Allow Google users to add password capability
        existingUser.password = password; 
        await existingUser.save();
        
        return res.status(200).json({ 
          message: "Password added to your Google account. You can now log in with either method.",
          email,
          isPasswordAddedToGoogleAccount: true  
        });
      }
      return res.status(400).json({ message: "Email already exists" });
    }
    console.log("before otp");
    if (password.length > 16 || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be between 8 and 16 characters" });
    }
    // Generate and send OTP
    const { otp, expiresAt } = await generateAndSendOtp(email);
    console.log(otp);
    console.log("old otp");

    // Create JWT with user data
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log('bcrypting');

    const hashedOtp = await bcrypt.hash(otp, 10);
    console.log("hashing");

    const token = jwt.sign(
      { username, email, password: hashedPassword, otp: hashedOtp, expiresAt },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    console.log("token", token);

    res.status(201).json({ message: "OTP sent to your email", email, token });
  } catch (error) {
    console.log("faileuire");

    if (error.message === "Failed to send OTP email") {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const verify = async (req, res) => {
  console.log("Verifying OTP");

  const { email, otp, token } = req.body;
  console.log("verify",email,otp,token);

  try {
    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: "Registration session expired" });
    }

    // Check if email matches and OTP hasn't expired
    if (payload.email !== email) {
      return res.status(400).json({ message: "Invalid registration session" });
    }
    
    // Check if OTP has expired
    if (payload.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired, please request a new one" });
    }

    // Verify the OTP using bcrypt compare
    const isMatch = await bcrypt.compare(otp, payload.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    console.log("OTP verified successfully");

    // Create new user
    const user = new userModel({
      username: payload.username,
      email: payload.email,
      password: payload.password,
      authProvider: "email",
      role: "user",
      isVerified: true,
    });
    console.log("Saving user to database");

    await user.save();

    res.json({ message: "Account verified, please log in" });
    console.log("Verification complete");
  } catch (error) {
    console.log(error.message, "Error during verification");

    if (error.code === 11000 && error.keyValue?.email) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const resend = async (req, res) => {
  const { email, token } = req.body;

  try {
    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: "Registration session expired" });
    }

    
    if (payload.email !== email) {
      return res.status(400).json({ message: "Invalid registration session" });
    }

    // Explicitly invalidate the old token by setting a new expiration time
    // Generate and send new OTP
    const { otp, expiresAt } = await generateAndSendOtp(email);
    console.log("resendotp", otp);
    
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Create a completely new token with the new OTP
    const newToken = jwt.sign(
      {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        otp: hashedOtp,
        expiresAt,
        // Add a timestamp to ensure the token is unique
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.json({ 
      message: "New OTP sent to your email", 
      token: newToken,
      // Send the expiration time to the frontend
      expiresAt: expiresAt
    });
  } catch (error) {
    if (error.message === "Failed to send OTP email") {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const googleAuthCallback = async (req, res) => {
  try {
    console.log('Google auth callback received user:', req.user);
    
    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Generate access token - use same format as regular login
    const tokenAccess = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '20m' }
    );
    
    // Use JWT_REFRESH for consistency with regular login
    const refreshSecret = process.env.JWT_REFRESH || process.env.JWT_SECRET;
    
    const tokenRefresh = jwt.sign(
      { userId: req.user._id },
      refreshSecret,
      { expiresIn: '15d' }
    );
    
    // Store refresh token in the database
    req.user.refreshToken = tokenRefresh;
    await req.user.save();
    console.log('Saved refresh token to user:', req.user._id);
    
    // Create a user object with necessary information - same format as regular login
    const userData = {
      _id: req.user._id,
      username: req.user.username || req.user.email.split('@')[0],
      email: req.user.email,
      role: req.user.role,
      googleId: req.user.googleId,
      authProvider: req.user.authProvider,
      image: req.user.image
    };
    
    // Encode user data for URL
    const encodedUserData = encodeURIComponent(JSON.stringify(userData));
    
    // Redirect to frontend home with token and user data
    // Make sure the URL has the correct port and parameters
    res.redirect(`http://localhost:5173/?tokenAccess=${tokenAccess}&tokenRefresh=${tokenRefresh}&userData=${encodedUserData}`);
    console.log('Redirecting to frontend with user data:', userData);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect("http://localhost:5173/login?error=" + encodeURIComponent(error.message || 'Google auth failed'));
  }
};

 const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "user doesnt exist" });
    }
    if(user.isBlocked){
      return res.status(403).json({message:'the user is blocked'})
    }
    console.log('Login attempt for:', email);
   
    
  
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: "invalid credentials" });
    }
    const tokenAccess = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "20m",
    });

    const tokenRefresh = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH,
      {
        expiresIn: "15d",
      }
    );

    user.refreshToken = tokenRefresh;
    await user.save();
    console.log('logg');

    res.json({
      tokenAccess,
      tokenRefresh,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        image: user.image
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refresh token is required" });
    }
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH);
    } catch (error) {
      return res.status(401).json({ message: "invalid refresh token" });
    }
    const user = await userModel.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "invalid refresh token" });
    }
    const tokenAccess = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "20m",
    });
    res.json({ tokenAccess });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

const userLogout = async (req, res) => {
  try {
    const {email}= req.user
    const user = await userModel.findOne({ email });
  
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    res.json({ message: "logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

const checkUserStatus = async (req, res) => {
  try {
    console.log('Checking user status...');
    const userId = req.user;
    console.log('User ID:', userId);
    
    const user = await userModel.findById(userId);
    console.log('User:', user);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
        isBlocked: true
      });
    }
    
    res.json({
      message: "User is active",
      isBlocked: false,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Error checking user status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password - Request OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
// Check if user authenticated with Google and has no password
if (user.authProvider === 'google' && !user.password) {
  return res.status(400).json({ 
    message: 'This email is registered with Google. Please use Google Sign-In or register with email and password first.'
  });
}
    
    // Generate and send OTP
    try {
      const { otp, expiresAt } = await generateAndSendOtp(email);
      
      
      console.log('Password reset OTP for', email, ':', otp);
      
      // Save OTP to user document using the existing structure
      user.otp = {
        code: otp,
        expiresAt: expiresAt
      };
      await user.save();
      
      return res.status(200).json({ 
        message: 'Password reset OTP sent to your email',
        email
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password with OTP verification
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, validateOnly } = req.body;
    
    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }
    
    if (!user.otp.expiresAt || Date.now() > user.otp.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    console.log('Received OTP:', otp);
    
    const isValidOtp = await bcrypt.compare(otp, user.otp.code);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    
    if (validateOnly) {
      return res.status(200).json({ message: 'OTP is valid' });
    }
    
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    
    console.log('Resetting password for user:', user.email);
    
    
    user.password = newPassword;
    user.otp = {
      code: undefined,
      expiresAt: undefined
    };
    await user.save();
    
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Resend Password Reset OTP
const resendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
    
// Check if user authenticated with Google and has no password
if (user.authProvider === 'google' && !user.password) {
  return res.status(400).json({ 
    message: 'This email is registered with Google. Please use Google Sign-In or register with email and password first.'
  });
}
    
    // Generate and send new OTP
    try {
      const { otp, expiresAt } = await generateAndSendOtp(email);
      
      // Log the OTP for development purposes
      console.log('Password reset OTP for', email, ':', otp);
      
      // Save OTP to user document using the existing structure
      user.otp = {
        code: otp,
        expiresAt: expiresAt
      };
      await user.save();
      
      return res.status(200).json({ 
        message: 'New password reset OTP sent to your email',
        email
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Resend password reset OTP error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export { register, resend, verify, googleAuth, googleAuthCallback, userLogin, refreshAccessToken, userLogout, checkUserStatus, forgotPassword, resetPassword, resendPasswordResetOtp };
