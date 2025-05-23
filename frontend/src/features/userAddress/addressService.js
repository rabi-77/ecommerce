import api from "../../apis/user/api";

export const getAllAddresses= async ()=>{
    const response= await api.get('/addresses')
    return response.data
}

export const addAddress= async (address)=>{
    const response= await api.post('/address',address)
    return response.data
}

export const updateAddress= async (addressId,address)=>{
    const response= await api.put(`/address/${addressId}`,address)
    return response.data
}

export const deleteAddress= async (addressId)=>{
    const response= await api.delete(`/address/${addressId}`)
    return response.data
}

export const setDefaultAddress= async (addressId)=>{
    const response= await api.put(`/address/${addressId}/default`)
    return response.data
}   

