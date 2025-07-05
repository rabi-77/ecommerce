import adminModel from "../models/adminModel.js";
import jwt from 'jsonwebtoken'


export const authenticateAdmin = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' })
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET)
        const admin = await adminModel.findById(verify.adminId).select('-password')

        if (!admin) {
            return res.status(401).json({ message: 'Admin not found' })
        }

        req.admin = admin
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid authentication token' })
    }
}
//authorize
export const checkAdminAuth = (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'you are not an admin,Authentication required' });
    }
    next();
  };
  
