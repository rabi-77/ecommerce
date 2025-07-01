import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaUser, FaEdit, FaMapMarkerAlt } from "react-icons/fa";
import {
  clearProfileErrors,
  fetchUserProfile,
} from "../../../features/userprofile/profileSlice";
import { toast } from "react-toastify";

const ProfileDetails = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profileData, loading, errorMessage, error } = useSelector(
    (state) => state.profile
  );
  const invalidReferral = useSelector((state) => state.auth.invalidReferral);
  useEffect(() => {
    // Show error toast if there's an error
    if (error && errorMessage) {
      toast.error(errorMessage);
      dispatch(clearProfileErrors())
    }
  }, [error, errorMessage, dispatch]);

  useEffect(() => {
    dispatch(fetchUserProfile(user._id));
  }, [dispatch]);

  // Use profile data if available, otherwise fall back to user data from auth state
  const userData = profileData || user;
  // Get the default address from the user data
  const defaultAddress = userData?.defaultAddress;
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Profile Details</h2>
        <Link
          to="/profile/edit"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <FaEdit className="mr-2" />
          Edit Profile
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center">
          {userData?.image ? (
            <img
              src={userData.image || userData.image}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <FaUser className="text-gray-600 text-4xl" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              <p className="font-medium text-lg">
                {userData?.username || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium text-lg">
                {userData?.email || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Phone Number</p>
              <p className="font-medium text-lg">
                {userData?.phone || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Account Type</p>
              <p className="font-medium text-lg">
                {userData?.googleId ? "Google Account" : "Email & Password"}
              </p>
            </div>
            {userData?.referralCode && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Your Referral Code</p>
                <div className="flex items-center space-x-2">
                  <p className="font-mono font-semibold text-lg tracking-wider bg-gray-100 px-3 py-1 rounded">
                    {userData.referralCode}
                  </p>
                  <button
                    type="button"
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      navigator.clipboard.writeText(userData.referralCode);
                      toast.success('Referral code copied!');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            {invalidReferral && (
              <div className="md:col-span-2 bg-yellow-50 border border-yellow-300 rounded p-3">
                <p className="text-yellow-800 text-sm">
                  The referral code you entered during registration was invalid. You can still share your own code below.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Default Address Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Default Address</h3>
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <p>Loading address...</p>
          </div>
        ) : defaultAddress ? (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-start">
              <FaMapMarkerAlt className="text-red-500 mt-1 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">{defaultAddress.name}</p>
                <p className="text-gray-700">
                  {defaultAddress.addressLine1}
                  {defaultAddress.addressLine2 && `, ${defaultAddress.addressLine2}`}
                </p>
                <p className="text-gray-700">
                  {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
                </p>
                <p className="text-gray-700">{defaultAddress.country}</p>
                <p className="text-gray-700 mt-1">
                  <span className="font-medium">Phone:</span> {defaultAddress.phoneNumber}
                  {defaultAddress.alternativePhoneNumber && (
                    <span>, {defaultAddress.alternativePhoneNumber}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Link
                to="/profile/addresses"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Manage Addresses
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600">No default address set.</p>
            <Link
              to="/profile/addresses"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium block mt-2"
            >
              Add an address
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDetails;
