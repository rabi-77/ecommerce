import jwt from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
configDotenv();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    console.log('Decoded token:', decoded);
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }

};
