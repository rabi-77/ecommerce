import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast, } from "react-toastify";
import {addCategoryThunk,editCategoryThunk} from "../features/admin/adminCategory/adminCategoryslice"

const CategoryModal = ({ category, onClose }) => {
  const dispatch = useDispatch();
  const isEdit = !!category;

  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(category?.image || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (isEdit) {
        await dispatch(editCategoryThunk({ id: category._id, categoryData: data })).unwrap();
        toast.success("Category updated");
      } else {
        await dispatch(addCategoryThunk(data)).unwrap();
        toast.success("Category added");
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
      <div className="bg-[#FFF8E1] p-6 rounded-lg w-full max-w-md border border-[#E6D7B2]">
        <h3 className="text-xl font-bold mb-4 text-[#8B4513]">
          {isEdit ? "Edit Category" : "Add Category"}
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
              className="mt-1 w-full p-2 border border-[#D2B48C] rounded-md bg-[#FFFCF2] focus:outline-none focus:ring-2 focus:ring-[#D2B48C]"
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
              Image
            </label>
            <input
            name="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 w-full p-2 border border-[#D2B48C] rounded-md bg-[#FFFCF2] focus:outline-none focus:ring-2 focus:ring-[#D2B48C]"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-24 h-24 object-cover rounded"
              />
            )}
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
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEdit ? "Update" : "Add"
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

export default CategoryModal;