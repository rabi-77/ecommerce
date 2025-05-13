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

const app= express()
await connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(helmet())
app.use(passport.initialize())

const PORT= process.env.PORT

app.use('/user',user)
app.use("/admin",admin)
app.listen(PORT,()=>console.log(`server is running on ${PORT}`))