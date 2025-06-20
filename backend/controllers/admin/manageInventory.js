import Product from "../../models/productModel.js";
import Order from "../../models/orderModel.js";
import asyncHandler from "express-async-handler";

export const getInventory = asyncHandler(async (req, res) => {
  const { page = 1, size = 10, search = "", sort = "name-asc" } = req.query;
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);

  let query = {};
  
  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } }
      ]
    };
  }
  
  let sortOption = {};
  switch (sort) {
    case "name-desc":
      sortOption.name = -1;
      break;
    case "stock-asc":
      sortOption.totalStock = 1;
      break;
    case "stock-desc":
      sortOption.totalStock = -1;
      break;
    case "name-asc":
    default:
      sortOption.name = 1;
      break;
  }
  
  const total = await Product.countDocuments(query);
  
  const products = await Product.find(query)
    .populate("category", "name")
    .populate("brand", "name")
    .sort(sortOption)
    .skip((pageNum - 1) * sizeNum)
    .limit(sizeNum);

  const productsWithSales = await Promise.all(
    products.map(async (product) => {
      const productObj = product.toObject();
      
      const variantsWithSales = await Promise.all(
        productObj.variants.map(async (variant) => {
          const soldItems = await Order.aggregate([
            {
              $match: {
                "items.product": product._id,
                "items.variant._id": variant._id,
                "status": { $in: ["pending","processing","shipped","out for delivery","delivered"] },
                "items.isCancelled": { $ne: true },
                "items.isReturned": { $ne: true }
              }
            },
            {
              $unwind: "$items"
            },
            {
              $match: {
                "items.product": product._id,
                "items.variant._id": variant._id
              }
            },
            {
              $group: {
                _id: null,
                totalSold: { $sum: "$items.quantity" }
              }
            }
          ]);
          
          return {
            ...variant,
            sold: soldItems.length > 0 ? soldItems[0].totalSold : 0
          };
        })
      );
      
      const totalSold = variantsWithSales.reduce((sum, variant) => sum + variant.sold, 0);
      
      return {
        ...productObj,
        variants: variantsWithSales,
        totalSold
      };
    })
  );

  res.json({
    success: true,
    products: productsWithSales,
    total,
    page: pageNum,
    size: sizeNum,
    totalPages: Math.ceil(total / sizeNum)
  });
});

  export const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variants } = req.body;
  
  if (!variants || !Array.isArray(variants)) {
    res.status(400);
    throw new Error("Variants data is required and must be an array");
  }
  
  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  
  for (const updatedVariant of variants) {
    const variant = product.variants.id(updatedVariant._id);
    if (!variant) {
      continue; 
    }
    
    const newStock = parseInt(updatedVariant.stock);
    if (isNaN(newStock) || newStock < 0) {
      res.status(400);
      throw new Error(`Invalid stock value for ${variant.size}`);
    }
    
    variant.stock = newStock;
  }
  
  product.totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  
  await product.save();
  
  res.json({
    success: true,
    message: "Inventory updated successfully",
    product
  });
});

export const getInventoryHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('hey');
  
  const product = await Product.findById(id)
    .populate("category", "name")
    .populate("brand", "name");
  
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  
  const orders = await Order.find({
    "items.product": id
  })
  .select("orderNumber status createdAt items.product items.variant items.quantity items.isCancelled items.isReturned")
  .sort({ createdAt: -1 });
  

  console.log(`Found ${orders.length} orders for product ${id}`);
  console.log('Order statuses:', orders.map(order => order.status));
  
  const inventoryChanges = [];
  
  for (const order of orders) {
    for (const item of order.items) {
      if (item.product.toString() === id) {
        let changeType = "";
        let quantity = item.quantity;
        
        if (order.status === "cancelled" || item.isCancelled) {
          changeType = "Cancelled Order";
        } else if (item.isReturned) {
          changeType = "Return";
        } else if (["pending", "processing", "shipped", "out for delivery", "delivered"].includes(order.status)) {
          changeType = "Sale";
          quantity = -quantity; // Negative for sales (stock reduction)
        }
        
        inventoryChanges.push({
          date: order.createdAt,
          orderNumber: order.orderNumber,
          variantId: item.variant._id,
          variantSize: item.variant.size,
          quantity,
          changeType
        });
      }
    }
  }
  console.log(inventoryChanges);
  res.json({
    success: true,
    product,
    inventoryChanges
  });
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { threshold = 5 } = req.query;
  const thresholdNum = parseInt(threshold);
  
  const products = await Product.find({
    $or: [
      { totalStock: { $lte: thresholdNum } },
      { "variants.stock": { $lte: thresholdNum } }
    ]
  })
  .populate("category", "name")
  .populate("brand", "name")
  .sort({ totalStock: 1 });
  
  const productsWithLowStockVariants = products.map(product => {
    const productObj = product.toObject();
    
    const lowStockVariants = productObj.variants.filter(variant => 
      variant.stock <= thresholdNum
    );
    
    return {
      ...productObj,
      variants: lowStockVariants
    };
  });
  
  res.json({
    success: true,
    products: productsWithLowStockVariants,
    count: productsWithLowStockVariants.length
  });
});
