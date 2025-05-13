import axios from "axios";
import api from "../../../apis/admin/api";

const API = api;

const getCategories = async (page, size, search) => {
    
    console.log('get the categories');
    
  const response =await api.get("/categories", { params: { page, size, search } });
    console.log('lol');
    
    return response.data
};

const addCategory= async (categoryData)=>{
    console.log('hi');
    console.log(categoryData);
    
    const response = await api.post("/add-category",categoryData,{
        headers:{"Content-Type":"multipart/form-data"}
    })
    console.log(response);
    console.log('gogo');
    
    return response.data
}

const editCategory= async (id,categoryData)=>{
    console.log('jiji');
    
    const response= await api.patch(`/edit-category/${id}`,categoryData,{
        headers:{"Content-Type":"multipart/form-data"}
    })

    console.log('jojojoj');
    
    return response.data
}

const deleteCategory= async (id)=>{
    const response= await api.delete(`delete-category/${id}`)
    return response.data
}

export {getCategories,addCategory,editCategory,deleteCategory}