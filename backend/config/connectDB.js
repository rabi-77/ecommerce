// const mongoose=require("mongoose")
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI, {
      writeConcern: { w: "majority" },
    });

    console.log(`connected successfully to ${connect.connection.host}`);

    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", { color: true, level: "debug" });
    }

    return connect;
  } catch (er) {
    console.log(`connected unsuccessfully to ${process.env.MONGODB_URI}`);
    console.log("what");
    process.exit(1);
  }
};

export default connectDB;
