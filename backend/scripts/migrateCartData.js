import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the old cart model schema (flat structure)
const cartItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    size: {
      type: String,
      required: true
    },
    stock: {
      type: Number
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { timestamps: true });

cartItemSchema.index({ user: 1, product: 1, 'variant.size': 1 }, { unique: true });
const OldCartItem = mongoose.model('CartItem', cartItemSchema);

// Define the new cart model schema (nested structure)
const newCartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    size: {
      type: String,
      required: true
    },
    stock: {
      type: Number
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [newCartItemSchema]
}, { timestamps: true });

cartSchema.index({ 'user': 1 });
cartSchema.index({ 'items.product': 1, 'items.variant.size': 1 });

const NewCart = mongoose.model('Cart', cartSchema);

async function migrateCartData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all existing cart items
    const oldCartItems = await OldCartItem.find().lean();
    console.log(`Found ${oldCartItems.length} cart items to migrate`);
    
    if (oldCartItems.length === 0) {
      console.log('No cart data to migrate');
      return;
    }
    
    // Group cart items by user
    const cartsByUser = {};
    
    oldCartItems.forEach(item => {
      const userId = item.user.toString();
      if (!cartsByUser[userId]) {
        cartsByUser[userId] = [];
      }
      
      cartsByUser[userId].push({
        product: item.product,
        variant: item.variant,
        quantity: item.quantity
      });
    });
    
    console.log(`Grouped into ${Object.keys(cartsByUser).length} user carts`);
    
    // Create new cart documents
    const newCarts = [];
    
    for (const userId in cartsByUser) {
      newCarts.push({
        user: mongoose.Types.ObjectId(userId),
        items: cartsByUser[userId]
      });
    }
    
    // Insert new cart documents
    if (newCarts.length > 0) {
      // First, drop the new collection if it exists to avoid conflicts
      try {
        await mongoose.connection.db.collection('carts').drop();
        console.log('Dropped existing carts collection');
      } catch (err) {
        // Collection might not exist, which is fine
        console.log('No existing carts collection to drop');
      }
      
      const result = await NewCart.insertMany(newCarts);
      console.log(`Successfully migrated ${result.length} carts with ${oldCartItems.length} total items`);
    }
    
    // Rename the old collection instead of dropping it
    // This is safer than dropping in case you need to rollback
    try {
      await mongoose.connection.db.collection('cartitems').rename('cartitems_old');
      console.log('Renamed old collection to cartitems_old');
    } catch (err) {
      console.error('Error renaming old collection:', err.message);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateCartData();
