import { config } from 'dotenv'
config()
console.log(process.env.NODE_MAILER_EMAIL);

import express from 'express'
import cors from "cors"
import helmet from 'helmet'

import connectDB from './config/connectDB.js'
import user from './routes/userRoutes.js'
import admin from './routes/adminRoutes.js';
import passport from 'passport';
import './config/passport.js'

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

// Add a test endpoint to verify server is running
// app.get('/test', (req, res) => {
//   res.json({ message: 'Server is running correctly' });
// });

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));