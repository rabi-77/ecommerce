import { config } from 'dotenv'
config()
import express from 'express'
import cors from "cors"
import helmet from 'helmet'

import connectDB from './config/connectDB.js'
import user from './routes/userRoutes.js'
import admin from './routes/adminRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import passport from 'passport';
import './config/passport.js'
import { notFound, errorHandler } from './middlewares/errorMiddleware.js'
import Order from './models/orderModel.js';
const app = express()
await connectDB()

// Apply middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(helmet())
// Disable helmet completely for now to troubleshoot
// app.use(helmet({
//   crossOriginResourcePolicy: false
// }));

app.use(passport.initialize())

const PORT = process.env.PORT

app.use('/user', user)
app.use("/admin", admin)
app.use('/orders', orderRoutes)

// Add a test endpoint to verify server is running
// app.get('/test', (req, res) => {
//   res.json({ message: 'Server is running correctly' });
// });
app.get('/test-orders', async (req, res) => {
    try {
      const orders = await Order.find();
      res.status(200).json({ message: 'success', items: orders.length });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
  });
// Error handling middleware
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => (`Server is running on ${PORT}`));