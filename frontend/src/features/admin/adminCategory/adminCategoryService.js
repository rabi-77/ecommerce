import axios from "axios";
import api from "../../../apis/admin/api";

const API = api;

const getCategories = async (page, size, search) => {
    
    
  const response =await api.get("/categories", { params: { page, size, search } });
    
    return response.data
};

const addCategory= async (categoryData)=>{
    
    const response = await api.post("/add-category",categoryData,{
        headers:{"Content-Type":"multipart/form-data"}
    })
    
    return response.data
}

const editCategory= async (id,categoryData)=>{
    
    const response= await api.patch(`/edit-category/${id}`,categoryData,{
        headers:{"Content-Type":"multipart/form-data"}
    })

    
    return response.data
}

const deleteCategory= async (id)=>{
    const response= await api.delete(`delete-category/${id}`)
    return response.data
}

const toggleCategoryListing = async (id) => {
    const response = await api.patch(`/toggle-category-listing/${id}`)
    return response.data
}

export {getCategories,addCategory,editCategory,deleteCategory,toggleCategoryListing}