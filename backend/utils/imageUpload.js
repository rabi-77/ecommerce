import cloudinary from 'cloudinary';
import { configDotenv } from 'dotenv';
configDotenv()
// Configure Cloudinary (make sure to set your Cloudinary credentials in environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImagesToCloudinary = async (files, folder) => {
  const imageUrls = [];
  // Upload each image to Cloudinary
  for (const file of files) {
    const base64Data = file.buffer.toString('base64')
    const uploadedImage = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64Data}`, {
      folder: folder,  // Specify the folder ('products' or 'categories')
      transformation: [
        { quality: "auto" },  // Automatically adjusts quality for optimization
      ],
    });
    imageUrls.push(uploadedImage.secure_url);  // Store the Cloudinary URL of the uploaded image
  }
  
  return imageUrls;  // Return the URLs of the uploaded images
};

export { uploadImagesToCloudinary };
