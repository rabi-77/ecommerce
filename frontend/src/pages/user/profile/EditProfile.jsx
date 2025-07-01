import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";
import { FaUser, FaCamera } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  clearProfileErrors,
  updateProfile,fetchUserProfile
} from "../../../features/userprofile/profileSlice";

const EditProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profileData, loading, error, errorMessage } = useSelector(
    (state) => state.profile
  );

  // Use profile data if available, otherwise fall back to user data from auth state
  useEffect(() => {
    dispatch(fetchUserProfile(user._id));
  }, [dispatch, user]);

  const userData = profileData || user;
  const [formData, setFormData] = useState({
    name: userData?.username || "",
    phone: userData?.phone || "",
    email: userData?.email || "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(
    userData?.image || userData?.image || null
  );

  useEffect(() => {
    // Show error toast if there's an error
    if (error && errorMessage) {
      toast.error(errorMessage);
      dispatch(clearProfileErrors());
    }
  }, [error, errorMessage]);

  // Update form data if user data changes
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.username || "",
        phone: userData.phone || "",
        email: userData.email || "",
      });

      setPreviewImage(
        userData.image || null
      );
    }
  }, [userData]);
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- Phone validation (Indian numbers) ---
    const phonePattern = /^(?:\+91[-\s]?)?[6-9]\d{9}$/; // supports optional +91 and spaces/hyphen
    if (formData.phone && !phonePattern.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    if (formData.phone) {
      formDataToSend.append("phone", formData.phone);
    }
    if (profileImage) {
      formDataToSend.append("image", profileImage);
    } else if (userData.image) {
      // If no new image is selected but user already has an image, send the existing image URL
      formDataToSend.append("existingImage", userData.image);
    }
    formDataToSend.append("email", formData.email || userData.email);
    dispatch(updateProfile(formDataToSend))
      .unwrap()
      .then(() => {
        toast.success("Profile updated successfully");
      })
      .catch((err) => {
        // Error is handled by the useEffect above
      });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-center mb-6">
          <div
            {...getRootProps()}
            className={`w-32 h-32 rounded-full overflow-hidden cursor-pointer relative ${
              isDragActive ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <input {...getInputProps()} />
            {previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <FaCamera className="text-white text-2xl" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center">
                <FaUser className="text-gray-600 text-4xl mb-2" />
                <p className="text-xs text-gray-500 text-center px-2">
                  {isDragActive ? "Drop image here" : "Drag or click"}
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Drag and drop an image, or click to select
          </p>
          <p className="text-xs text-gray-500">Max size: 5MB</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
