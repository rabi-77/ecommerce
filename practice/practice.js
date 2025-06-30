import Product from '../backend/models/productModel.js'
import Cart from '../backend/models/productModel.js'

const addToCart= async ()=>{
    const {productId,size,quantiy} = req.body

    const product = await Product.findById(productId)
    if(!product){
        res.status(404).json({message:'product not found'})
    }

    const category= await Product.findById(product).select('category')
    if(category && (!category.isListed || category.isDeleted)){
        res.status(404).json({message:'the category of the profojodfs '})
    }
}