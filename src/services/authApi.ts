import API from "./authInstance";

export const loginApi = (data: FormData) => {
  return API.post("/login", data);
};

export const signupApi = (data: FormData) => {
  return API.post("/signup", data);
};
