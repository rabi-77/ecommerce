import Product from "../../models/productModel.js";
import Order from "../../models/orderModel.js";
import asyncHandler from "express-async-handler";

// @desc    Get all products with inventory details
// @route   GET /api/admin/inventory
// @access  Admin
export const getInventory = asyncHandler(async (req, res) => {
  const { page = 1, size = 10, search = "", sort = "name-asc" } = req.query;
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);

  let query = {};
  
  // Add search functionality
  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } }
      ]
    };
  }
  
  // Set up sorting based on sort parameter
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
  
  // Get total count for pagination
  const total = await Product.countDocuments(query);
  
  // Get products with pagination
  const products = await Product.find(query)
    .populate("category", "name")
    .populate("brand", "name")
    .sort(sortOption)
    .skip((pageNum - 1) * sizeNum)
    .limit(sizeNum);

  // Get sales data for each product
  const productsWithSales = await Promise.all(
    products.map(async (product) => {
      const productObj = product.toObject();
      
      // Get total sold quantity for each variant
      const variantsWithSales = await Promise.all(
        productObj.variants.map(async (variant) => {
          // Count sold items (delivered orders)
          const soldItems = await Order.aggregate([
            {
              $match: {
                "items.product": product._id,
                "items.variant._id": variant._id,
                "status": "delivered"
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
      
      // Calculate total sold
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

// @desc    Update product inventory
// @route   PUT /api/admin/inventory/:id
// @access  Admin
export const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variants } = req.body;
  
  if (!variants || !Array.isArray(variants)) {
    res.status(400);
    throw new Error("Variants data is required and must be an array");
  }
  
  // Find the product
  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  
  // Update each variant's stock
  for (const updatedVariant of variants) {
    const variant = product.variants.id(updatedVariant._id);
    if (!variant) {
      continue; // Skip if variant not found
    }
    
    // Ensure stock is a non-negative number
    const newStock = parseInt(updatedVariant.stock);
    if (isNaN(newStock) || newStock < 0) {
      res.status(400);
      throw new Error(`Invalid stock value for ${variant.size}`);
    }
    
    variant.stock = newStock;
  }
  
  // Recalculate total stock
  product.totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  
  // Save the updated product
  await product.save();
  
  res.json({
    success: true,
    message: "Inventory updated successfully",
    product
  });
});

// @desc    Get inventory history for a product
// @route   GET /api/admin/inventory/:id/history
// @access  Admin
export const getInventoryHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('hey');
  
  // Find the product
  const product = await Product.findById(id)
    .populate("category", "name")
    .populate("brand", "name");
  
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  
  // Get all orders that contain this product
  const orders = await Order.find({
    "items.product": id
  })
  .select("orderNumber status createdAt items.product items.variant items.quantity items.isCancelled items.isReturned")
  .sort({ createdAt: -1 });
  

  console.log(`Found ${orders.length} orders for product ${id}`);
  console.log('Order statuses:', orders.map(order => order.status));
  
  // Extract inventory changes from orders
  const inventoryChanges = [];
  
  for (const order of orders) {
    for (const item of order.items) {
      if (item.product.toString() === id) {
        let changeType = "";
        let quantity = item.quantity;
        
        if (order.status === "cancelled" || item.isCancelled) {
          changeType = "Cancelled Order";
        } else if (item.isReturned && item.returnRequestStatus === "approved") {
          changeType = "Return";
        } else if (["pending", "processing","shipped", "out for delivery", "delivered"].includes(order.status)) {
          changeType = "Sale";
          quantity = -quantity; // Negative for sales (stock reduction)
        } else {
          changeType = "Pending Order";
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

// @desc    Get low stock products
// @route   GET /api/admin/inventory/low-stock
// @access  Admin
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { threshold = 5 } = req.query;
  const thresholdNum = parseInt(threshold);
  
  // Find products with low total stock or variants with low stock
  const products = await Product.find({
    $or: [
      { totalStock: { $lte: thresholdNum } },
      { "variants.stock": { $lte: thresholdNum } }
    ]
  })
  .populate("category", "name")
  .populate("brand", "name")
  .sort({ totalStock: 1 });
  
  // Filter to only include variants that are low in stock
  const productsWithLowStockVariants = products.map(product => {
    const productObj = product.toObject();
    
    // Filter variants to only include those with low stock
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
