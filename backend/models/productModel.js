import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ["6", "7", "8", "9", "10"],
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [{ type: String, required: true }],

    isListed: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      default: false,
      type: Boolean,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    totalStock: {
      type: Number,
      required: true,
      min: 0,
    },
    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },
        message: "At least one variant is required.",
      },
    },
  },
  { timestamps: true }
);

// Ensure product names are unique regardless of case (e.g., "nike" === "NIKE")
// Note: run once in Mongo shell to drop any existing duplicate data before building the index.
productSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 }, // strength 2: case-insensitive, diacritic-sensitive
  }
);

export default mongoose.model("Product", productSchema);
