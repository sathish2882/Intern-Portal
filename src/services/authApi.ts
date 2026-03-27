import API from "./authInstance";

export const loginApi = (data: any) => {
  return API.post("/login", data);
};

export const signupApi = (data: any) => {
  return API.post("/signup", data);
};

export const logoutApi = () => {
  return API.post("/logout");
};

export const submitTestApi = (data: any) => {
  return API.post("/submit-test", data);
};
