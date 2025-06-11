import Cart from '../models/cartModel.js';
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

    if (!product.isListed || product.isDeleted) {
      return res.status(400).json({ message: "Product is not available" });
    }

    const categoryPopulated = await product.populate('category');
    if (categoryPopulated.category && (!categoryPopulated.category.isListed || categoryPopulated.category.isDeleted)) {
      return res.status(400).json({ message: "Product category is not available" });
    }

    const brandPopulated = await categoryPopulated.populate('brand');
    if (brandPopulated.brand && (!brandPopulated.brand.isListed || brandPopulated.brand.isDeleted)) {
      return res.status(400).json({ message: "Product brand is not available" });
    }

    // Check if the variant exists and has stock
    const variant = product.variants.find(v => v.size === size);
    if (!variant) {
      return res.status(400).json({ message: "Selected size is not available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: []
      });
    }

    // Calculate total quantity of this product in cart (across all variants)
    const productItems = cart.items.filter(item => item.product.toString() === productId);
    let totalProductQuantity = productItems.reduce((total, item) => total + item.quantity, 0);

    // Check if item already exists in cart with this specific variant
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant.size === size
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newVariantQuantity = cart.items[existingItemIndex].quantity + quantity;
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
      
      cart.items[existingItemIndex].quantity = newVariantQuantity;
      cart.items[existingItemIndex].variant.stock = variant.stock; // Update stock info
    } else {
      // Check if adding this item would exceed the max quantity per product
      if (totalProductQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
        return res.status(400).json({ 
          message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
        });
      }
      
      // Add new item to cart
      cart.items.push({
        product: productId,
        variant: {
          size: size,
          stock: variant.stock
        },
        quantity
      });
    }

    // Save the cart
    await cart.save();

    // Remove from wishlist if it exists there
    await wishlistModel.findOneAndDelete({ user: userId, product: productId });

    // Populate cart for response
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      });

    // Calculate cart totals
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    populatedCart.items.forEach(item => {
      const itemPrice = item.product.price;
      const itemDiscount = item.product.discount || 0;
      const discountedPrice = itemPrice * (1 - itemDiscount / 100);
      
      subtotal += itemPrice * item.quantity;
      discount += (itemPrice - discountedPrice) * item.quantity;
      total += discountedPrice * item.quantity;
    });

    res.status(201).json({ 
      message: "Item added to cart",
      cartItems: populatedCart.items,
      count: populatedCart.items.length,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      }
    });
  } catch (err) {
    console.error('Error adding to cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const cartItem = cart.items[itemIndex];

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
    const brandPopulated = await product.populate('brand');
    if (brandPopulated.brand && (!brandPopulated.brand.isListed || brandPopulated.brand.isDeleted)) {
      return res.status(400).json({ message: "Product brand is not available" });
    }
    // Check if the variant has enough stock
    const variant = product.variants.find(v => v.size === cartItem.variant.size);
    if (!variant) {
      return res.status(400).json({ message: "Product variant no longer available" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ message: `Only ${variant.stock} items available in this size` });
    }

    // Calculate total quantity of this product in cart (across all variants)
    const productItems = cart.items.filter(
      item => item.product.toString() === cartItem.product.toString() && item._id.toString() !== cartItemId
    );
    const otherVariantsQuantity = productItems.reduce((total, item) => total + item.quantity, 0);
    
    // Check if new total quantity exceeds maximum allowed per product
    if (otherVariantsQuantity + quantity > MAX_QUANTITY_PER_PRODUCT) {
      return res.status(400).json({ 
        message: `You can only have ${MAX_QUANTITY_PER_PRODUCT} items of this product in your cart (across all sizes).`
      });
    }

    // Update the quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].variant.stock = variant.stock; // Update stock info
    await cart.save();

    // Populate cart for response
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      });

    // Calculate cart totals
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    populatedCart.items.forEach(item => {
      const itemPrice = item.product.price;
      const itemDiscount = item.product.discount || 0;
      const discountedPrice = itemPrice * (1 - itemDiscount / 100);
      
      subtotal += itemPrice * item.quantity;
      discount += (itemPrice - discountedPrice) * item.quantity;
      total += discountedPrice * item.quantity;
    });

    res.json({
      message: "Cart item updated",
      cartItems: populatedCart.items,
      count: populatedCart.items.length,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      }
    });
  } catch (err) {
    console.error('Error updating cart item:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    console.log("removing item from cart");
    const { cartItemId } = req.params;
    const userId = req.user;

    // Find the user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the cart item in the items array
    const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cardt item not found" });
    }

    // Remove the item from the items array
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate cart for response
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      });

    // Calculate cart totals
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    populatedCart.items.forEach(item => {
      const itemPrice = item.product.price;
      const itemDiscount = item.product.discount || 0;
      const discountedPrice = itemPrice * (1 - itemDiscount / 100);
      
      subtotal += itemPrice * item.quantity;
      discount += (itemPrice - discountedPrice) * item.quantity;
      total += discountedPrice * item.quantity;
    });

    res.json({
      message: "Item removed from cart",
      cartItems: populatedCart.items,
      count: populatedCart.items.length,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      }
    });
  } catch (err) {
    console.error('Error removing from cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user;

    // Find the user's cart
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price discount images variants brand category isListed isDeleted',
        populate: [
          { path: 'brand', select: 'name isListed isDeleted' },
          { path: 'category', select: 'name isListed isDeleted' }
        ]
      });

    // If no cart exists, return empty cart
    if (!cart) {
      return res.json({
        cartItems: [],
        count: 0,
        summary: {
          subtotal: 0,
          discount: 0,
          total: 0
        }
      });
    }

    // Filter out products that are no longer available or whose category is not available
    const availableCartItems = cart.items.filter(item => {
      const product = item.product;
      if (!product) return false; // Skip if product was deleted
      
      const category = product.category;
      const brand = product.brand;
      const variant = product.variants.find(v => v.size === item.variant.size);

      return product.isListed && 
             !product.isDeleted && 
             category && 
             category.isListed && 
             !category.isDeleted&&
             brand &&
             brand.isListed &&
             !brand.isDeleted &&
             variant && 
             variant.stock >= item.quantity;
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
    console.log('jey');
    
    const userId = req.user;
    
    // Find the user's cart
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.json({
        message: "Cart is already empty",
        itemsRemoved: 0
      });
    }
    
    // Clear the items array
    const itemsRemoved = cart.items.length;
    cart.items = [];
    await cart.save();
    
    res.json({ 
      message: "Cart cleared",
      itemsRemoved: itemsRemoved
    });
  } catch (err) {
    console.error('Error clearing cart:', err.message);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};
