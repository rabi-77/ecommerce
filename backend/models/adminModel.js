import mongoose from "mongoose";

const adminSchema= new mongoose.Schema({
    name:{
        type:String,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        required:true,
        type:String
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

export default mongoose.model('Admin',adminSchema)