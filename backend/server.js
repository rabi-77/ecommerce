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


app.use(cors())
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://mydunk.shop'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(helmet())

// app.use(helmet({
//   crossOriginResourcePolicy: false
// }));

app.use(passport.initialize())

const PORT = process.env.PORT

app.use('/user', user)
app.use("/admin", admin)
app.use('/orders', orderRoutes)


app.get('/test-orders', async (req, res) => {
    try {
      const orders = await Order.find();
      res.status(200).json({ message: 'success', items: orders.length });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
  });

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});