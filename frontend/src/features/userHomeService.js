import publicApi from "../apis/users/publicAPI";

export const getProducts= async (params)=>{
    
    const response= await publicApi.get('/products',{params})
    
    return response.data
}

export const getBrands = async ()=>{
    const response= await publicApi.get('/brands')
    
    return response.data
}

export const getCategories= async ()=>{
    const response= await publicApi.get('/categories')
    return response.data
}

export const getProductById= async (id)=>{
    
    const response= await publicApi.get(`/products/${id}`)
    
    return response.data
}

export const getRelatedProducts= async (id)=>{
    const response = await publicApi.get(`/products/${id}/related`)
    return response.data
}