import axios from "axios";
import Cookies from "js-cookie";

const API = axios.create({
  baseURL: window.appConfig.baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },

  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== "/login") {
      Cookies.remove("token");
      window.location.href = "/login";
      return Promise.reject(error);
    }
    if (error.response?.status === 500) {
      return Promise.reject(error);
    }

    if (!error.response) {
      return Promise.reject(new Error("Network error. Please try again"));
    }

    return Promise.reject(error);
  },
);

export default API;