import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import {
  addProductThunk,
  editProductThunk,
} from "../features/admin/adminProducts/productSlice";

const ProductModal = ({ product, onClose }) => {
  const dispatch = useDispatch();
  const isEdit = !!product;
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const { categories, brands } = useSelector((state) => state.product);
//   console.log(categories,brands);
  
  const SHOE_SIZES = ["6", "7", "8", "9", "10"];

  // Sample categories and brands (replace with your actual data)
  //   const categories = [
  //     { id: "1", name: "Category 1" },
  //     { id: "2", name: "Category 2" },
  //     { id: "3", name: "Category 3" },
  //   ];
  //   const brands = [
  //     { id: "1", name: "Brand 1" },
  //     { id: "2", name: "Brand 2" },
  //     { id: "3", name: "Brand 3" },
  //   ];

  const initialVariants = SHOE_SIZES.map((size) => {
    const existingVariant = product?.variants?.find((v) => v.size === size);
    return {
      size,
      stock: existingVariant ? existingVariant.stock : "",
      sku: existingVariant ? existingVariant.sku : undefined,
    };
  });

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    category: product?.category?._id ||product?.category || "", // Added category
    brand: product?.brand?._id ||product?.brand || "", // Added brand
    images: [], // New images to upload
    variants: initialVariants,
  });

  const [imagePreviews, setImagePreviews] = useState(product?.images || []); // URLs for previews
  const [existingImages, setExistingImages] = useState(product?.images || []); // Existing images (edit mode)
  const [croppingIndex, setCroppingIndex] = useState(null); // Index of the image being cropped
  const [crop, setCrop] = useState(null); // Crop state for react-image-crop
  const [croppedImage, setCroppedImage] = useState(null); // Store the image being cropped
  const imgRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    const totalImages = imagePreviews.length + 1;
    console.log("Total images after adding:", totalImages);

    if (totalImages > 5) {
      toast.error("You can only upload a maximum of 5 images");
      e.target.value = "";
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.blur();
    }

    const imageUrl = URL.createObjectURL(file);
    console.log("Image selected, URL:", imageUrl);

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, file],
    }));
    setImagePreviews((prev) => [...prev, imageUrl]);
    e.target.value = ""; // Reset file input
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        4 / 3, // Aspect ratio
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };

  const handleCropStart = (index) => {
    console.log("Starting crop for image at index:", index);
    setCroppingIndex(index);
    setCroppedImage(imagePreviews[index]);
  };

  const handleCropConfirm = () => {
    if (croppingIndex === null || !crop || !imgRef.current) return;

    console.log("Confirming crop for image at index:", croppingIndex);
    const canvas = document.createElement("canvas");
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.toBlob((blob) => {
      const croppedFile = new File([blob], `cropped-image-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const croppedUrl = URL.createObjectURL(croppedFile);

      // Update formData.images and imagePreviews
      const newImages = [...formData.images];
      newImages[croppingIndex - existingImages.length] = croppedFile;
      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));

      const newPreviews = [...imagePreviews];
      URL.revokeObjectURL(newPreviews[croppingIndex]);
      newPreviews[croppingIndex] = croppedUrl;
      setImagePreviews(newPreviews);

      console.log("Cropped image updated, new URL:", croppedUrl);
      setCroppingIndex(null);
      setCroppedImage(null);
      setCrop(null);
    }, "image/jpeg");
  };

  const handleCropCancel = () => {
    console.log("Crop canceled for image at index:", croppingIndex);
    setCroppingIndex(null);
    setCroppedImage(null);
    setCrop(null);
  };

  const handleRemoveImage = (index) => {
    console.log("Removing image at index:", index);
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    const newExistingImages = [...existingImages];
    if (index < newExistingImages.length) {
      newExistingImages.splice(index, 1);
      setExistingImages(newExistingImages);
    } else {
      const newImages = [...formData.images];
      const fileIndex = index - existingImages.length;
      newImages.splice(fileIndex, 1);
      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));
    }

    URL.revokeObjectURL(imagePreviews[index]);

    // if (newPreviews.length < 3) {
    //   toast.error("Minimum 3 images required");
    // }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value === "" ? "" : Number(value),
    };
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (imagePreviews.length < 3) {
      toast.error("Please upload at least 3 images");
      setIsLoading(false);
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      setIsLoading(false);
      return;
    }

    if (!formData.brand) {
      toast.error("Please select a brand");
      setIsLoading(false);
      return;
    }

    const filledVariants = formData.variants.filter((v) => v.stock > 0);
    if (filledVariants.length === 0) {
      toast.error("At least one variant must have stock greater than 0");
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("category", formData.category); // Add category to FormData
    data.append("brand", formData.brand); // Add brand to FormData
    // formData.images.forEach((image) => data.append("images", image));
    // data.append("variants", JSON.stringify(formData.variants));

    if (isEdit) {
      data.append("existImgs", JSON.stringify(existingImages));
    }


    // Append new images (including cropped ones)
  formData.images.forEach((image) => {
    if (image instanceof File) {
      data.append("images", image);
    } else if (image.url) {
      // If you have image objects with URLs
      data.append("images", image.url);
    }
  });

  // Append variants after filtering empty stocks
  data.append("variants", JSON.stringify(
    formData.variants.filter(v => v.stock !== "")
  ));

  // Debug: Log FormData contents before sending
  console.log("FormData contents:");
  for (let [key, value] of data.entries()) {
    console.log(key, value);
  }


    try {
      if (isEdit) {
        await dispatch(
          editProductThunk({ id: product._id, productData: data })
        ).unwrap();
        toast.success("Product updated");
      } else {
        await dispatch(addProductThunk(data)).unwrap();
        toast.success("Product added");
      }
      onClose();
    } catch (err) {
      toast.error(err || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FFF8E1] p-6 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto border border-[#E6D7B2]">
        <h3 className="text-xl font-bold mb-4 text-[#8B4513]">
          {isEdit ? "Edit Product" : "Add Product"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border border-[#D2B48C] rounded-md bg-[#FFFCF2] focus:outline-none focus:ring-2 focus:ring-[#D2B48C]"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border border-[#D2B48C] rounded-md bg-[#FFFCF2] focus:outline-none focus:ring-2 focus:ring-[#D2B48C]"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            {categories.length > 0 ? (
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border border-[#D2B48C] rounded-md bg-[#FFFCF2] focus:outline-none focus:ring-2 focus:ring-[#D2B48C]"
                required
              >
                <option value="">-- Select a category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700">
                  No categories found. Please create categories first in the
                  admin panel.
                </p>
                <button
                  type="button"
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => {
                    // You might want to navigate to categories management
                    // or show a message about where to create categories
                    toast.info(
                      "Navigate to Categories section to create new categories"
                    );
                  }}
                >
                  Go to Categories Management
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Brand
            </label>
            {brands.length>0?(
            <select
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border rounded-md"
              required
            >
              <option value="">-- Select a brand --</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
            ):(
                <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700">
                  No brands found. Please create brands first in the admin panel.
                </p>
                <button
                  type="button"
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => {
                    toast.info("Navigate to Brands section to create new brands");
                  }}
                >
                  Go to Brands Management
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Images (3-10)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="mt-1 w-full p-2 border rounded-md"
              disabled={imagePreviews.length >= 10}
              required={!isEdit && imagePreviews.length === 0}
            />
            {imagePreviews.length > 0 ? (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Image Previews
                </h4>
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) =>
                          console.error("Failed to load preview image:", src)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleCropStart(index)}
                        className="absolute top-0 left-0 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        ✂️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">No images selected</p>
            )}
            {croppingIndex !== null && croppedImage && (
              <div className="mt-2 p-2 border rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Crop Image
                </h4>
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  aspect={4 / 3}
                >
                  <img
                    ref={imgRef}
                    src={croppedImage}
                    alt="Crop"
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    className="p-1 bg-green-500 text-white rounded-md"
                  >
                    Confirm Crop
                  </button>
                  <button
                    type="button"
                    onClick={handleCropCancel}
                    className="p-1 bg-red-500 text-white rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Variants (Sizes 6-10, at least one required)
            </label>
            <div className="flex space-x-2 mb-2">
              <span className="w-20 font-semibold">Size</span>
              <span className="w-24 font-semibold">Stock</span>
            </div>
            {formData.variants.map((variant, index) => (
              <div
                key={variant.size}
                className="flex space-x-2 mb-2 items-center"
              >
                <span className="w-20">Size {variant.size}</span>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) =>
                    handleVariantChange(index, "stock", e.target.value)
                  }
                  className="p-2 border rounded-md w-24"
                  min="0"
                  placeholder="Enter stock"
                />
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`p-2 ${isLoading ? 'bg-[#D2B48C] opacity-70' : 'bg-[#D2B48C]'} text-white rounded-md flex items-center justify-center hover:bg-[#BC8F8F] transition-colors`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEdit ? "Updating Product..." : "Adding Product..."}
                </>
              ) : (
                isEdit ? "Update Product" : "Add Product"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`p-2 ${isLoading ? 'bg-[#BC8F8F] opacity-70' : 'bg-[#BC8F8F]'} text-white rounded-md hover:bg-[#A67B5B] transition-colors`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
