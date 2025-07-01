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
  //  adminId={_id:ObjectId('6818831cfc0e3c611f62b727')}
  try {
    const response = await api.post("/logout", { admin: adminId });
    return response.data;
  } catch (error) {
    console.error("Logout failed:", error.message);
  }
};
