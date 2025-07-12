import Product from "../backend/models/productModel.js";
// import Cart from '../backend/models/productModel.js'
import Order from "../backend/models/orderModel.js";
import Wallet from "../backend/models/walletModel.js";
import Product from "../backend/models/productModel.js";
import Coupon from "../backend/models/couponModel.js";
import Brands from "../backend/models/brandModel.js"
import productModel from "../backend/models/productModel.js";

// const addToCart= async ()=>{
//     const {productId,size,quantiy} = req.body

//     const product = await Product.findById(productId)
//     if(!product){
//         res.status(404).json({message:'product not found'})
//     }

//     const category= await Product.findById(product).select('category')
//     if(category && (!category.isListed || category.isDeleted)){
//         res.status(404).json({message:'the category of the profojodfs '})
//     }
// }

const bonusRefund = async (orderId, itemId) => {
  const order = await Order.findById(orderId);

  const item = order.items.id(itemId);

  const productId = item.product;
  const product = await Product.find(productId);

  product.totalStock += 1;
  const variant = product.variants.id(item.variant._id);

  variant.stock += 1;

  if (variant.stock < 5) {
    let newCredit = item.totalPrice * 0.5;

    const updatePrice = await Wallet.findOneAndUpdate(
      { user: req.user },
      {
        $inc: { balance: newCredit },
        $push: {
          transactions: {
            amount: newCredit,
            type: "credit",
            source: "refund",
          },
        },
      },
      { new: true, upsert: true }
    );
  }

  await product.save();
  await order.save();
}

const cancelEveryItem = async (orderId, itemId) => {
  const order = await Order.findById(orderId);
  const coupon = await Coupon.findById(order.coupon);
  let minAmount = coupon.minPurchaseAmount;
  const item = order.items.id(itemId);
  let couponApplies=true;
  let itemsPrice = item.totalPrice;
  let orderPaid = order.totalPrice;
  let remainingAfterCancel = orderPaid - itemsPrice;
    
  if (remainingAfterCancel < minAmount) {
     couponApplies = true;
  }
  couponApplies=false;

  let newTotal;
  order.items.forEach((x)=>{
    let newTotal= x.totalPrice
  })

  newTotal-=itemsPrice;
let  newTotalAfterTax=newTotal+(newTotal*0.18)
  //   order.totalPrice -= item.totalPrice;
  let refundAmount=itemsPrice;
  refundAmount+=itemsPrice*0.18;
  order.totalPrice=orderPaid-refundAmount
  
}

// const topFive= async ()=>{

//     const ordersFive= await Order.aggregate([
//         {$match:{isPaid:true,status:{$nin:['cancelled','payment_failed','returned']}}},
//         {$unwind:'$items'},
//         {$match:{'items.isCancelled':{$ne:true},'items.isReturned':{$ne:true}}},
//         ,
//         {$lookup:{
//             from:'products',
//             localField:'items.product',
//             foreignField:'_id',
//             as:'product'
//         }},
//         {$unwind:'$product'},
//         {$group:{
//             _id:'$product._id',
//             totalQuantity:'items.quantity',
//             totalSum:'$items.totalPrice'
//         }},
//         {$sort:{totalQuantity:-1}},
//         {$limit:10}
//     ])

//     const topBrands= await Order.aggregate([
//         {$match:{isPaid:true,status:{$nin:['failed','cancelled']}}},
//         {$unwind:'$items'},
//         {$match:{'items.isCancelled':{$ne:true},'items.isReturned':{$ne:true}}},
//         {$lookup:{
//             from:'products',
//             localField:'items.product',
//             foreignField:'_id',
//             as:'product'
//         }},
//         {$unwind:"$product"},
//         {$group:{
//             _id:'$product.brand',
//             totalSum:'$items.totalPrice',
//             totalQuantity:'$items.totalPrice',
//         }},
//         {$lookup:{
//             from:'brands',
//             localField:'product._id',
//             foreignField:'_id',
//             as:'brand'
//         }},
//         {$unwind:"$brand"},
//         {$project:{totalQuantity:1,
//             _id:'$brand._id',
//             name:'$brand.name'
//         }}
//     ])
// }

const returnRefund= async (orderId,itemId) =>{
let bonus;
  const order= await Order.findById(orderId)
  const item= order.items.id(itemId)
  const itemQuantity= item.quantity

  const product= await Product.findById(item.product)
  const variant= product.variants.id(item.variant)

  product.totalStock-=1
  variant.stock-=1
  await product.save()

  if(variant.stock<3){
    bonus= product.price*0.30
  }
  await Wallet.findOneAndUpdate({user:req.user},
    {$inc:{balance:bonus},
    $push:{
      transactions:{
        amount:bonus,
        source:'refund',
        type
      }
    }
  },{new:true}
  )
}

const deletebrand= async (brandId)=>{
        const brand= await Brands.findByIdAndDelete(brandId)
    const product= await Product.updateMany({brand:brandId,totalStock:{$lt:5}},{isListed:false})


}

const updateEverything= async (orderId)=>{
    const order = await Order.findById(orderId)   
    let isValid;
    isValid=order.items.every((item)=>{
      return item.isCancelled
    })

    if(isValid){
        order.status='cancelled'
    }

    await order.save()

}