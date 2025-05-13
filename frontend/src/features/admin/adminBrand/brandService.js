import api from '../../../apis/admin/api'
import axios from 'axios'

const getBrands= async(page,size,search)=>{
    const response = await api.get('/brands',{params:{page,size,search}})
    return response.data
}

const addBrand= async (brandData)=>{
    const response= await api.post('/add-brand',brandData,{
        headers:{"Content-Type":'multipart/form-data'}
    })
    return response.data
}

const editBrand= async (id,brandData)=>{
    const response= await api.patch(`/edit-brand/${id}`,brandData,{
        headers:{"Content-Type":'multipart/form-data'}
    })
    return response.data
}

const deleteBrand= async (id)=>{
    const response= await api.delete(`/delete-brand/${id}`)
    return response.data
}

export {getBrands,addBrand,editBrand,deleteBrand}