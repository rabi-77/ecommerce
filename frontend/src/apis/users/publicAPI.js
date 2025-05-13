// src/services/api/publicApi.js
import axios from "axios";

const publicApi = axios.create({
  baseURL: "http://localhost:5000/user",
});

export default publicApi;
