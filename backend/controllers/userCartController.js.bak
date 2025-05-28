import cartModel from '../models/cartModel.js';
import productModel from '../models/productModel.js';
import wishlistModel from '../models/wishlistModel.js';

// Maximum quantity allowed per product (across all variants)
const MAX_QUANTITY_PER_PRODUCT = 10;

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, size, quantity = 1 } = req.body;
    const userId = req.user;

    // Check if product exists
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product is listed and not blocked/deleted
    if (!product.isListed || product.isDeleted) {
      return res.status(400).json({ message: "Product is not available" });
    }

    // Check if product's category is active
    const categoryPopulated = await product.populate('category');
    if (categoryPopulated.category && (!categoryPopulated.category.isListed || categoryPopulated.category.isDeleted)) {
      return res.status(400).json({ message: "Product category is not available" });
    }

    // Check if the variant exists and has stock
    const variant = product.variants.find(v => v.size === size);
    if (!variant) {
      return res.status(400).json({ message: "Selected size is not available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    // Get total quantity of this product in cart (across all variants)
    const existingCartItems = await cartModel.find({ 
      user: userId, 
      product: productId 
    });
    
    let totalProductQuantity = existingCartItems.reduce((total, item) => total + item.quantity, 0);

    // Check if item already exists in cart with this specific variant
    let cartItem = await cartModel.findOne({ 
      user: userId, 
      product: productId, 
      'variant.size': size 
    });

    if (cartItem) {
      // Update quantity if item exists
      const newVariantQuantity = cartItem.quantity + quantity;
      const newTotalQuantity = totalProductQuantity + quantity;
      
      // Check if new quantity exceeds stock for this variant
      if (newVariantQuantity > variant.stock) {
        return res.status(400).json({ message: `Cannot add more items. Only ${variant.stock} available in this size.` });
      }
      
      // Check if new total quantity exceeds maximum allowed per product
      if (newTotalQuantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      cartItem.quantity = newVariantQuantity;
      await cartItem.save();
    } else {
      // Check if adding this item would exceed the max quantity per product
      if (totalProductQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      // Create new cart item
      cartItem = new cartModel({
        user: userId,
        product: productId,
        variant: {
          size: size,
          stock: variant.stock
        },
        quantity
      });
      await cartItem.save();
    }

    // Remove from wishlist if it exists there
    await wishlistModel.findOneAndDelete({ user: userId, product: productId });

    res.status(201).json({ 
      message: "Item added to cart",
      cartItem
    });
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Find the cart item
    const cartItem = await cartModel.findById(cartItemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Check if the cart item belongs to the user
    if (cartItem.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get the product to check stock and availability
    const product = await productModel.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product is still available
    if (!product.isListed || product.isDeleted) {
      return res.status(400).json({ message: "Product is no longer available" });
    }

    // Check if product's category is still active
    const categoryPopulated = await product.populate('category');
    if (categoryPopulated.category && (!categoryPopulated.category.isListed || categoryPopulated.category.isDeleted)) {
      return res.status(400).json({ message: "Product category is not available" });
    }

    // Check if the variant has enough stock
    const variant = product.variants.find(v => v.size === cartItem.variant.size);
    if (!variant) {
      return res.status(400).json({ message: "Product variant no longer available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    // Get total quantity of this product in cart (across all variants)
    const existingCartItems = await cartModel.find({ 
      user: userId, 
      product: cartItem.product,
      _id: { $ne: cartItemId } // Exclude current item
    });
    
    const otherVariantsQuantity = existingCartItems.reduce((total, item) => total + item.quantity, 0);
    
    // Check if new total quantity exceeds maximum allowed per product
    if (otherVariantsQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
      return res.status(400).json({ 
        message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
      });
    }

    // Update the quantity
    cartItem.quantity = quantity;
    cartItem.variant.stock = variant.stock; // Update stock info
    await cartItem.save();

    res.json({
      message: "Cart item updated",
      cartItem
    });
  } catch (err) {
    console.error('Error updating cart item:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user;

    // Find the cart item
    const cartItem = await cartModel.findById(cartItemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Check if the cart item belongs to the user
    if (cartItem.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete the cart item
    await cartModel.findByIdAndDelete(cartItemId);

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error('Error removing from cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user;

    const cartItems = await cartModel.find({ user: userId })
      .populate({
        path: 'product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      })
      .sort({ createdAt: -1 });

    // Filter out products that are no longer available or whose category is not available
    const availableCartItems = cartItems.filter(item => {
      const product = item.product;
      const category = product.category;
      
      return product.isListed && 
             !product.isDeleted && 
             category && 
             category.isListed && 
             !category.isDeleted;
    });

    // Calculate cart totals
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    availableCartItems.forEach(item => {
      const itemPrice = item.product.price;
      const itemDiscount = item.product.discount || 0;
      const discountedPrice = itemPrice * (1 - itemDiscount / 100);
      
      subtotal += itemPrice * item.quantity;
      discount += (itemPrice - discountedPrice) * item.quantity;
      total += discountedPrice * item.quantity;
    });

    res.json({
      cartItems: availableCartItems,
      count: availableCartItems.length,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      }
    });
  } catch (err) {
    console.error('Error fetching cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user;
    
    const result = await cartModel.deleteMany({ user: userId });
    
    res.json({ 
      message: "Cart cleared",
      itemsRemoved: result.deletedCount
    });
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};
