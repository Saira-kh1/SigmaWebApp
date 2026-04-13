import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  // Check for regular user token first
  const token = localStorage.getItem("token");
  
  // If no regular token, check for guest token
  const guestToken = localStorage.getItem("guestToken");
  
  // Use whichever token is available
  const authToken = token || guestToken;
  
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  
  return config;
});

// Optional: Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is expired or invalid
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      const guestToken = localStorage.getItem("guestToken");
      
      // If guest token expired, could auto-refresh here
      // For now, just log it
      if (guestToken && !token) {
        console.log("Guest token expired or invalid");
        // Could trigger a new guest session creation here
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;