import api from "../../apis/user/api";

export const requestEmailChange = async (emailData) => {
  const response = await api.post("/change-email-request", emailData);
  return response.data;
};

export const verifyEmailChange = async (token) => {
  const response = await api.get(`/verify-email-change?token=${token}`);
  return response.data;
};

