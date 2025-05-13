import axios from "axios";
import { API_URL } from "../config";


const URL= `${API_URL}/user/register`

export const registerUser= async(userData)=>{
    try{
        console.log(userData);
        
    const response= await axios.post(`${URL}`,userData)
        console.log('success');
        
    return response.data
    }catch(er){
        console.log(API_URL)
        console.log('hi',er.message)
        throw new Error(er.response?.data?.message || 'someting wrong with registration')
    }
}

export const verifyUser = async ({email,otp,token})=>{
    try{
    const response = await axios.post(`${URL}/verify-otp`,{email,otp,token})
    console.log('hi');
    console.log(response.data);
    
    return response.data

    }catch(er){
        console.log('errrrr',er.message);
        
        throw new Error(er.response?.data?.message || 'someting wrong with registration')
    }
}

export const resendOtp= async ({email,token})=>{
    try{
    const response = await axios.post(`${URL}/resend-otp`,{email,token})
    return response.data
    }catch(er){
        throw new Error(er.response?.data?.message || 'someting wrong with registration')
    }
}

export const loginUser = async (loginData) => {
    try {
      const response = await axios.post(`${API_URL}/user/login`, loginData);
      return response.data;
    } catch (er) {
      throw new Error(er.response?.data?.message || 'Login failed');
    }
};

export const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem('tokenAccess');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(`${API_URL}/user/check-status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (er) {
      if (er.response?.status === 403 && er.response?.data?.isBlocked) {
        // If user is blocked, immediately clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('tokenAccess');
        localStorage.removeItem('tokenRefresh');
        return { isBlocked: true, message: er.response.data.message };
      }
      throw new Error(er.response?.data?.message || 'Failed to check user status');
    }
};