import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Use the same nodemailer configuration as in userController.js
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODE_MAILER_EMAIL || "mymailer66@gmail.com",
    pass: process.env.NODE_MAILER_PASSWORD || "viqt sxjn hmzb lyno",
  },
});

// Controller for requesting email change
export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!newEmail || !password) {
      return res.status(400).json({ 
        message: "New email and current password are required" 
      });
    }

    // Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is using Google auth
    if (user.authProvider === 'google') {
      return res.status(400).json({ 
        message: "Google-authenticated users cannot change their email this way" 
      });
    }

    // Check if new email is different from current
    if (user.email === newEmail) {
      return res.status(400).json({ 
        message: "New email must be different from current email" 
      });
    }

    // Check if new email is already in use
    const emailExists = await userModel.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(400).json({ 
        message: "Email is already in use" 
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(400).json({ 
        message: "Cannot verify password" 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid password" 
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24); // Token valid for 24 hours

    // Save token and new email to user
    user.newEmail = newEmail;
    user.emailChangeToken = token;
    user.emailChangeTokenExpiry = expiryTime;
    await user.save();

    // Create verification URL
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationURL = `${frontendURL}/verify-email?token=${token}`;

    // Send verification email
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL || "mymailer66@gmail.com",
      to: newEmail,
      subject: 'Verify Your New Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your New Email</h2>
          <p>Hello,</p>
          <p>We received a request to change your email address. Please click the button below to verify your new email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${verificationURL}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request this change, please ignore this email or contact our support team.</p>
          <p>Thanks,<br>Your App Team</p>
        </div>
      `
    });

    res.status(200).json({ 
      message: "Verification email sent to your new email address" 
    });

  } catch (err) {
    console.error('Error requesting email change:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller for verifying and completing email change
export const verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    
    // Find user with this token
    const user = await userModel.findOne({
      emailChangeToken: token,
      emailChangeTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired verification link" 
      });
    }
    
    // Update email
    const previousEmail = user.email;
    user.email = user.newEmail;
    
    // Clear email change fields
    user.newEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeTokenExpiry = undefined;
    
    await user.save();
    
    // Send confirmation email to old address
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL || "mymailer66@gmail.com",
      to: previousEmail,
      subject: 'Your email address has been changed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Address Changed</h2>
          <p>Hello,</p>
          <p>Your email address has been successfully changed to ${user.email}.</p>
          <p>If you did not request this change, please contact our support team immediately.</p>
          <p>Thanks,<br>Your App Team</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      message: "Email address updated successfully" 
    });
    
  } catch (err) {
    console.error('Error verifying email change:', err);
    
    // Try to find and clear token fields for the user with this token
    try {
      if (req.query.token) {
        const user = await userModel.findOne({ emailChangeToken: req.query.token });
        if (user) {
          user.newEmail = undefined;
          user.emailChangeToken = undefined;
          user.emailChangeTokenExpiry = undefined;
          await user.save();
          console.log('Cleared token fields for user after verification error');
        }
      }
    } catch (cleanupErr) {
      console.error('Error during cleanup after verification error:', cleanupErr);
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

// Controller for cleaning up expired tokens
export const cleanupAllExpiredTokens = async (req, res) => {
  try {
    const result = await userModel.updateMany(
      { emailChangeTokenExpiry: { $lt: new Date() } },
      { 
        $unset: { 
          newEmail: "", 
          emailChangeToken: "", 
          emailChangeTokenExpiry: "" 
        } 
      }
    );
    
    res.status(200).json({ 
      message: "Cleanup completed successfully", 
      modifiedCount: result.modifiedCount 
    });
    
  } catch (err) {
    console.error('Error cleaning up expired tokens:', err);
    res.status(500).json({ message: "Server error" });
  }
};
