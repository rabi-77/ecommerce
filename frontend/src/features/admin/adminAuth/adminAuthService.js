import api from "../../../apis/admin/api";

export const adminLogin = async (credentials) => {
  const response = await api.post("/login", credentials);
  return response.data;
};

export const refresh = async (refreshToken) => {
  const response = await api.post("/refresh", { refreshToken });
  return response.data;
};

export const logout = async (adminId) => {
  console.log("hi");
  console.log("kok");

  //  adminId={_id:ObjectId('6818831cfc0e3c611f62b727')}
  //     console.log('hiiii');
  //     console.log(adminId,'kkk');

  try {
    console.log(adminId);

    const response = await api.post("/logout", { admin: adminId });
    console.log("hey");
    return response.data;
  } catch (error) {
    console.error("Logout failed:", error.message);
  }
};
