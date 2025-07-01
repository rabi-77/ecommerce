import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Use the same nodemailer configuration as in userController.js
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODE_MAILER_EMAIL ,
    pass: process.env.NODE_MAILER_PASSWORD 
  },
});

// Controller for requesting email change
export const requestEmailChange = async (req, res) => {


  const requestId = Date.now() + Math.random().toString(36).substring(2, 10);
  console.log(`[REQUEST ${requestId}] Starting email verification`);
  try {
    const { newEmail, password } = req.body;
    const userId = req.user;

    // Validate inputs
    if (!newEmail || !password) {
      return res.status(400).json({
        message: "New email and current password are required",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      console.log("User not found");
      
      return res.status(404).json({ message: "User not found" });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({
        message:
          "Google-authenticated users cannot change their email this way",
      });
    }

    if (user.email === newEmail) {
      return res.status(400).json({
        message: "New email must be different from current email",
      });
    }

    // Check if new email is already in use
    const emailExists = await userModel.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(400).json({
        message: "Email is already in use",
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(400).json({
        message: "Cannot verify password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24); // Token valid for 24 hours

    // Save token and new email to user
    user.newEmail = newEmail;
    user.emailChangeToken = token;
    user.emailChangeTokenExpiry = expiryTime;
    await user.save();

    console.log('User after save:', {
      emailChangeToken: user.emailChangeToken,
      email: user.email
    });

    // Create verification URL
    
    const frontendURL = process.env.FRONTEND_URL ;
    const verificationURL = `${frontendURL}/verify-email?token=${token}`;

    if (process.env.NODE_ENV !== "production") {
      console.log("\n\n==== EMAIL VERIFICATION LINK ====");
      console.log(verificationURL);
      console.log("==================================\n\n");
    }

    // Send verification email
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL ,
      to: newEmail,
      subject: "Verify Your New Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your New Email</h2>
          <p>Hello,</p>
          <p>We received a request to change your email address. Please click the button below to verify your new email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;" target="_self">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${verificationURL}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request this change, please ignore this email or contact our support team.</p>
          <p>Thanks,<br>Your App Team</p>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("\n\n==== EMAIL CONTENT ====");
      console.log(`To: ${newEmail}`);
      console.log(`Subject: Verify Your New Email Address`);
      console.log(`Verification Link: ${verificationURL}`);
      console.log("========================\n\n");
    }

    res.status(200).json({
      message: "Verification email sent to your new email address",
    });
  } catch (err) {
    console.error("Error requesting email change:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller for verifying and completing email change
export const verifyEmailChange = async (req, res) => {

  const requestId = Date.now() + Math.random().toString(36).substring(2, 15);
  console.log(`[REQUEST ${requestId}] Starting email verification`);
  
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Find user with this token
    const user = await userModel.findOne({
      emailChangeToken: token
    });
    console.log('are we finding him antime??',user);
    
    if (!user) {
      console.log('is it stopping here????????????',user);
      
      return res.status(400).json({
        message: "Invalid or expired verification link",
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
      from: process.env.NODE_MAILER_EMAIL ,
      to: previousEmail,
      subject: "Your email address has been changed",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Address Changed</h2>
          <p>Hello,</p>
          <p>Your email address has been successfully changed to ${user.email}.</p>
          <p>If you did not request this change, please contact our support team immediately.</p>
          <p>Thanks,<br>Your App Team</p>
        </div>
      `,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("\n\n==== CONFIRMATION EMAIL CONTENT ====");
      console.log(`To: ${previousEmail}`);
      console.log(`Subject: Your email address has been changed`);
      console.log(`New Email: ${user.email}`);
      console.log("====================================\n\n");
    }

    res.status(200).json({
      message: "Email address updated successfully",
    });
  } catch (err) {
    console.error("Error verifying email change:", err.message);

    // Try to find and clear token fields for the user with this token
    try {
      if (req.query.token) {
        const user = await userModel.findOne({
          emailChangeToken: req.query.token,
        });
        if (user) {
          user.newEmail = undefined;
          user.emailChangeToken = undefined;
          user.emailChangeTokenExpiry = undefined;
          await user.save();
          console.log("Cleared token fields for user after verification error");
        }
      }
    } catch (cleanupErr) {
      console.error(
        "Error during cleanup after verification error:",
        cleanupErr.message
      );
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Controller for changing password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required",
        field: !currentPassword ? "currentPassword" : "newPassword"
      });
    }

    if (newPassword.length > 16 || newPassword.length < 8) {
      return res.status(400).json({ 
        message: "Password must be between 8 and 16 characters",
        field: "newPassword"
      });
    }

    // Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ 
        message: "You don't have a password set. Please use your authentication provider settings.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Current password is incorrect",
        field: "currentPassword"
      });
    }

    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();
    
    try {
      const mailOptions = {
        from: process.env.NODE_MAILER_EMAIL ,
        to: user.email,
        subject: "Your Password Has Been Changed",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Password Change Notification</h2>
            <p>Hello ${user.username || user.email.split('@')[0]},</p>
            <p>This is a confirmation that the password for your account has been changed successfully.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #777; font-size: 12px;">
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password change notification email sent to ${user.email}`);
    } catch (emailError) {
      // Don't fail the password change if email sending fails
      console.error("Failed to send password change notification:", emailError);
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller for cleaning up expired tokens
// export const cleanupAllExpiredTokens = async (req, res) => {
//   try {
//     const result = await userModel.updateMany(
//       { emailChangeTokenExpiry: { $lt: new Date() } },
//       {
//         $unset: {
//           newEmail: "",
//           emailChangeToken: "",
//           emailChangeTokenExpiry: "",
//         },
//       }
//     );

//     res.status(200).json({
//       message: "Cleanup completed successfully",
//       modifiedCount: result.modifiedCount,
//     });
//   } catch (err) {
//     console.error("Error cleaning up expired tokens:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


