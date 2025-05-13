import mongoose from "mongoose";

const categorySchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    isListed:{
        type:Boolean,
        default:true
    },
    imageUrl:{
        type:String,
        required:true
    }
},{timestamps:true})

export default mongoose.model('Category',categorySchema)