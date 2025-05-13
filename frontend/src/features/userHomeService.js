import publicApi from "../apis/users/publicAPI";

export const getProducts= async (params)=>{
    console.log('lol');
    
    const response= await publicApi.get('/products',{params})
    console.log('hey',response.data);
    
    return response.data
}

export const getBrands = async ()=>{
    const response= await publicApi.get('/brands')
    console.log(response.data,'kk');
    
    return response.data
}

export const getCategories= async ()=>{
    const response= await publicApi.get('/categories')
    return response.data
}

export const getProductById= async (id)=>{
    console.log('rech');
    
    const response= await publicApi.get(`/products/${id}`)
    console.log(response.data,'ser');
    
    return response.data
}

export const getRelatedProducts= async ()=>{
    const response = await publicApi.get(`/products/${id}/related`)
    return response.data
}