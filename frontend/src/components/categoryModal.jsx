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
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (isEdit) {
        console.log('edit');
        await dispatch(editCategoryThunk({ id: category._id, categoryData: data })).unwrap();
        toast.success("Category updated");
      } else {
        console.log(data);
        
        await dispatch(addCategoryThunk(data)).unwrap();
      toast.success("Category added");

  
      }


      onClose();
    } catch (err) {
      console.log('jojoj');
      
      toast.error(err || "Operation failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">
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
              className="mt-1 w-full p-2 border rounded-md"
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
              className="mt-1 w-full p-2 border rounded-md"
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
              className="p-2 bg-blue-500 text-white rounded-md"
            >
              {isEdit ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-gray-500 text-white rounded-md"
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