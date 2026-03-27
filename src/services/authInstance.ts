import axios from "axios";
import Cookies from "js-cookie";

const API = axios.create({
  baseURL: window.appConfig.baseURL,
});

API.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    } else if (config.headers && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },

  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
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
