// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});



// Attach token automatically
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("booknest_user"));

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

export default api;
