import adminModel from "../models/adminModel";
import jwt from 'jsonwebtoken'



export const authenticateAdmin=async (req,res, next)=>{
    const token= req.header('Authorization')?.replace('Bearer', '')

    if(!token){
        return res.status(401).json({message:'some issue with token'})
    }

    try{
        const verify=jwt.verify(token,process.env.JWT_SECRET)
        const admin= await adminModel.findById(verify.adminId).select('-password')

        if(!admin){
            return res.status(401).json({message:'Admin not found'})
        }

        req.admin= admin
        next();
    }catch(err){
        return res.status(401).json({message:'invalid token not found'})
    }
}



