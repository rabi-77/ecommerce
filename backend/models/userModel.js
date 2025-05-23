import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true
  },
  alternativePhoneNumber: {
    type: String,
    trim: true
  },
  addressLine1: {
    type: String,
    required: [true, "Address line 1 is required"],
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true
  },
  postalCode: {
    type: String,
    required: [true, "Postal code is required"],
    trim: true
  },
  country: {
    type: String,
    required: [true, "Country is required"],
    default: "India",
    trim: true
  }
})

// Add virtual isDefault field
addressSchema.virtual('isDefault').get(function() {
  return this._id.toString() === this._parent().defaultAddressId?.toString();
});

addressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username cannot exceed 30 characters"],
    match: [
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, or hyphens",
    ],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    // required: [true, 'Password is required'],
    minlength: [8, "Password must be at least 8 characters"],
  },
  image:{
    type:String,
    required:false,
  },
  refreshToken: {
    type: String,
  },
  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, //uniqueness wont affect to null values
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  phone:{
    type:String,
    required:false,
    unique:true,
    minlength:10,
    maxlength:10,
  },
  addresses: {
    type: [addressSchema],
    default: [],
    validate: {
      validator: function(addresses) {
        return addresses.length <= 10;
      },
      message: 'Maximum 10 addresses allowed'
    }
  },
  defaultAddressId: {
    type: Schema.Types.ObjectId,
    default: null
  },
  /**
   * timestamps: Adds two properties, `createdAt` and `updatedAt`, to the document,
   * which are automatically set to the current date when the document is created
   * or updated.
   */
},{timestamps:true});

// Add virtual field for default address
userSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => 
    addr._id.toString() === this.defaultAddressId?.toString()
  );
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  // Hash OTP code if it's modified
  if (this.isModified("otp.code") && this.otp && this.otp.code) {
    this.otp.code = await bcrypt.hash(this.otp.code, 10);
  }
  next();
});

export default mongoose.model("User", userSchema);
