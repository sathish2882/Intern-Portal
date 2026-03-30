import axios from "axios";
import Cookies from "js-cookie";

const API = axios.create({
  baseURL: window.appConfig.baseURL,
});

// ✅ REQUEST INTERCEPTOR
API.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");

    // 🔥 Ensure headers exists
    config.headers = config.headers || {};

    // ✅ Only attach token for normal users
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Handle Content-Type
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔴 Unauthorized / Token expired → redirect to login
    if (error.response?.status === 401) {
      Cookies.remove("token");
      Cookies.remove("userType");
      window.location.hash = "#/login";
      return Promise.reject(error);
    }

    // 🔴 Server error
    if (error.response?.status === 500) {
      return Promise.reject(error);
    }

    // 🔴 Network error
    if (!error.response) {
      return Promise.reject(
        new Error("Network error. Please try again")
      );
    }

    return Promise.reject(error);
  }
);

export default API;