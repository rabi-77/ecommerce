import bcrypt from 'bcrypt'
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import passport from "passport";
import { configDotenv } from "dotenv";
configDotenv();
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.NODE_MAILER_EMAIL,
//     pass: process.env.NODE_MAILER_PASSWORD,
//   },
// });
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mymailer66@gmail.com",
    pass: "viqt sxjn hmzb lyno",
  },
});

// Function to generate and send OTP
export const generateAndSendOtp = async (email) => {
  console.log("otp function");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 60 * 1000; // 1 minute

  try {
    console.log("before sending male");
    console.log("Transporter configuration:", transporter.options);
    console.log("Mailer Email:", process.env.NODE_MAILER_EMAIL);
    console.log("Mailer Password:", process.env.NODE_MAILER_PASSWORD);

    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL,
      to: email,
      subject: "Verify Your Email",
      text: `Your OTP is ${otp}. It expires in 1 minute.`,
    });
    return { otp, expiresAt };
  } catch (error) {
    console.log(error);

    console.log("failed emial sendinf", error.message);

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
      return res.status(400).json({ message: "Email already exists" });
    }
    console.log("before otp");
    if (password.length > 16) {
      return res
        .status(400)
        .json({ message: "Password must be less than 16 characters" });
    }
    // Generate and send OTP
    const { otp, expiresAt } = await generateAndSendOtp(email);
    console.log(otp);
    console.log("otp");

    // Create JWT with user data
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log('bcrypting');

    const hashedOtp = await bcrypt.hash(otp, 10);
    console.log("hashing");

    const token = jwt.sign(
      { username, email, password: hashedPassword, otp: hashedOtp, expiresAt },
      process.env.JWT_SECRET,
      { expiresIn: "60s" }
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
  console.log("wow");

  const { email, otp, token } = req.body;
  console.log("heyyy");

  try {
    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: "Registration session expired" });
    }

    // Validate payload
    if (payload.email !== email || payload.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Registration session expired" });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, payload.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    console.log(payload.password);

    // Save verified user
    const user = new userModel({
      username: payload.username,
      email: payload.email,
      password: payload.password,
      authProvider: "email",
      role: "user",
      isVerified: true,
    });
    console.log("issaving");

    await user.save();

    res.json({ message: "Account verified, please log in" });
    console.log("lollll");
  } catch (error) {
    console.log(error.message, "hurh");

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

    // Validate payload
    if (payload.email !== email) {
      return res.status(400).json({ message: "Invalid registration session" });
    }

    // Generate and send new OTP
    const { otp, expiresAt } = await generateAndSendOtp(email);
    const hashedOtp = await bcrypt.hash(otp, 10);
    const newToken = jwt.sign(
      {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        otp: hashedOtp,
        expiresAt,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.json({ message: "New OTP sent to your email", token: newToken });
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
    const user = req.user;
    if (!user) {
      // Redirect to login page with error message if user not found
      return res.redirect(
        "http://localhost:5173/login?error=Google%20auth%20failed"
      );
    }
    // Generate JWT for session
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // Redirect to frontend home with token
    res.redirect(`http://localhost:5173/?token=${token}`);
  } catch (error) {
    res.redirect("http://localhost:5173/login?error=Google%20auth%20failed");
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
    const isMatch = await bcrypt.compare(password, user.password);
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
    
    res.json({ tokenAccess, tokenRefresh, user });
  } catch (err) {
    res.status(500).json({ message: err.message + "server error" });
  }
};

 const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH);
    const user = await userModel.findById(decoded.userId);

    if (!user || refreshToken !== user.refreshToken) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: "Something error happened" });
  }
};

 const userLogout = async (req, res) => {
  console.log("hey");

  const { user } = req.body;
  console.log(user, "hey");

  try {
    await userModel.findByIdAndUpdate(user, { refreshToken: null });
    res.json({ message: "user logged out" });
  } catch (err) {
    console.log(err.message);

    res.status(404).json({ message: "something wrong happened" });
  }
};

const checkUserStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: "Your account has been blocked", 
        isBlocked: true 
      });
    }
    
    res.status(200).json({ 
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

export { register, resend, verify, googleAuth, googleAuthCallback, userLogin, refreshAccessToken, userLogout, checkUserStatus };
