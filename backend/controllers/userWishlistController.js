import wishlistModel from "../models/wishlistModel.js";
import productModel from "../models/productModel.js";

// Assuming fetchActiveOffers and applyBestOffer functions are defined elsewhere
import { fetchActiveOffers, applyBestOffer } from "../services/offerService.js";

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const existingItem = await wishlistModel.findOne({
      user: userId,
      product: productId,
    });

    if (existingItem) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    const wishlistItem = new wishlistModel({
      user: userId,
      product: productId,
    });

    await wishlistItem.save();
    return res.status(201).json({ 
      message: "Product added to wishlist",
      wishlistItem
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user;

    const result = await wishlistModel.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!result) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    return res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user;

    const wishlistItems = await wishlistModel.find({ user: userId })
      .populate({
        path: 'product',
        select: 'name price images category brand isFeatured isListed variants',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'brand', select: 'name' }
        ]
      })
      .sort({ addedAt: -1 });

    const validWishlistItems = wishlistItems.filter(item => 
      item.product && item.product.isListed === true
    );

    // ---------------------------------------------------------
    // NEW: Attach dynamic offer pricing to each wishlist product
    // ---------------------------------------------------------
    if (validWishlistItems.length) {
      // Gather ids for offer lookup
      const productIds   = validWishlistItems.map(it => it.product._id);
      const categoryIds  = validWishlistItems.map(it => it.product.category?._id).filter(Boolean);

      const offerMaps = await fetchActiveOffers(productIds, categoryIds);

      // Mutate each item to embed pricing meta used by the UI
      validWishlistItems.forEach(it => {
        const { effectivePrice, appliedOffer } = applyBestOffer(it.product, offerMaps);

        // Attach non-persisted fields for response
        it.product = {
          ...it.product.toObject?.() || it.product,
          effectivePrice,
          appliedOffer: appliedOffer ? {
            _id: appliedOffer._id,
            percentage: appliedOffer.percentage,
            amount: appliedOffer.amount,
            type: appliedOffer.type,
          } : null,
        };
      });
    }

    return res.status(200).json({
      count: validWishlistItems.length,
      wishlist: validWishlistItems
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const checkWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user;

    const wishlistItem = await wishlistModel.findOne({
      user: userId,
      product: productId,
    });

    return res.status(200).json({
      inWishlist: !!wishlistItem
    });
  } catch (error) {
    console.error("Check wishlist item error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user;
    
    const result = await wishlistModel.deleteMany({ user: userId });
    
    return res.status(200).json({ 
      message: "Wishlist cleared successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
