import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

// ES-module __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Admin from '../models/adminModel.js';

// ------- CONFIG ---------
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123'; // plain text, will be hashed before saving
const ADMIN_NAME = 'Super Admin';
const SALT_ROUNDS = 10;
// ------------------------

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (err) {
    console.error('DB connection error:', err.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    const existing = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      return;
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    const admin = new Admin({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hash,
    });

    await admin.save();
  } catch (err) {
    console.error('Error creating admin:', err.message);
  }
};

connectDB().then(createAdmin).finally(() => mongoose.disconnect());
