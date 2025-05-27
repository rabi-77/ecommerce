// src/services/api/publicApi.js
import axios from "axios";

const publicApi = axios.create({
  baseURL: "http://localhost:5050/user",
});

export default publicApi;
