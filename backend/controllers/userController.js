import bcrypt from 'bcrypt'
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import passport from "passport";
import { configDotenv } from "dotenv";
import crypto from 'crypto';
import { creditWallet } from '../services/walletService.js';
configDotenv();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODE_MAILER_EMAIL,
    pass: process.env.NODE_MAILER_PASSWORD,
  },
});


("Email config status:", {
  email: process.env.NODE_MAILER_EMAIL ? "Environment variable loaded" : "Using fallback",
  password: process.env.NODE_MAILER_PASSWORD ? "Environment variable loaded" : "Using fallback"
});

export const generateAndSendOtp = async (email) => {
  ("Generating OTP for", email);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; 

  try {
    ("Generated OTP:", otp);
    
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL ,
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
  ("hey");

  const { username, email, password, referralCode: referralCodeInput } = req.body;
  ('referal',referralCodeInput);
  
  (req.body);

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      if (existingUser.authProvider === "google" && !existingUser.password) {
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
    ("before otp");
    if (password.length > 16 || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be between 8 and 16 characters" });
    }
    const { otp, expiresAt } = await generateAndSendOtp(email);
   console.log(otp);
    console.log('fresh');
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedOtp = await bcrypt.hash(otp, 10);
    const token = jwt.sign(
      { username, email, password: hashedPassword, otp: hashedOtp, expiresAt, referralCodeInput },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );
    ("token", token);

    res.status(201).json({ message: "OTP sent to your email", email, token });
  } catch (error) {
    ("faileuire");

    if (error.message === "Failed to send OTP email") {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const verify = async (req, res) => {
  ("Verifying OTP");

  const { email, otp, token } = req.body;
  ("verify",email,otp,token);

  try {
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: "Registration session expired" });
    }
("payload",payload);

    if (payload.email !== email) {
      return res.status(400).json({ message: "Invalid registration session" });
    }
    
    if (payload.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired, please request a new one" });
    }

    const isMatch = await bcrypt.compare(otp, payload.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    ("OTP verified successfully");

    const generateReferralCode = async () => {
      let code;
      let exists = true;
      while (exists) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        exists = await userModel.exists({ referralCode: code });
      }
      return code;
    };

    let referrerId = null;
    let referralStatus = 'NONE';
    if (payload.referralCodeInput) {
      const referrer = await userModel.findOne({ referralCode: payload.referralCodeInput.toUpperCase() });
      if (referrer && referrer.email !== payload.email) {
        referrerId = referrer._id;
        referralStatus = 'SUCCESS';
      } else {
        referralStatus = 'INVALID';
      }
    }

    const user = new userModel({
      username: payload.username,
      email: payload.email,
      password: payload.password,
      authProvider: "email",
      role: "user",
      isVerified: true,
      referralCode: await generateReferralCode(),
      referredBy: referrerId,
    });
    ("Saving user to database");

    await user.save();

    if (referrerId) {
      try {
        await creditWallet(referrerId, 50, { source: 'REFERRAL', description: `Referral reward for inviting ${user.email}` });
      } catch (e) {
        console.error('Failed to credit wallet for referral:', e.message);
      }
    }

    res.json({ message: "Account verified, please log in", referralStatus });
    ("Verification complete");
  } catch (error) {
    (error.message, "Error during verification");

    if (error.code === 11000 && error.keyValue?.email) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const resend = async (req, res) => {
  const { email, token } = req.body;

  try {
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: "Registration session expired" });
    }

    
    if (payload.email !== email) {
      return res.status(400).json({ message: "Invalid registration session" });
    }

    const { otp, expiresAt } = await generateAndSendOtp(email);
    console.log("resendotp", otp);
    
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    const newToken = jwt.sign(
      {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        otp: hashedOtp,
        expiresAt,
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.json({ 
      message: "New OTP sent to your email", 
      token: newToken,
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
    ('Google auth callback received user:', req.user);
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const tokenAccess = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '120m' }
    );
    
    const refreshSecret = process.env.JWT_REFRESH || process.env.JWT_SECRET;
    
    const tokenRefresh = jwt.sign(
      { userId: req.user._id },
      refreshSecret,
      { expiresIn: '15d' }
    );
    
    req.user.refreshToken = tokenRefresh;
    await req.user.save();
    ('Saved refresh token to user:', req.user._id);
    
    const userData = {
      _id: req.user._id,
      username: req.user.username || req.user.email.split('@')[0],
      email: req.user.email,
      role: req.user.role,
      googleId: req.user.googleId,
      authProvider: req.user.authProvider,
      image: req.user.image
    };
    
    const encodedUserData = encodeURIComponent(JSON.stringify(userData));
    
    res.redirect(`https://mydunk.shop/?tokenAccess=${tokenAccess}&tokenRefresh=${tokenRefresh}&userData=${encodedUserData}`);
    ('Redirecting to frontend with user data:', userData);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect("https://mydunk.shop/login?error=" + encodeURIComponent(error.message || 'Google auth failed'));
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
    ('Login attempt for:', email);
   
    
  
    const isMatch = await bcrypt.compare(password, user.password);
    ('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: "invalid credentials" });
    }
    const tokenAccess = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "120m",
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
    ('logg');

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
    (err);
    res.status(500).json({ message: "server error" });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    ('user refresh');
    
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
      expiresIn: "50m",
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
    ('Checking user status...');
    const userId = req.user;
    ('User ID:', userId);
    
    const user = await userModel.findById(userId);
    ('User:', user);
    
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
if (user.authProvider === 'google' && !user.password) {
  return res.status(400).json({ 
    message: 'This email is registered with Google. Please use Google Sign-In or register with email and password first.'
  });
}
    
    try {
      const { otp, expiresAt } = await generateAndSendOtp(email);
      
      
      console.log('Password reset OTP for', email, ':', otp);
      
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

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, validateOnly } = req.body;
    
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
    
    ('Received OTP:', otp);
    
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
    
    
    ('Resetting password for user:', user.email);
    
    
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

const resendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
    
if (user.authProvider === 'google' && !user.password) {
  return res.status(400).json({ 
    message: 'This email is registered with Google. Please use Google Sign-In or register with email and password first.'
  });
}
    
    try {
      const { otp, expiresAt } = await generateAndSendOtp(email);
      
      console.log('Password reset resend OTP for', email, ':', otp);
      
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
