// src/services/api/publicApi.js
import axios from "axios";
import { API_URL } from "../../config";

const publicApi = axios.create({
  baseURL: `${API_URL}/user`,
});

export default publicApi;
