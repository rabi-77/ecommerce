import jwt from "jsonwebtoken";
import adminModel from "../../models/adminModel.js";
import bcrypt from "bcrypt";
import { configDotenv } from "dotenv";
configDotenv();

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await adminModel.findOne({ email });
  if (!admin) {
    return res.status(400).json({ message: "admin doesnt exist" });
  }
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).json({ message: "invalid credentials" });

  const tokenAccess = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
    expiresIn: "60m",
  });

  const tokenRefresh = jwt.sign(
    { adminId: admin._id },
    process.env.JWT_REFRESH,
    { expiresIn: "15d" }
  );

  admin.refreshToken = tokenRefresh;
  await admin.save();
  res.json({ tokenAccess, tokenRefresh, admin });
};

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH);
    const admin = await adminModel.findById(decoded.adminId);

    if (!admin || refreshToken !== admin.refreshToken) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const newAccessToken = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "60m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: "Something error happened" });
  }
};

export const adminLogout = async (req, res) => {
  const { _id:adminId } = req.admin;
  try {
  const check=  await adminModel.findByIdAndUpdate(adminId, { refreshToken: null },{new:true});
    res.json({ message: "Admin logged out" });
  } catch (err) {
    res.status(404).json({ message: "something wrong happened" });
  }
};
